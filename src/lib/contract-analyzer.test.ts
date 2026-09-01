import { describe, expect, it } from "vitest";
import { parseRawAnalysisPayload } from "./contract-analyzer";

const validPayload = {
  suggestedTitle: "NDA — Example",
  scoreExplanation: "The contract contains limited risk.",
  summary: "A mutual confidentiality agreement.",
  worstCaseScenario: "A confidential disclosure causes a dispute.",
  worstCaseScenarioSeverity: "moderate",
  contractType: "NDA",
  mutualityAnalysis: { termination: "Mutual", liability: "Mutual", ip: "Mutual", confidentiality: "Mutual", overall: "Balanced", riskMultiplier: 1 },
  economicFairness: { compensation: "None", obligations: "Mutual", exposure: "Limited", assessment: "Fair" },
  financialExposure: { explicitLiabilityCap: "None", liquidatedDamages: "None", totalEstimatedExposure: "Unknown", severity: "moderate" },
  keyDates: [], redFlags: [], clauseConflicts: [], riskChains: [], riskDistribution: [], negotiationChecklist: [], dealBreakers: [], positiveFindings: [],
};

describe("AI output schema", () => {
  it("accepts a complete bounded response", () => {
    expect(parseRawAnalysisPayload(validPayload).contractType).toBe("NDA");
  });

  it("rejects malformed success-shaped output", () => {
    expect(() => parseRawAnalysisPayload({ ...validPayload, redFlags: "oops" })).toThrow();
    expect(() => parseRawAnalysisPayload({ ...validPayload, mutualityAnalysis: { ...validPayload.mutualityAnalysis, riskMultiplier: 999 } })).toThrow();
  });
});
