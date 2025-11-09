# Upskilling Insights Logic

We derive `upskilling_insights` from `engineer_analysis.key_risks`.

Heuristic:

1. Read each string in `key_risks`.
2. Match on simple keywords.
3. Map them to bottleneck skills + suggested training.

Mappings:

- If risk contains: "payment", "checkout", "gateway", "BNPL"
  → bottleneck_skill: "payment_integrations"
  → training: "Deep dive on secure payment APIs, BNPL flows, and PCI basics."

- If risk contains: "security", "fraud", "breach", "encryption"
  → bottleneck_skill: "security"
  → training: "Workshop on secure coding, authentication, and OWASP Top 10."

- If risk contains: "scale", "scalability", "latency", "traffic", "load"
  → bottleneck_skill: "infra_scalability"
  → training: "Session on scaling microservices, caching, and observability."

Algorithm (for backend):

1. Start with empty `bottleneck_skills` and `suggested_training`.
2. For each risk:
   - Check for the above keywords (case-insensitive).
   - Add the relevant bottleneck_skill if not already present.
   - Add the corresponding training text if not already present.
3. Return:

"upskilling_insights": {
  "bottleneck_skills": [...],
  "suggested_training": [...]
}
