# Test Cases for Product Sandbox

These scenarios are designed to:
- Stress-test the multi-agent reasoning,
- Expose unrealistic outputs,
- Show judges we handle serious PM decisions, not toy ideas.

Use each as a POST body to `/analyze` with the INPUT_SCHEMA:

{
  "feature_name": "string",
  "description": "string",
  "target_user": "string",
  "business_goal": "string"
}

For every test, the response MUST:
- Match `OUTPUT_SCHEMA` exactly.
- Be realistic, specific, and non-generic.
- Fill all sections.

---

## 1. BNPL for Cross-Border Luxury Market

**feature_name:** "Cross-Border BNPL for Luxury Orders"  
**description:** "Enable high-ticket international shoppers to split $500–$5000 orders into installments using a third-party BNPL provider, including FX and fraud checks."  
**target_user:** "Affluent cross-border shoppers buying luxury goods online"  
**business_goal:** "Increase conversion on high-value carts without exploding fraud and chargebacks"

**What to look for:**
- Engineer: Higher complexity (3–5 sprints, multiple engineers), mentions FX, KYC, risk engines.
- Competitors: Klarna, Stripe, Adyen, major luxury platforms.
- Risk: HIGH (compliance, fraud, chargebacks).
- Recommendation: Cautious, with clear constraints (pilot, limits, controls).
- Upskilling: `payment_integrations`, `security`.

---

## 2. AI Risk Scoring for Small Business Loans (Reg-Heavy)

**feature_name:** "AI SME Credit Risk Scoring"  
**description:** "Use transactional + behavioral data to auto-score small businesses and pre-approve loans."  
**target_user:** "Small businesses applying for loans under $250K"  
**business_goal:** "Reduce manual underwriting time while managing default risk and compliance"

**What to look for:**
- Engineer: Non-trivial (3–6 sprints), data, ML infra, audits.
- Competitors: Fintech lenders, credit bureaus, neobank tooling.
- Risk: HIGH (regulation, bias, explainability).
- Rec: Heavily caveated (sandbox only, strong governance).
- Upskilling: `ml_personalization` / `security` / `infra_scalability` depending on prompt tuning.

---

## 3. “Invisible KYC”: Frictionless ID Verification

**feature_name:** "Invisible KYC at Signup"  
**description:** "Run passive identity checks using device, network, and behavioral signals to reduce KYC friction for legit users while flagging risky ones."  
**target_user:** "New users signing up to a financial app"  
**business_goal:** "Increase signup completion while maintaining compliance"

**What to look for:**
- Engineer: Moderate/complex (2–4 sprints), integration with third-party KYC vendors.
- Competitors: Stripe Identity, Onfido, Persona.
- Risk: MEDIUM/HIGH (false positives, regulations).
- Rec: Proceed as experiment with guardrails.
- Upskilling: `security`.

---

## 4. AI-Generated Portfolio Nudges for Wealth Clients

**feature_name:** "AI Portfolio Health Nudges"  
**description:** "Send personalized, AI-generated nudges to wealth clients about diversification, risk drift, and opportunities based on their current portfolio."  
**target_user:** "Mass affluent + HNW clients using mobile/web investment platforms"  
**business_goal:** "Increase engagement, perceived value, and AUM retention"

**What to look for:**
- Engineer: 2–4 sprints (data pipeline + content gen).
- Competitors: Robo-advisors, big wealth platforms.
- Risk: MEDIUM (suitability, advice vs information blur).
- Rec: Often positive with strong compliance review.
- Upskilling: `ml_personalization`.

---

## 5. Real-Time Outage Trust Dashboard for Enterprise Clients

**feature_name:** "Real-Time Incident & SLA Transparency Dashboard"  
**description:** "Expose live uptime, incident timelines, mitigations, and SLAs to enterprise customers in one authenticated dashboard."  
**target_user:** "Enterprise admins relying on mission-critical APIs"  
**business_goal:** "Increase trust, reduce churn, and deflect support tickets during incidents"

**What to look for:**
- Engineer: 2–3 sprints, integrations with monitoring tools.
- Competitors: Cloud providers’ status pages.
- Risk: LOW/MEDIUM (must not expose internal chaos; accuracy matters).
- Rec: Usually strong YES.
- Upskilling: `infra_scalability`.

---

## 6. Smart Feature Kill-Switch & Rollback Platform

**feature_name:** "Safe Launch: Feature Kill-Switch Panel"  
**description:** "Centralized UI + API to toggle features, roll back configs, and isolate experiments instantly per region/segment."  
**target_user:** "Internal engineering + SRE teams"  
**business_goal:** "Reduce blast radius, speed up experimentation, increase deployment safety"

**What to look for:**
- Engineer: 3–5 sprints, infra and tooling.
- Competitors: LaunchDarkly, Split.io, custom internal tools.
- Risk: MEDIUM (if misconfigured).
- Rec: Strong YES for scaling orgs.
- Upskilling: `infra_scalability`.

---

## 7. “Hyper-Personalized Fees” (Ethically Spicy)

**feature_name:** "Dynamic Personalized Fees Engine"  
**description:** "Adjust fees per user based on behavior, risk profile, and profitability signals."  
**target_user:** "Active users of a financial platform"  
**business_goal:** "Maximize revenue per user"

**What to look for:**
- Engineer: 2–4 sprints.
- Competitors: Pricing engines in fintech/airlines.
- Risk: HIGH (fairness, optics, regulation).
- Rec: Likely NO / heavily red-flagged → this shows your system can say ‘don’t do this’.
- Upskilling: `security` / `ethics` if mentioned.

---

## 8. AI “Ghost Writer” for Support Agents

**feature_name:** "AI Draft Replies for Support"  
**description:** "Suggest draft responses to support tickets that agents can edit and send; integrated into internal console."  
**target_user:** "Tier 1 support agents at a bank or SaaS company"  
**business_goal:** "Reduce handle time while improving quality and consistency"

**What to look for:**
- Engineer: 2–3 sprints.
- Competitors: Intercom, Zendesk AI, Ada.
- Risk: MEDIUM (hallucinations, tone).
- Rec: YES with human-in-the-loop constraint.
- Upskilling: `ml_personalization` / tooling.

---

## How to Use These

For each case:

1. Send the JSON body to `POST /analyze`.
2. Verify:
   - Response matches `OUTPUT_SCHEMA` exactly.
   - No missing fields.
   - Values are realistic (no 0 sprints for massive work, no made-up companies).
3. If responses are:
   - Too generic → tighten prompts in `prompts.md` to demand specificity.
   - Too optimistic → instruct Engineer Agent to be conservative.
   - Too chaotic → reinforce JSON-only, no commentary.

If a single prompt tweak fixes multiple cases, keep it.
If a tweak breaks more than it helps, revert.

The goal:
By the time you demo, running ANY of these looks:
- Sane
- Strategic
- Non-gimmicky
- Judge-ready.
ok