# Sprint 68B — Fuzzy Matching (Superseded)

**Status:** Superseded and closed by [Sprint 79](./Sprint-79.md)

---

The initial backlog assumed that fuzzy matching did not exist. The server now
already proposes exact, case-insensitive, and normalized matches, and scan tests
cover minor naming differences.

The useful remaining problem is not “add Levenshtein” in isolation. It is to make
ambiguous album-to-folder candidates reviewable without ever auto-confirming an
uncertain link. That narrower, evidence-driven scope is defined in Sprint 79.
