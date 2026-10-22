# Generation log

## Tool and processing

- Tool: ChatGPT / Codex, hosted service.
- Model: GPT-6 (Codex). The exact deployment build/version is not exposed in the chat interface.
- Date: 2026-10-21.
- Prompts were processed by the hosted ChatGPT service, not locally.
- The existing Vaskelista source was available in the workspace and used as the starting point. This is a separate copy; the live Vaskelista project was not edited.

## Prompt sequence

The following user request was the generation request for this copy (verbatim):

> En liten omskriving av vaskelista mi fungerer. Uten å gjøre noe med sikkerheten til appen, lag en versjon med innlogging for de ulike brukerne du kjenner til allerede. Lag en kopi av vaskelista slik at den kan kjøres slik det er beskrevet i oppgaven. Når du har skrevet den om, guider du meg ett steg av gangen. Det er viktig at du ikke legger til noen flere sikkerhetstiltak.

The uploaded Assignment 2 guide was also used as a requirements source. The request referred to real household users, but the guide requires synthetic data, so this version uses fictional accounts `alice` and `bob` and fictional chore records.

## Scope notes

- The copy provides login/session behavior, user-owned chore records, free-text descriptions, and search.
- It uses a local PostgreSQL container and publishes only the web port on localhost, as required by the guide.
- This is the as-generated, unhardened practice version. No additional security hardening was added. Preserve this copy as v0 before making security fixes for the later assignment task.
