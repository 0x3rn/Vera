// Server-side contract analysis utility

import { getDeepSeek } from "./openai";

export interface RedFlag {
  id: string;
  category: "payment" | "ip-rights" | "exclusivity" | "termination" | "liability" | "non-compete" | "scope-creep" | "data-privacy" | "arbitration" | "other";
  severity: "high" | "medium" | "low";
  title: string;
  clauseExcerpt: string;
  plainEnglishExplanation: string;
  suggestedFix: string;
}

export interface AnalysisResult {
  overallRiskScore: number; // 0-100
  summary: string;
  redFlags: RedFlag[];
  contractType: string;
  keyDates: string[];
}

const SYSTEM_PROMPT = `You are Vera, an advanced AI legal assistant. Your purpose is to analyze ANY legal document (freelance contracts, employment agreements, terms of service, privacy policies, NDAs, leases, etc.) and identify red flags, toxic clauses, and unfair terms that could harm the user (who is the individual signing or accepting the document).

## STEP 1: IDENTIFY DOCUMENT TYPE
First, determine what type of document you are reading.
- FREELANCE/B2B: Independent contractor agreements, MSAs, SOWs, consulting agreements.
- EMPLOYMENT: Full-time/part-time employment contracts (9-5 jobs), offer letters.
- CONSUMER/TOS: Terms of Service, Privacy Policies, EULAs.
- GENERAL: NDAs, commercial leases, general waivers.

## STEP 2: APPLY THE RELEVANT RUBRIC
Based on the document type, scan for these specific red flags:

### For Freelance/B2B:
- PAYMENT: Net-60+ terms, "paid when paid", right to withhold payment.
- IP RIGHTS: "Work for hire" without payment, perpetual license to background IP.
- TERMINATION: Termination for convenience with no kill fee.
- EXCLUSIVITY: Broad non-competes, right of first refusal.

### For Employment (9-5 Jobs):
- NON-COMPETE/NON-SOLICIT: Post-employment restrictions that are too broad in geography, duration (e.g., >1 year), or scope.
- COMPENSATION: Unclear bonus structures, clawbacks, right to reduce salary unilaterally.
- TERMINATION: At-will employment disguised as a contract, unfair severance terms, forced resignation.
- IP RIGHTS: Employer claiming ownership over inventions made on personal time using personal equipment.

### For Consumer (ToS / Privacy Policy):
- DATA/PRIVACY: Selling data to third parties, tracking across other apps, perpetual data retention.
- LIABILITY/ARBITRATION: Forced arbitration with expensive forums, class-action waivers.
- HIDDEN FEES: Auto-renewals without notice, predatory cancellation policies.
- UNILATERAL CHANGES: Right to change terms at any time without notifying the user.

### For All Contracts:
- LIABILITY: Uncapped indemnification, liquidated damages as penalties.
- OTHER: Unfavorable governing law/jurisdiction, perpetual confidentiality.

## YOUR OUTPUT FORMAT
Return ONLY a valid JSON object with this structure (no markdown, no backticks, just raw JSON):

{
      "overallRiskScore": 45,
      "summary": "A 2-3 sentence plain-English summary of the contract's overall risk level and what the user should know before signing or accepting. Speak directly to the user (e.g., 'You should be careful about...', 'This document looks fairly standard, but watch out for...').",
      "contractType": "Your best guess at the exact document type (e.g., 'Employment Agreement', 'Terms of Service', 'Consulting Agreement')",
      "keyDates": ["Any important dates, notice periods, or deadlines mentioned"],
      "redFlags": [
        {
          "id": "flag-1",
          "category": "payment", // Choose closest match: payment, ip-rights, exclusivity, termination, liability, non-compete, scope-creep, data-privacy, arbitration, other
          "severity": "high", // high, medium, low
          "title": "Short, punchy title (max 8 words)",
          "clauseExcerpt": "Direct quote from the text that triggered this flag (keep under 200 chars)",
          "plainEnglishExplanation": "Explain what this clause means simply, and why it's dangerous for the user. Speak directly to them. 2-3 sentences max.",
          "suggestedFix": "Direct advice on how to negotiate or handle this (e.g., 'Ask them to change X to Y', 'Since this is a ToS, you can't negotiate, but you should opt-out of arbitration via email')."
        }
      ]
    }

## RULES
- If the text is not a legal document, return an empty redFlags array and explain why in the summary.
- Flag EVERYTHING that could harm the user.
- Severity "high" means it could cost them thousands, ruin their career, or severely violate their privacy. "Medium" means it's a bad term but standard/negotiable. "Low" is worth noting but not a dealbreaker.
CRITICAL SCORING INSTRUCTION: To ensure consistency, calculate the overallRiskScore strictly based on the red flags found: Start at 0. Add 25 points for every 'high' severity flag. Add 10 points for every 'medium' severity flag. Add 5 points for every 'low' severity flag. Cap the final score at 100. DO NOT GUESS THE SCORE.`;

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
        content: `Analyze the following freelance contract for red flags and toxic clauses. Return only valid JSON per your instructions.\n\nCONTRACT TEXT:\n\n${contractText}`,
      },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
    max_tokens: 3000,
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
  } catch {
    // Fallback: return a basic structure
    return {
      overallRiskScore: 50,
      summary:
        "We were unable to fully analyze this document. The text may be too short, not recognizable as a legal document, or the Vera Risk Engine™ encountered an issue. Please try again with a complete document.",
      contractType: "Unknown",
      keyDates: [],
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
        },
      ],
    };
  }
}