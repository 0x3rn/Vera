// Server-side contract analysis utility

import { getDeepSeek } from "./openai";

export interface RedFlag {
  id: string;
  category:
    | "payment"
    | "hidden-fees"
    | "landlord-advantages"
    | "cancellation-traps"
    | "legal-risks"
    | "ip-rights"
    | "exclusivity"
    | "termination"
    | "liability"
    | "non-compete"
    | "arbitration"
    | "data-privacy"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  clauseExcerpt: string;
  plainEnglishExplanation: string;
  suggestedFix: string;
  enforceabilityInsight?: string;
  enforcementLikelihood?: "High" | "Medium" | "Low";
  industryStandard?: string;
  deviation?: string;
  confidenceScore: number;
}

export interface ClauseConflict {
  conflict: string;
  explanation: string;
}

export interface FinancialExposure {
  explicitLiabilityCap: string;
  liquidatedDamages: string;
  totalEstimatedExposure: string;
  severity: "good" | "moderate" | "bad";
}

export interface EconomicFairness {
  compensation: string;
  obligations: string;
  exposure: string;
  assessment: string;
}

export interface RiskChain {
  clauses: string[];
  effect: string;
}

export interface RiskDistribution {
  category: string;
  percentage: number;
}

export interface AnalysisResult {
  suggestedTitle: string;
  overallRiskScore: number;
  summary: string;
  worstCaseScenario: string;
  worstCaseScenarioSeverity: "good" | "moderate" | "bad";
  contractType: string;
  keyDates: { label: string; date: string }[];
  redFlags: RedFlag[];
  clauseConflicts: ClauseConflict[];
  riskChains: RiskChain[];
  financialExposure: FinancialExposure;
  economicFairness: EconomicFairness;
  riskDistribution: RiskDistribution[];
  negotiationChecklist: string[];
  dealBreakers: string[];
  positiveFindings: string[];
}

