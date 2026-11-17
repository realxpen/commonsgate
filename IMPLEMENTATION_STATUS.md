# CommonsGate v0.1 — Implementation status

Date: 16 November 2026

## Completed in this exploratory build

- Working browser policy lab with Allow, Community Veto, and Individual Withdrawal scenarios.
- Real Node.js local API and policy engine; decisions are evaluated server-side.
- Scope-bound 15-minute grants; hash of access token stored, not plaintext.
- Four gates: community purpose policy, reviewer approval, individual permission, and data steward check.
- Later access blocked after permission withdrawal or simulated policy change.
- Reason-coded, hash-linked demonstration receipts.
- Fictional fixtures: 24 participants, 2 communities, 3 datasets, 4 policy definitions, 6 requests, 2 benefit commitments.
- All 20 automated API and engine tests pass (including two additional HTTP release-boundary checks); browser presentation checked at desktop and mobile widths with test responses.

## What this proof of concept does **not** establish

- No real-world community decisions, SRHIN approval, clinical reliability, legal compliance, ethics review or live data processing.
- Not independently audited, penetration-tested, securely authenticated, production-ready or resilient to cross-process concurrency.
- Browser screenshots were captured using fixed test responses because the preview browser could not connect to localhost; live HTTP endpoints were exercised by automated API tests.
- This release is GitHub-ready; publication depends on creation of a new repository. No public API deployment is recommended.

## Immediate recommended next gate

Validate with SRHIN whether the distinctive problem is unmet before spending effort on infrastructure. If it is, define the minimum governance model with authorised participants and proceed to production-grade authentication, policy versioning, transaction-safe persistence and accessibility co-design.
