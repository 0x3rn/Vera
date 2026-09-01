import { adminDb } from "./firebase/admin";
import { checkIsPro } from "./subscription";

const BASE_SCANS = 1;
const RESERVATION_TTL_MS = 15 * 60 * 1000;

type Reservation = {
  status: "reserved" | "settled" | "released";
  charged: boolean;
  created_at: string;
};

export type ScanReservation = {
  id: string;
  charged: boolean;
  remaining: number | null;
  isPro: boolean;
  alreadyInProgress: boolean;
};

export class ScanEntitlementError extends Error {
  readonly status = 402;

  constructor() {
    super("Free scans exhausted");
    this.name = "ScanEntitlementError";
  }
}

export async function reserveScan(uid: string, reservationId: string): Promise<ScanReservation> {
  const userRef = adminDb.collection("users").doc(uid);
  const reservationRef = userRef.collection("scan_reservations").doc(reservationId);

  return adminDb.runTransaction(async (transaction) => {
    const activeReservationsQuery = userRef.collection("scan_reservations").where("status", "==", "reserved");
    const [userSnapshot, reservationSnapshot, activeReservationsSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(reservationRef),
      transaction.get(activeReservationsQuery),
    ]);
    if (!userSnapshot.exists) throw new Error("User profile is missing.");

    const existing = reservationSnapshot.exists ? reservationSnapshot.data() as Reservation : null;
    if (existing && existing.status !== "reserved") throw new Error("This scan request has already completed.");

    const data = userSnapshot.data() || {};
    const isPro = checkIsPro(data);
    const total = BASE_SCANS + Math.max(0, Number(data.bonus_scans) || 0);
    const used = Math.max(0, Number(data.free_scans_used) || 0);
    const now = Date.now();
    let activeChargedReservations = 0;

    for (const snapshot of activeReservationsSnapshot.docs) {
      const reservation = snapshot.data() as Reservation;
      const createdAt = Date.parse(reservation.created_at);
      const isStale = !Number.isFinite(createdAt) || now - createdAt > RESERVATION_TTL_MS;
      if (isStale) {
        if (snapshot.id !== reservationId) {
          transaction.update(snapshot.ref, { status: "released", released_at: new Date(now).toISOString(), release_reason: "expired" });
        }
      } else if (snapshot.id !== reservationId && reservation.charged) {
        activeChargedReservations += 1;
      }
    }

    const existingCreatedAt = existing ? Date.parse(existing.created_at) : Number.NaN;
    const existingIsActive = Boolean(existing && Number.isFinite(existingCreatedAt) && now - existingCreatedAt <= RESERVATION_TTL_MS);
    if (!isPro && used + activeChargedReservations >= total) throw new ScanEntitlementError();

    if (existingIsActive && existing) {
      return {
        id: reservationId,
        charged: existing.charged,
        remaining: isPro ? null : Math.max(0, total - used - activeChargedReservations - (existing.charged ? 1 : 0)),
        isPro,
        alreadyInProgress: true,
      };
    }

    const charged = !isPro;
    const reservation: Reservation = {
      status: "reserved",
      charged,
      created_at: existingIsActive && existing ? existing.created_at : new Date(now).toISOString(),
    };
    if (existing) transaction.update(reservationRef, reservation);
    else transaction.create(reservationRef, reservation);
    return {
      id: reservationId,
      charged,
      remaining: isPro ? null : Math.max(0, total - used - activeChargedReservations - 1),
      isPro,
      alreadyInProgress: false,
    };
  });
}

export async function settleScan(uid: string, reservationId: string, scan: Record<string, unknown>): Promise<void> {
  const userRef = adminDb.collection("users").doc(uid);
  const reservationRef = userRef.collection("scan_reservations").doc(reservationId);
  const scanRef = userRef.collection("scans").doc(reservationId);

  await adminDb.runTransaction(async (transaction) => {
    const [userSnapshot, reservationSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(reservationRef),
    ]);
    if (!userSnapshot.exists) throw new Error("User profile is missing.");
    if (!reservationSnapshot.exists) throw new Error("Scan reservation was not found.");
    const reservation = reservationSnapshot.data() as Reservation;
    if (reservation.status === "settled") return;
    if (reservation.status !== "reserved") throw new Error("Scan reservation is no longer active.");
    if (reservation.charged) {
      const used = Math.max(0, Number(userSnapshot.data()?.free_scans_used) || 0);
      transaction.update(userRef, { free_scans_used: used + 1 });
    }
    transaction.create(scanRef, scan);
    transaction.update(reservationRef, { status: "settled", settled_at: new Date().toISOString() });
  });
}

export async function releaseScan(uid: string, reservationId: string): Promise<void> {
  const userRef = adminDb.collection("users").doc(uid);
  const reservationRef = userRef.collection("scan_reservations").doc(reservationId);

  await adminDb.runTransaction(async (transaction) => {
    const reservationSnapshot = await transaction.get(reservationRef);
    if (!reservationSnapshot.exists) return;
    const reservation = reservationSnapshot.data() as Reservation;
    if (reservation.status !== "reserved") return;
    transaction.update(reservationRef, { status: "released", released_at: new Date().toISOString() });
  });
}

export function getRemainingScans(data: Record<string, unknown> | null | undefined): number | null {
  if (checkIsPro(data)) return null;
  const total = BASE_SCANS + Math.max(0, Number(data?.bonus_scans) || 0);
  const used = Math.max(0, Number(data?.free_scans_used) || 0);
  return Math.max(0, total - used);
}
