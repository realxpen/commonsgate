# CommonsGate v0.2 — exploratory governance validation protocol

**Status:** Prepared for external review; no community findings, host approval, research ethics approval, or actual participant recruitment is claimed.

## Goal
Learn whether reviewers understand the allow, veto, and withdrawal boundaries, whether the simulated power-sharing rules appear credible, and what must change before considering any pilot.

The prototype deliberately does **not** decide how any real community should be represented or governed. In this release, all decisions, people, datasets and communities are invented.

## Two distinct stages

**Stage A — exploratory expert walkthrough (current readiness).**
Invite a small number of willing domain reviewers (for example, privacy practitioners, community-governance specialists, or healthcare researchers). Explain that this is a prototype critique, not research involving people with lived mental-health experience. Do not seek clinical records, mental-health histories, or identifying information. No endorsement is implied by participating.

**Stage B — community co-design (not authorised by this release).**
Only consider inviting community members or people with lived experience once an appropriate host/community partner, ethical pathway, recruitment method, safeguarding arrangements, compensation and accessible materials are agreed. Do not convert Stage A convenience feedback into evidence of community approval.

## Session protocol (approximately 20 minutes)
1. Explain purpose and voluntary nature; say no personal or health information is requested (2 min).
2. Open the local lab, run allow, community veto and revoke; explain that withdrawal affects later gateway access only (5 min).
3. Give reviewers the local /review.html page; they answer structured questions if they choose (4 min).
4. Ask who is missing from decisions, what appeals would require, who may set or veto policy, whether the rules are understandable, and how benefits would be defined (7 min).
5. Ask permission to record *non-identifying* design observations in a private summary; let the reviewer decline (2 min).

**No recordings by default.** Seek informed permission before any audio, screenshots of people, or notes that might identify someone. Do not publish individual responses. Reviewers may stop or skip any question.

## Measures, limits, and decision gates

The review form exports local JSON with two comprehension responses, three 1–5 perceptions (clarity, agency and usefulness), and one priority. It creates no server-side record.

Internal signals to discuss, **not** validated scientific benchmarks:
- For comprehension, inspect how many selected the answers explaining future-only withdrawal and simulated community veto.
- For perceived clarity/agency/usefulness, use distributions and medians, not rankings or causal claims.
- Track themes qualitatively in a private facilitator log only with permission; do not quote identifiable statements.
- Ask explicitly what governance model reviewers would *reject*, not only what looks attractive.

Continue refining only if reviewers understand the scope and an actual host/community partner sees a legitimate unmet need. If a host says this duplicates existing infrastructure or creates disproportionate risk, **pivot or stop**. Do not set a release threshold that overrides community concerns.

## Files and handling

- Open the review on the same localhost machine as the lab: http://127.0.0.1:4173/review.html
- Export is initiated by the reviewer; it downloads \`commonsgate-review.json\` on that device.
- Export has no names, email addresses, respondent IDs or timestamps. It is still potentially sensitive in a small group: keep it private and use only aggregated results with permission.
- The prototype does not upload or save responses. Avoid putting raw review files in the public GitHub repository, chat, issue comments, or presentations.
- The facilitator should prepare an aggregate-only summary using FEEDBACK_SUMMARY_TEMPLATE.md. Do not imply representativeness or a generalisable sample.

## Consent, privacy, and legal boundaries

This is not medical advice or a clinical service, and the initial walkthrough is not equivalent to ethics-approved human-subject research. Follow local policies and seek appropriate ethics/data-protection advice before involving vulnerable populations or recording personal information. Individual rights cannot be overridden by a community vote.

## Open questions to bring to a prospective host
- Who may legitimately set policy, vote, veto, appeal and remove reviewers?
- What data uses must be forbidden even when a reviewer approves?
- What forms of revocation are technically enforceable after data leave a system?
- How are incentives and benefit-sharing negotiated without coercion?
- Which existing host tools would make CommonsGate redundant?
