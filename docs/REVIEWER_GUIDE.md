# Five-minute reviewer guide

This repository is the **proof of concept**, not a production system, partner deployment, or medically approved product.

**What the project explores:** Can a research-data gateway enforce a combination of purpose rules, fictional community-review decisions, participant permissions and a steward check before returning results?

## Run it

1. Use Node.js 20+ (`node --version`). No package installation required.
2. Run `npm test` and confirm the local tests pass.
3. Run `npm start`, visit `http://127.0.0.1:4173` on the same computer.
4. Click the **Allow**, **Deny**, and **Revoke** scenarios in turn.

## Evidence to inspect

| Scenario | What to check | Where it is implemented |
| --- | --- | --- |
| Allow | Four gates pass, scoped grant issued, fabricated aggregate returned | `src/engine.js` (`evaluate`, `access`) |
| Deny | One fictional reviewer veto blocks request | `src/engine.js` (`checks`, `evaluate`) |
| Revoke | Permission withdrawal revokes a grant and later access is rejected | `src/engine.js` (`withdrawConsent`, `access`) |
| Security caveat | Demo actor IDs are spoofable; never expose this service publicly | `src/server.js`, `SECURITY.md` |

## Evidence and honesty boundaries

- 24 fictional records; no real people or clinical results
- Local demo, not a publicly deployed service or user pilot
- Hash-linked receipts are in-memory, not immutable or independent attestations
- Revocation stops **future requests**; it cannot recall previously downloaded information or undo model training
- Open-source source code is not proof of community acceptance, operational security or legal compliance

Feedback wanted: Which real governance decisions are difficult to enforce today, who has standing to make them, and how might a community independently challenge or audit an access decision?
