# Two-minute demonstration script (synthetic data only)

**0:00–0:20 — Context.** “CommonsGate is a local open-source experiment in checking community governance and individual permissions before releasing research results. The data and governance roles are fictional.”

**0:20–0:50 — Allow.** Start the app. Select **Allow** and run it. Point out the four policy checks, the resulting short-lived grant and the invented aggregate returned by the gateway. No raw personal records are returned.

**0:50–1:15 — Deny.** Select **Deny**. A community reviewer vetoes the proposed purpose. The policy engine denies the request even though other checks pass. No access token is issued.

**1:15–1:40 — Revoke.** Select **Revoke**. Show a grant that succeeds at first, then a fictional participant withdrawing permission. A subsequent attempt with the same grant is refused.

**1:40–2:00 — Limits and next steps.** “This is not an authenticated or deployed system. It has no real health data, users or partnerships. My next goal is to validate the governance model with affected communities and build secure infrastructure only where there is a demonstrated need.”

## Recording checklist

- Run `npm test` before recording.
- Record local screen at `127.0.0.1` (do not expose the API on a public port).
- Show the safety disclaimer and invented dataset counts.
- Avoid implying community members or SRHIN have participated in, adopted or approved the prototype.
