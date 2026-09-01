export type RiskBand = "acceptable" | "moderate" | "high" | "critical";

export function getRiskBand(score: number): RiskBand {
  if (score >= 90) return "critical";
  if (score >= 75) return "high";
  if (score >= 45) return "moderate";
  return "acceptable";
}

export function getRiskLabel(score: number): string {
  const band = getRiskBand(score);
  return band === "acceptable" ? "Generally acceptable" : band[0].toUpperCase() + band.slice(1);
}
