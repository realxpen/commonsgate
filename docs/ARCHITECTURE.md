# Architecture and decisions

```text
  Browser UI (public/)
          |
  localhost-only HTTP API (src/server.js)
          |
  Policy checks + grant/receipt logic (src/engine.js)
          |
  Fictional in-memory fixtures (src/fixtures.js)
```

## Four gates

1. **Purpose policy:** The proposed use must fall within the fictional community's permitted use categories.
2. **Community review:** The required number of fictional reviewers must approve, with any veto blocking access.
3. **Individual permission:** All fictional participants in the selected dataset must have compatible grants of permission.
4. **Steward review:** An illustrative, current steward check must match the terms of the request.

A 15-minute scoped token is returned only when all four pass. At every access attempt, the grant scope, expiry, current policy and permission checks are re-evaluated. Withdrawal or changed community policy invalidates active grants, preventing future simulated gateway access.

## What this does not model

- Real human identity, representative selection, accountability or disputes
- Lawful bases for health-data processing, clinical ethics approval, or withdrawal remedies
- Secure data federation, anonymisation, differential privacy or model unlearning
- Persistent, tamper-resistant audits and cross-node transaction isolation
- Financial benefit allocation or real-world benefit verification

The released code purposefully does not use React, TypeScript, Fastify or PostgreSQL; this first prototype is dependency-free to make the policy logic verifiable offline.
