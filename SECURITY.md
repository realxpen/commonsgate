# Security and responsible demonstration

**Do not deploy CommonsGate v0.1 on a publicly reachable server.** This is an educational local demo with entirely fabricated data and intentionally impersonable actors. Its API header `x-demo-actor` is not authentication. Running behind a public reverse proxy, exposing port 4173, or adding real participants would create risks.

## What is safe to publish

- Synthetic fixtures, local policy logic, test code and documentation
- Screenshots of invented scenario results
- Findings from reviewing the simulation's behaviour

## What must never be added

- Patient records, interview transcripts, participant identifiers, health histories or actual consent records
- API keys, access tokens, connection strings, personal addresses or proprietary material
- Data associated with SRHIN, Mozilla, GENSCORE or any other third party without explicit rights and safeguards

## Known security limitations

- Identity is simulated; anyone with local API access can impersonate any actor, approve/veto, withdraw or reset.
- Data, grants and audit receipts exist only in one process's memory and vanish after restart.
- The hash-linked event list detects accidental in-process edits but is neither immutable storage nor a tamper-proof audit system.
- Access restriction is demonstrated against a fabricated aggregate, not a healthcare database or model training system.
- The two-reviewer quorum, veto and consent model are fictional demonstrations, not approved community governance or legal consent mechanisms.
- No penetration test, clinical assessment, legal assessment, ethics approval or partner validation has occurred.

## Before any real pilot

Obtain community-led requirements and ethics/legal advice; add robust user authentication and authorisation, encrypted storage, atomic transactions and revocation, durable audit logs, logging redaction, access expiry, abuse controls and security review. Disentangle individual legal rights from collective governance decisions. Implement data lifecycle controls and address the limits of withdrawal once data or derived AI models have already been distributed.

## Reporting vulnerabilities

Do not include patient data, secrets or sensitive materials in a public issue. If an issue concerns this synthetic demo, open a GitHub issue with a minimal reproduction using fictional data. For sensitive findings, contact the repository maintainer privately through GitHub rather than posting a public exploit.