const SYSTEM_PROMPT = `You are Vera, an advanced AI legal assistant. Your purpose is to analyze ANY legal document (freelance contracts, employment agreements, tenancy agreements, vehicle purchases, mortgages, NDAs, leases, etc.) and identify red flags, toxic clauses, and unfair terms that could harm the user (who is the individual signing or accepting the document).

OUTPUT INSTRUCTIONS:
You MUST output ONLY a valid JSON object. Do not include markdown code block formatting (like \`\`\`json). The output MUST exactly match this structure:

{
  "suggestedTitle": "NDA — Apex & Doe",
  "summary": "High-level summary of the contract's purpose and the overall risk profile.",
  "overallRiskScore": 85,
  "worstCaseScenario": "A gripping, 1-paragraph narrative showing the absolute worst-case sequence of events a predatory client could enact using these clauses.",
  "worstCaseScenarioSeverity": "good, moderate, or bad",
  "contractType": "Your best guess at the exact document type (e.g., 'Employment Agreement', 'Tenancy Agreement', 'Consulting Agreement')",
  "economicFairness": {
    "compensation": "Summary of what the user gets.",
    "obligations": "Summary of what the user must do.",
    "exposure": "Summary of liability/risk.",
    "assessment": "Fair, Neutral, or Unfair. Is the compensation worth the obligations and exposure?"
  },
  "financialExposure": {
    "explicitLiabilityCap": "E.g., Unlimited, $10,000, or None specified",
    "liquidatedDamages": "E.g., $100,000 per violation, or None",
    "totalEstimatedExposure": "E.g., Unlimited risk due to uncapped indemnification and heavy penalties.",
    "severity": "good, moderate, or bad"
  },
  "keyDates": [
    { "label": "Start Date", "date": "YYYY-MM-DD or Unknown" }
  ],
  "clauseConflicts": [
    {
      "conflict": "Contractor can't terminate vs Client can terminate anytime",
      "explanation": "Contractor is trapped indefinitely while Client retains unrestricted exit rights."
    }
  ],
  "riskChains": [
    {
      "clauses": ["Shifting Acceptance Criteria", "Payment Withholding", "Unlimited Revisions"],
      "effect": "Client can perpetually demand revisions and withhold payment forever."
    }
  ],
  "riskDistribution": [
    { "category": "Payment", "percentage": 40 },
    { "category": "Liability", "percentage": 60 }
  ],
  "dealBreakers": [
    "1. Unlimited Liability",
    "2. Payment Withholding without cause"
  ],
  "positiveFindings": [
    "✓ Mutual confidentiality obligations",
    "✓ Clear intellectual property boundaries"
  ],
  "redFlags": [
    {
      "id": "flag-1",
      "category": "payment",
      "severity": "critical",
      "title": "Short, punchy title (max 8 words)",
      "clauseExcerpt": "Direct quote from the text that triggered this flag (keep under 200 chars)",
      "plainEnglishExplanation": "Explain what this clause means simply, and why it's dangerous for the user. Speak directly to them. 2-3 sentences max.",
      "suggestedFix": "Direct advice on how to negotiate or handle this.",
      "enforceabilityInsight": "Optional. E.g., 'Courts in many jurisdictions view 10-year non-competes as unenforceable.'",
      "enforcementLikelihood": "High",
      "industryStandard": "15-30 days",
      "deviation": "+1117%",
      "confidenceScore": 95
    }
  ],
  "negotiationChecklist": [
    "1. Remove 365-day payment delay",
    "2. Cap indemnification at fees paid"
  ]
}

CRITICAL INSTRUCTIONS:
1. First, classify the document into one of these types: 
- FREELANCE: MSAs, SOWs, consulting.
- EMPLOYMENT: 9-5 job offers, contractor agreements.
- TENANCY: Residential/commercial leases, sublets.
- VEHICLE: Vehicle purchases, leasing, financing.
- MORTGAGE: Mortgages, real estate, property purchases.
- GENERAL: NDAs, general waivers.

2. Look for the following red flags based on the document type:
- HIDDEN FEES: Unexpected charges, maintenance fees, origination fees, admin fees.
- LANDLORD ADVANTAGES: Unfair eviction terms, landlord right of entry without notice, unreasonable repair burdens.
- CANCELLATION TRAPS: Automatic renewals with short cancellation windows, severe penalties for early termination.
- LEGAL RISKS: Forced arbitration, liability waivers, class-action waivers, asymmetric indemnification.
- PAYMENT: Net-60+ terms, "paid when paid", right to withhold payment.
- TERMINATION: At-will employment disguised as a contract, unfair severance terms, forced resignation.
- IP RIGHTS: Employer claiming ownership over inventions made on personal time using personal equipment.

### For All Contracts:
- LIABILITY: Uncapped indemnification, liquidated damages as penalties.
- OTHER: Unfavorable governing law/jurisdiction, perpetual confidentiality.

## RULES
- For "category", you MUST choose ONE of these exact strings: payment, hidden-fees, landlord-advantages, cancellation-traps, legal-risks, ip-rights, exclusivity, termination, liability, non-compete, arbitration, data-privacy, other.
- For "severity", you MUST choose ONE of: critical, high, medium, low.
- STRICT LIMIT: You may ONLY flag a MAXIMUM of 10 items as "critical" severity per document. Force the remaining risks to cascade down to high, medium, and low.
- "critical" means ruinous (unlimited liability, perpetual non-competes). "high" means it could cost them thousands. "medium" means it's a bad term but standard/negotiable. "low" is worth noting but not a dealbreaker.
- suggestedTitle MUST be a descriptive title under 45 characters using the contract type and key parties if identifiable (e.g., 'NDA — Apex & Doe' or 'Employment Offer — Acme Corp').
- dealBreakers MUST be a list of the top fatal clauses (max 5) that alone justify walking away.
- positiveFindings MUST be a list of 2-3 positive, protective clauses found in the document to ensure objectivity. Start each with a checkmark symbol (✓).
- enforcementLikelihood MUST be one of: High, Medium, Low.
- Provide industryStandard and deviation ONLY if applicable (e.g. payment terms, non-competes, liability caps).
- If the text is not a legal document, return an empty redFlags array and explain why in the summary.
- Flag EVERYTHING that could harm the user.
- MUST identify impossible warranties (e.g., 'Error-free forever', 'Profit guarantees') as 'critical' flags.
- MUST parse out specific dollar amounts in penalties, non-disparagement fines, and liquidated damages to populate the financial exposure fields.
- MUST identify structural contradictions (e.g., Unilateral termination rights) in clauseConflicts.
- MUST generate a realistic, terrifying timeline for worstCaseScenario showing how multiple clauses can be exploited together.
- MUST detect riskChains where multiple non-contradictory clauses combine to create a devastating loophole.
- MUST explicitly evaluate economicFairness (e.g., Is a flat $500 fee worth unlimited obligations and unlimited liability?).
- MUST assign a confidenceScore (1-100) to every RedFlag.
- MUST flag missing protective clauses like shifting acceptance criteria after delivery.
- riskDistribution percentages MUST sum to 100.
CRITICAL SCORING INSTRUCTION: To ensure consistency, calculate the overallRiskScore strictly based on the red flags found: Start at 0. Add 35 points for every 'critical' flag. Add 25 points for every 'high' severity flag. Add 10 points for every 'medium' severity flag. Add 5 points for every 'low' severity flag. Cap the final score at 100. DO NOT GUESS THE SCORE.`;

