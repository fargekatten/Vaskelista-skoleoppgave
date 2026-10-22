# Verifisering – 18. oktober 2026

- Avhengigheter installert; package-lock.json følger med.
- Next.js produksjonsbygg og TypeScript-kontroll bestått.
- SQL-skjema og API-handlinger tidligere kjørt mot lokal PostgreSQL-motor (PGlite): lesing, registrering, sletting, poeng, aktivering, fravær og månedsinnstillinger.
- Kontrollert at gjentatt SQL-oppsett bevarer tabellene, samme registrerings-ID ikke dobles, tidligere registreringer beholder sine opprinnelige poeng og ugyldig person avvises.
- Din Neon-tilkobling og publisering på din Vercel-konto er ikke testet; DATABASE_URL er ikke mottatt.
- Denne eksporten er ikke testet i nettleser eller fysisk iPad.
- ZIP-filen inneholder ingen databasehistorikk, tilkoblingspassord, node_modules eller byggfiler.
- Ukesmål beregnet og kontrollert for daglig, ukentlig, månedlig, kvartalsvis og årlig frekvens. Test bekreftet at full tilstedeværelse gir forventet sum, og at fravær for alle personer og hunder hele uka gir 0 poeng.
- `npm run typecheck` og `npm run build` bestått etter endringene.
- Neon-tilkobling og publisering av denne oppdaterte versjonen er ikke testet.
- Oppgavebeskrivelser, underoppgaver og tagger lagres som JSON i eksisterende `settings`-tabell; ingen ny Neon-migrering kreves.
- Oppgaver med begrenset deltakerliste filtreres ut av felles månedsmål, månedshistorikk og felles oppgavelister. De vises når en deltaker velges og får egen poengoversikt.
- Oppgaver og tagger kan opprettes fra Utvikler-fanen. Tagger har ingen privat/felles-inndeling, og sletting av tagg beholder oppgavene uten tagg.
- Hyppighet og poeng kan endres i Utvikler-fanen.
- `npm run typecheck` og `npm run build` bestått etter disse funksjonene.
- Startsiden viser fellesoppgaver først; personfilteret viser bare oppgaver vedkommende kan registrere og nullstilles ved sidelasting, fanebytte eller når appen skjules.
- Oppgavebegrensninger respekteres både i visningen og API-et. «Alle»-knappen setter alle gjeldende personer som deltakere.
- «Alle» lagres som en dynamisk regel, slik at nye personer også omfattes når deltakerlisten utvides.
