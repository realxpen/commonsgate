# CommonsGate v0.2 — facilitator's walkthrough

Use this only with a voluntary reviewer who understands the synthetic-data boundary. It is a **conversation guide**, not a research consent form or a substitute for an approved protocol.

## Before the call
- Run \`npm start\`; verify \`npm test\` and \`npm run check\`.
- Open \`http://127.0.0.1:4173/\` and \`http://127.0.0.1:4173/review.html\`.
- Keep the local server on loopback. Do not host it on a shared internet server.
- Never request real clinical cases, health histories, names, or identifiable participant stories.
- Say explicitly: no relationship with Mozilla or SRHIN is being claimed.

## Suggested introduction
"CommonsGate is an independent proof of concept. Every person, approval and dataset shown is invented. I am exploring whether a community's rules and an individual's permission can change what an AI-data-access gateway allows. I want you to challenge the assumptions—not endorse the solution."

## Demo steps
1. Run **Allow**: ask whose approvals matter.
2. Run **Community veto**: ask whether the veto rule should always work this way or vary by context.
3. Run **Permission withdrawn**: point out that access is blocked *in future*. Past copies, outputs and model training cannot simply be undone.
4. Open the review page, invite optional structured responses, and explain the export remains on their device.

## Discussion prompts
- Who is missing from the decision process?
- What should happen if community representatives disagree or are conflicted?
- Can someone safely refuse participation without losing access to support?
- Would a low-bandwidth or local-language version change comprehension?
- Is the result receipt useful, or could it be misleading?
- What would make you recommend **not** building this tool?

## After the conversation
Document only voluntary, non-identifying design observations. Respect requests not to record or share notes. Keep raw files private; publish aggregated lessons only where appropriate. Record uncertainties and **do not count attendees as adoption, partners, or endorsed community users**.
