import { describe, expect, it } from "vitest";
import { getRiskBand, getRiskLabel } from "./risk";

describe("risk bands", () => {
  it.each([[0, "acceptable"], [44, "acceptable"], [45, "moderate"], [74, "moderate"], [75, "high"], [89, "high"], [90, "critical"], [100, "critical"]] as const)(
    "maps %s to %s", (score, expected) => expect(getRiskBand(score)).toBe(expected),
  );

  it("uses consistent public labels", () => {
    expect(getRiskLabel(45)).toBe("Moderate");
    expect(getRiskLabel(90)).toBe("Critical");
  });
});