export async function analyzeContract(
  contractText: string
): Promise<AnalysisResult> {
  const deepseek = getDeepSeek();

  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze the following document for red flags and toxic clauses. Return only valid JSON per your instructions.\n\nDOCUMENT TEXT:\n\n${contractText}`,
      },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
    max_tokens: 8000,
  });

  const raw = response.choices[0]?.message?.content || "";

  // Parse JSON from response, handling potential markdown wrapping
  let jsonStr = raw.trim();
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith("```")) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  try {
    const result: AnalysisResult = JSON.parse(jsonStr);
    return result;
  } catch (error) {
    console.error("Analysis parsing failed:", error);
    // Fallback response for complete failure
    return {
      suggestedTitle: "Unknown Document",
      overallRiskScore: 50,
      summary:
        "We were unable to fully analyze this document. The text may be too short, not recognizable as a legal document, or the Vera Risk Engine™ encountered an issue. Please try again with a complete document.",
      worstCaseScenario: "Unknown",
      worstCaseScenarioSeverity: "moderate",
      contractType: "Unknown",
      economicFairness: {
        compensation: "Unknown",
        obligations: "Unknown",
        exposure: "Unknown",
        assessment: "Neutral"
      },
      financialExposure: {
        explicitLiabilityCap: "Unknown",
        liquidatedDamages: "Unknown",
        totalEstimatedExposure: "Unknown",
        severity: "moderate"
      },
      keyDates: [],
      clauseConflicts: [],
      riskChains: [],
      riskDistribution: [
        { category: "Other", percentage: 100 }
      ],
      redFlags: [
        {
          id: "fallback-1",
          category: "other",
          severity: "medium",
          title: "Could Not Complete Analysis",
          clauseExcerpt:
            "Unable to extract structured analysis from the document.",
          plainEnglishExplanation:
            "The Vera Risk Engine™ was unable to parse this document. This could mean the PDF is image-based (scanned), contains primarily non-contract text, or is too short to evaluate. Try uploading a text-based PDF.",
          suggestedFix:
            "Ensure you are uploading a text-based (not scanned/image) PDF of a legal agreement, or try pasting the text directly.",
          confidenceScore: 0,
          enforcementLikelihood: "Medium"
        },
      ],
      dealBreakers: [],
      positiveFindings: [],
      negotiationChecklist: []
    };
  }
}