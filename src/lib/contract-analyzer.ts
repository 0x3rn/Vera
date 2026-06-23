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

export interface CapIllusion {
  isIllusory: boolean;
  explanation: string;
}

export interface FinancialExposure {
  explicitLiabilityCap: string;
  liquidatedDamages: string;
  totalEstimatedExposure: string;
  severity: "good" | "moderate" | "bad";
  capIllusion?: CapIllusion;
}

export interface EconomicFairness {
  compensation: string;
  obligations: string;
  exposure: string;
  assessment: string;
}

export interface MutualityAnalysis {
  termination: string;
  liability: string;
  ip: string;
  confidentiality: string;
  overall: string;
  riskMultiplier: number;
}

export interface ScoreBreakdown {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  baseScore: number;
  riskMultiplier: number;
  finalScore: number;
}

export interface RiskConcentration {
  category: string;
  percentage: number;
  warning: string;
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
  scoreBreakdown: ScoreBreakdown;
  scoreExplanation: string;
  riskConcentration: RiskConcentration | null;
  lawyerReview: string;
  verdict?: string;
  mutualityAnalysis: MutualityAnalysis;
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
  "scoreExplanation": "A 1-2 sentence explanation anchoring the meaning of the score (e.g., 'This score reflects a commercially realistic contract with significant liability risks, not a fraudulent or predatory agreement.').",
  "worstCaseScenario": "A gripping, 1-paragraph narrative showing the absolute worst-case sequence of events a predatory client could enact using these clauses.",
  "worstCaseScenarioSeverity": "good, moderate, or bad",
  "contractType": "Your best guess at the exact document type (e.g., 'Employment Agreement', 'Tenancy Agreement', 'Consulting Agreement')",
  "mutualityAnalysis": {
    "termination": "Client-heavy",
    "liability": "Client-heavy",
    "ip": "Mutual",
    "confidentiality": "Mutual",
    "overall": "Moderately one-sided",
    "riskMultiplier": 1.2
  },
  "economicFairness": {
    "compensation": "Summary of what the user gets.",
    "obligations": "Summary of what the user must do.",
    "exposure": "Summary of liability/risk.",
    "assessment": "Fair, Neutral, or Unfair."
  },
  "financialExposure": {
    "explicitLiabilityCap": "E.g., Unlimited, $10,000, or None specified",
    "liquidatedDamages": "E.g., $100,000 per violation, or None",
    "totalEstimatedExposure": "E.g., Unlimited risk due to uncapped indemnification and heavy penalties.",
    "severity": "good, moderate, or bad",
    "capIllusion": {
      "isIllusory": true,
      "explanation": "Liability appears capped at $12k, but critical exceptions (indemnification, IP) mean practical exposure is unlimited."
    }
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
- For "category", choose ONE of: payment, hidden-fees, landlord-advantages, cancellation-traps, legal-risks, ip-rights, exclusivity, termination, liability, non-compete, arbitration, data-privacy, other.
- SEVERITY CALIBRATION (IMPACT + MARKET PREVALENCE): Severity MUST reflect both financial impact AND how common the clause is.
- "critical" = Clauses that can realistically bankrupt, trap, or financially destroy the signer.
SEVERITY CALIBRATION

CRITICAL
- Unlimited liability
- Uncapped indemnification
- Unlimited data-breach liability
- Liability caps rendered meaningless by broad exceptions
- Personal guarantees
- Confession of judgment
- Perpetual non-competes
- Clauses requiring continued work without compensation

HIGH
- Uncapped IP indemnification (MUST FLAG if liability cap excludes IP)
- One-sided IP assignment
- One-sided fee shifting
- Broad audit rights
- Unilateral policy changes
- Long latent defect periods
- Forced assignment of improvements to contractor tools

MEDIUM
- Mutual fee shifting
- Delaware venue
- New York venue
- Standard arbitration
- Mutual non-solicitation
- Payment withholding of disputed amounts
- Inconvenient governing law

LOW
- Administrative requirements
- Standard notice periods
- Reasonable reporting obligations

IMPORTANT:

Each materially different risk MUST be returned as its own red flag.

Do NOT combine multiple risks into a single red flag.

BAD:
- "Fee-shifting and Delaware venue"

GOOD:
- "Prevailing party attorney fees"
- "Exclusive Delaware venue"

Every distinct clause or risk must be listed separately.

- IMPORTANT: Do NOT elevate standard commercial clauses (like Delaware venue, mutual fee-shifting, or mutual non-solicitation) to "High" severity.
- CAP ILLUSION: Actively look for liability caps that exclude "intellectual property" or "indemnification". If found, set capIllusion.isIllusory=true.
- NO BUNDLING: It is a FATAL ERROR to combine distinct risks using "and" or "with" (e.g. "Fee-shifting and New York venue"). You MUST create two completely separate JSON objects: one for Venue, one for Fee-Shifting.
- NO HALLUCINATIONS: Do not invent facts or powers not explicitly granted in the contract text (e.g., if the contract says Consultant controls defense, do not write that Client controls defense).
- COMPREHENSIVENESS: You must extract ALL obligations, restrictions, and costs, including non-solicitation clauses and insurance requirements, even if standard.
- FALSE POSITIVES: Do NOT flag indefinite confidentiality for "Trade Secrets" (this is standard).
- MUTUALITY ANALYSIS: Carefully read clauses to see if they apply to "either party" or "neither party". If a liability cap and its exceptions apply mutually to both, mark Liability as "Mutual", not "Client-heavy". Assign a "riskMultiplier": 1.0 (balanced), 1.2 (moderately one-sided), 1.5 (highly one-sided), 2.0 (predatory).
- POSITIVE FINDINGS: Actively look for protective clauses benefiting the user and add to positiveFindings.
- WORST CASE SCENARIO: Focus on the SINGLE most catastrophic chain of events. Do NOT stack unrelated disputes (e.g., don't combine an IP lawsuit with an unpaid invoice dispute unless one causes the other). Must be highly realistic and grounded in the actual text.
- FINANCIAL EXPOSURE: Accurately calculate the maximum dollar exposure. If a liability cap has exceptions for indemnification or IP, you MUST explicitly state in totalEstimatedExposure that exposure is "Unlimited due to uncapped indemnification."
- INSURANCE: If an insurance requirement is standard/reasonable for the industry, classify as Low risk. If unusually high or burdensome, classify as Medium risk.
- RISK CASCADES: Identify sequences of clauses (e.g., Scope changes + No compensation) and add to riskChains.
- suggestedTitle MUST be a descriptive title under 45 characters using the contract type and key parties if identifiable.
- dealBreakers MUST be a list of the top fatal clauses (max 5) that alone justify walking away.
- positiveFindings MUST be a list of 2-3 positive, protective clauses found in the document to ensure objectivity. Start each with a checkmark symbol (✓).
- enforcementLikelihood MUST be one of: High, Medium, Low.
- Provide industryStandard and deviation ONLY if applicable (e.g. payment terms, non-competes, liability caps).
- If the text is not a legal document, return an empty redFlags array and explain why in the summary.
- MUST explicitly evaluate economicFairness (e.g., Is a flat $500 fee worth unlimited obligations and unlimited liability?).
- MUST assign a confidenceScore (1-100) to every RedFlag.
- riskDistribution percentages MUST sum to 100.`;

function normalizeFlag(text: string, originalSeverity: string): { severity: "critical" | "high" | "medium" | "low", weight: number } {
  // CRITICAL (25-50)
  if (text.includes("confession of judgment") || text.includes("power of attorney granted")) return { severity: "critical", weight: 50 };
  if (text.includes("personal guarantee") || text.includes("personally liable") || text.includes("personal assets at risk")) return { severity: "critical", weight: 45 };
  if (text.includes("unilateral right to alter terms without notice") || text.includes("involuntary labor") || text.includes("continue working without payment") || text.includes("forced work") || text.includes("liquidated damages exceeding contract value") || text.includes("liquidated damages grossly exceeding")) return { severity: "critical", weight: 40 };
  if (text.includes("unlimited liability") || text.includes("no liability cap") || text.includes("perpetual non-compete") || text.includes("lifetime non-compete") || text.includes("worldwide non-compete") || text.includes("worldwide perpetual non-compete")) return { severity: "critical", weight: 35 };
  if (text.includes("cap does not apply to ip") || text.includes("cap does not apply to confidentiality") || text.includes("automatic wage forfeiture") || text.includes("forfeiture of earned commissions") || text.includes("liability cap exceptions nullify cap")) return { severity: "critical", weight: 30 };
  if (text.includes("uncapped ip indemnification") || text.includes("uncapped ip indemnity") || (text.includes("ip indemnification") && (text.includes("unlimited") || text.includes("uncapped") || text.includes("liability cap does not apply"))) || text.includes("uncapped indemnification") || text.includes("unlimited indemnification") || text.includes("landlord entry without notice") || text.includes("tenant responsible for all repairs") || text.includes("unlimited damages") || text.includes("waiver of right to defend") || text.includes("all attorney fees regardless of outcome") || text.includes("tenant responsible regardless of fault") || text.includes("continue services during dispute") || text.includes("company sole discretion on acceptance")) return { severity: "critical", weight: 25 };

  // HIGH (15-20)
  if (text.includes("net-90") || text.includes("net-120") || text.includes("pay-when-paid") || text.includes("pay-if-paid") || text.includes("right to withhold payment for any reason") || text.includes("non-solicitation > 24 months") || text.includes("non-compete > 12 months") || text.includes("exclusive vendor") || text.includes("limiting other clients") || text.includes("exclusivity preventing other clients")) return { severity: "high", weight: 20 };
  if (text.includes("auto-renewal without notice") || text.includes("evergreen") || text.includes("termination fee") || text.includes("liquidated damages for early exit") || text.includes("early termination fee > 2 months")) return { severity: "high", weight: 18 };
  if (text.includes("unilateral ip ownership transfer") || text.includes("mandatory arbitration in foreign jurisdiction") || text.includes("one-sided fee-shifting") || text.includes("one-sided attorney fees") || text.includes("assignment of pre-existing ip") || text.includes("unilateral ip assignment") || text.includes("broad audit rights") || text.includes("foreign venue") || text.includes("one-sided indemnification") || text.includes("mandatory arbitration") || text.includes("assignment without consent") || text.includes("no cure period before default")) return { severity: "high", weight: 15 };

  // MEDIUM (5-12)
  if (text.includes("net-60") || text.includes("exclusive venue in distant state") || text.includes("delaware venue") || text.includes("new york venue") || text.includes("inconvenient venue") || text.includes("foreign governing law")) return { severity: "medium", weight: 12 };
  if (text.includes("prevailing party") || text.includes("attorney fees") || text.includes("mutual fee shifting") || text.includes("right to audit") || text.includes("onerous insurance") || text.includes("non-solicitation 12 to 24 months") || text.includes("mutual non-solicitation") || text.includes("insurance requirements") || text.includes("fee shifting")) return { severity: "medium", weight: 10 };
  if (text.includes("assignment restriction") || text.includes("assignment with notice") || text.includes("short cure period") || text.includes("short cure periods") || text.includes("reasonable liquidated damages")) return { severity: "medium", weight: 8 };
  if (text.includes("net-45") || text.includes("mutual non-disparagement") || text.includes("limitation on consequential damages") || text.includes("payment withholding of disputed amounts") || text.includes("broad confidentiality") || text.includes("non-compete 6-12 months") || text.includes("broad force majeure")) return { severity: "medium", weight: 5 };

  // LOW (2)
  if (text.includes("trade secret") && (text.includes("indefinite") || text.includes("perpetual") || text.includes("no expiration"))) return { severity: "low", weight: 2 };
  if (text.includes("standard insurance") || text.includes("reasonable insurance") || text.includes("mutual confidentiality") || text.includes("force majeure") || text.includes("severability") || text.includes("entire agreement") || text.includes("net-30") || text.includes("standard arbitration") || text.includes("mutual venue")) return { severity: "low", weight: 2 };

  // FALLBACK
  if (originalSeverity === "critical") return { severity: "critical", weight: 25 };
  if (originalSeverity === "high") return { severity: "high", weight: 15 };
  if (originalSeverity === "medium") return { severity: "medium", weight: 5 };
  return { severity: "low", weight: 2 };
}

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
  
    // DEDUPLICATE REDUNDANT FLAGS
    const seen = new Set<string>();
    result.redFlags = (result.redFlags || []).filter(flag => {
      const text = (
        (flag.title || "") +
        " " +
        (flag.plainEnglishExplanation || "")
      ).toLowerCase();

      let bucket = "";

      const isIpRisk = text.includes("ip indemn") || text.includes("intellectual property");
      const isCapRisk = text.includes("liability cap") && (text.includes("exception") || text.includes("excluded") || text.includes("nullify") || text.includes("does not apply"));

      if (isIpRisk || (isCapRisk && (text.includes("ip") || text.includes("intellectual property")))) {
        bucket = "ip-unlimited-exposure";
      } else if (isCapRisk && text.includes("confidentiality")) {
        bucket = "confidentiality-unlimited-exposure";
      } else if (isCapRisk) {
        bucket = "cap-illusion";
      }

      if (!bucket) return true;

      if (seen.has(bucket)) {
        return false;
      }

      seen.add(bucket);
      return true;
    });

    // NORMALIZE / OVERRIDE BAD SEVERITIES WITH COMPREHENSIVE TAXONOMY
    (result.redFlags || []).forEach(flag => {
      const text = `${flag.title || ""} ${flag.clauseExcerpt || ""} ${flag.plainEnglishExplanation || ""}`.toLowerCase();
      const normalized = normalizeFlag(text, flag.severity || "medium");
      flag.severity = normalized.severity;
      (flag as any)._baseWeight = normalized.weight;
    });

    // GLOBAL CONTEXT AUTO-ESCALATION RULES
    const allText = JSON.stringify(result.redFlags).toLowerCase();

    // Rule 1: payment withholding + continued performance
    if (allText.includes("payment withholding") && allText.includes("continued performance")) {
      if (!allText.includes("forced work without guaranteed payment")) {
        result.redFlags.push({
          id: "auto-rule-1",
          category: "payment",
          severity: "critical",
          title: "Forced work without guaranteed payment",
          clauseExcerpt: "",
          plainEnglishExplanation: "The contract allows the client to withhold payment while forcing you to continue working, which is effectively involuntary labor.",
          suggestedFix: "Add a right to suspend work if payment is withheld.",
          confidenceScore: 100,
          enforcementLikelihood: "High"
        });
      }
    }

    // Rule 2: liability cap + exceptions
    if (
      allText.includes("liability cap") && 
      (allText.includes("ip exception") || allText.includes("indemnity exception") || allText.includes("confidentiality exception") || allText.includes("intellectual property"))
    ) {
      const alreadyExists = result.redFlags.some(flag => {
        const text = ((flag.title || "") + " " + (flag.plainEnglishExplanation || "")).toLowerCase();
        return (
          text.includes("liability cap") ||
          text.includes("cap exception") ||
          text.includes("cap does not apply") ||
          text.includes("uncapped indemnification") ||
          text.includes("ip indemnification") ||
          text.includes("liability cap exceptions nullify cap")
        );
      });
      if (!alreadyExists) {
        result.redFlags.push({
          id: "auto-rule-2",
          category: "liability",
          severity: "critical",
          title: "Liability cap exceptions nullify cap",
          clauseExcerpt: "",
          plainEnglishExplanation: "The contract appears to cap liability but broad exceptions make exposure effectively unlimited.",
          suggestedFix: "Narrow exceptions or cap them separately.",
          confidenceScore: 100,
          enforcementLikelihood: "High"
        });
      }
    }

    // Rule 3: personal guarantee + unlimited liability
    if (allText.includes("personal guarantee") && allText.includes("unlimited liability")) {
      if (!allText.includes("personal assets exposed to unlimited claims")) {
        result.redFlags.push({
          id: "auto-rule-3",
          category: "liability",
          severity: "critical",
          title: "Personal assets exposed to unlimited claims",
          clauseExcerpt: "",
          plainEnglishExplanation: "You are personally guaranteeing the contract and your liability is unlimited, exposing your personal savings and property.",
          suggestedFix: "Remove the personal guarantee and cap liability.",
          confidenceScore: 100,
          enforcementLikelihood: "High"
        });
      }
    }

    // Rule 4: automatic renewal + termination penalty
    if (allText.includes("automatic renewal") && allText.includes("termination penalty")) {
      if (!allText.includes("trapped renewal")) {
        result.redFlags.push({
          id: "auto-rule-4",
          category: "termination",
          severity: "high",
          title: "Trapped Renewal: Auto-renews with penalties for exiting",
          clauseExcerpt: "",
          plainEnglishExplanation: "The contract automatically renews, and trying to terminate it triggers a penalty, trapping you in the agreement.",
          suggestedFix: "Remove automatic renewal or remove the termination penalty.",
          confidenceScore: 100,
          enforcementLikelihood: "High"
        });
      }
    }

    // Rule 5: one-sided attorney fees + arbitration chosen by other party
    if (allText.includes("one-sided attorney fees") && allText.includes("arbitration chosen by other party")) {
      if (!allText.includes("dispute process structurally stacked")) {
        result.redFlags.push({
          id: "auto-rule-5",
          category: "legal-risks",
          severity: "critical",
          title: "Dispute process structurally stacked against signer",
          clauseExcerpt: "",
          plainEnglishExplanation: "The other party gets to choose the arbitration venue and you have to pay their attorney fees if they win, making it practically impossible for you to win a dispute.",
          suggestedFix: "Make attorney fees mutual and require a neutral arbitration body.",
          confidenceScore: 100,
          enforcementLikelihood: "High"
        });
      }
    }

    
    // count the final severities and dynamically calculate base score
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let baseScore = 0;
    const categoryCounts: Record<string, number> = {};

    (result.redFlags || []).forEach(flag => {
      let flagBase = (flag as any)._baseWeight || 5;

      if (flag.severity === "critical") criticalCount++;
      else if (flag.severity === "high") highCount++;
      else if (flag.severity === "medium") mediumCount++;
      else if (flag.severity === "low") lowCount++;

      // Dynamic Likelihood Multiplier
      if (flag.enforcementLikelihood === "High") {
        flagBase *= 1.2;
      } else if (flag.enforcementLikelihood === "Low") {
        flagBase *= 0.8;
      }

      // Confidence Multiplier (penalize low confidence)
      if (flag.confidenceScore < 80) {
        flagBase *= (flag.confidenceScore / 100);
      }

      baseScore += flagBase;
      categoryCounts[flag.category] = (categoryCounts[flag.category] || 0) + 1;
    });

    // POSITIVE FINDINGS (Negative Score Adjustments)
    let negativeScore = 0;
    (result.positiveFindings || []).forEach(finding => {
      const text = finding.toLowerCase();
      if (text.includes("uncapped liability for client breach")) negativeScore += 15;
      else if (text.includes("payment upfront") || text.includes("net-15") || text.includes("net-0") || text.includes("strict liability cap") || text.includes("limited liability") && text.includes("reasonable")) negativeScore += 10;
      else if (text.includes("mutual indemnification") || text.includes("venue in consultant's home state") || text.includes("venue in your home") || text.includes("explicit retention of pre-existing ip") || text.includes("client must pay undisputed amounts") || text.includes("mutual termination") || text.includes("net-30")) negativeScore += 5;
    });

    // Apply negative score reduction
    baseScore = Math.max(0, baseScore - negativeScore);

    // Enforce Dealbreakers sync: Any backend-upgraded Critical flag MUST appear in dealBreakers
    result.dealBreakers = result.dealBreakers || [];
    (result.redFlags || []).forEach(flag => {
      if (flag.severity === "critical") {
        const isAlreadyListed = result.dealBreakers.some(db => 
          db.toLowerCase().includes(flag.title.toLowerCase()) || 
          flag.title.toLowerCase().includes(db.toLowerCase())
        );
        if (!isAlreadyListed && result.dealBreakers.length < 5) {
          result.dealBreakers.push(`FATAL RISK: ${flag.title}`);
        }
      }
    });

    // Score Calibration: Compound penalties for multiple criticals
    if (criticalCount >= 2) baseScore += 10;
    if (criticalCount >= 4) baseScore += 15;
    if (criticalCount >= 6) baseScore += 20;
      
    const multiplier = result.mutualityAnalysis?.riskMultiplier || 1.0;
    let finalScore = Math.min(Math.round(baseScore * multiplier), 100);

    // Exposure-based automatic boost
    if (result.financialExposure?.totalEstimatedExposure?.toLowerCase().includes("unlimited")) {
      finalScore = Math.min(finalScore + 10, 100);
    }

    // Score Sanity Check
    if (criticalCount === 1 && mediumCount <= 3 && multiplier <= 1.2 && finalScore > 80) {
      finalScore = 78;
    }

    result.overallRiskScore = finalScore;
    
    if (criticalCount >= 4 || finalScore >= 90) {
      result.verdict = "CRITICAL WARNING: DO NOT SIGN";
      result.lawyerReview = "Essential";
    } else if (criticalCount >= 2 || finalScore >= 75) {
      result.verdict = "WARNING: PROCEED WITH EXTREME CAUTION";
      result.lawyerReview = "Strongly Recommended";
    } else if (finalScore >= 45) {
      result.verdict = "MODERATE RISK: NEGOTIATE BEFORE SIGNING";
      result.lawyerReview = "Recommended";
    } else {
      result.verdict = "PASSED: GENERALLY ACCEPTABLE";
      result.lawyerReview = "Optional";
    }

    result.scoreBreakdown = {
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      baseScore,
      riskMultiplier: multiplier,
      finalScore
    };

    // Programmatic Risk Concentration Logic
    const totalFlags = (result.redFlags || []).length;
    result.riskConcentration = null;
    if (totalFlags > 0) {
      for (const [category, count] of Object.entries(categoryCounts)) {
        const percentage = Math.round((count / totalFlags) * 100);
        if (percentage >= 40 && count >= 2) {
          result.riskConcentration = {
            category,
            percentage,
            warning: `${percentage}% of all identified risks belong to the '${category}' category. This agreement concentrates risk exposure heavily on one side.`
          };
          break; // Only capture the largest one
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Analysis parsing failed:", error);
    // Fallback response for complete failure
    return {
      suggestedTitle: "Unknown Document",
      overallRiskScore: 50,
      summary:
        "We were unable to fully analyze this document. The text may be too short, not recognizable as a legal document, or the Vera Risk Engine™ encountered an issue. Please try again with a complete document.",
      scoreExplanation: "Analysis could not be completed.",
      lawyerReview: "Recommended",
      scoreBreakdown: {
        criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, baseScore: 50, riskMultiplier: 1.0, finalScore: 50
      },
      riskConcentration: null,
      mutualityAnalysis: {
        termination: "Unknown", liability: "Unknown", ip: "Unknown", confidentiality: "Unknown", overall: "Unknown", riskMultiplier: 1.0
      },
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