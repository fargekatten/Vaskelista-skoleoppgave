# Vaskelista

Felles husarbeidsliste for Inger, Lisa, Leander og Vegard. React og TypeScript med Next.js, PostgreSQL hos Neon og publisering gjennom Vercel.

## Start her – uten terminal

1. Pakk ut ZIP-filen på PC-en.
2. Opprett et tomt repository på GitHub, for eksempel `vaskelista` (gjerne privat).
3. Velg **uploading an existing file** eller **Add file → Upload files**. Last opp innholdet i den utpakkede mappen. `package.json`, `README.md`, `app` og de øvrige mappene skal ligge direkte i repositoryets rot – ikke inni en ekstra mappe. Ikke last opp selve ZIP-filen. Ta også med `.gitignore` og `.env.example`.
4. Åpne prosjektet **Vaskelista** i Neon. Velg **SQL Editor**, riktig database og produksjonsbranch. Kopier hele innholdet i `database/setup.sql`, lim inn og trykk **Run**. Dette oppretter fire tabeller uten å slette eksisterende data.
5. Logg inn på [Vercel](https://vercel.com) med GitHub. Velg **Add New → Project**, og importer repositoryet. Gi Vercel tilgang hvis repositoryet er privat.
6. Behold **Next.js** som rammeverk og standard rotmappe. Bruk Node.js 22 eller nyere. Før du trykker Deploy, legg til denne miljøvariabelen:

   - Navn: `DATABASE_URL`
   - Verdi: hele connection string fra Neon, uten ekstra anførselstegn. Behold `sslmode` og eventuelle andre parametere. Bruk gjerne pooled connection fra Connect-dialogen.
   - Miljø: **Production**. Bruk en egen Neon-testbranch hvis du senere vil ha Preview-miljø.

7. Trykk **Deploy**. Åpne produksjonslenken når byggingen er ferdig. Standardoppgavene legges inn automatisk første gang oversikten hentes.
8. Registrer én oppgave, åpne samme lenke på en annen enhet, og kontroller at den vises. Trykk deretter på navnemerket og bekreft sletting.

Hvis Vercel krever innlogging for besøkende, kontroller **Settings → Deployment Protection** for produksjonsadressen. Del produksjonslenken med beboerne.

GitHub Pages skal ikke aktiveres for dette prosjektet. GitHub lagrer koden, Vercel kjører nettsiden og API-et, Neon lagrer dataene. Når du oppdaterer produksjonsbranchen på GitHub, bygger Vercel normalt nettsiden på nytt.

## Passord og tilgang

`DATABASE_URL` inneholder passord. Legg den kun i Vercels miljøvariabler eller i en lokal `.env.local`. Ikke skriv den i GitHub, en klientkomponent eller en variabel med `NEXT_PUBLIC_` foran. Eksempelfilen inneholder ingen hemmelighet.

Appen har innlogging (brukernavn `inger`, `lisa`, `leander`, `vegard`; passord settes med `INITIAL_PASSWORD` første gang appen starter). Innlogget person er alltid kjent, så personvalg er fjernet.

## Docker (lokalt)

Kopier `.env.example` til `.env`, sett `POSTGRES_PASSWORD` og `INITIAL_PASSWORD`, og kjør `docker compose up --build`. Appen åpnes på http://127.0.0.1:8080. Databasen har ingen eksponert port og nås kun via Docker-nettverket.

Tidligere: alle som har nettadressen kunne registrere, slette og endre innstillingene. Et privat GitHub-repository gjør kildekoden privat, men begrenser ikke tilgang til selve appen.
Oppgaver som er begrenset til enkelte personer skjules fra standardlisten og fellesoversiktene. De vises når en person som kan registrere oppgaven velges. Tagger er bare filtre og gir ikke tilgangskontroll.

## Hva følger med?

- Startsiden viser fellesoppgavene. Under hyppighetsfiltrene kan en person velges for å se oppgavene vedkommende har tilgang til å registrere. Valget lagres ikke: det nullstilles ved sidelasting, når appen skjules eller når man bytter fane. «Tilbake til fellesoppgaver» nullstiller det også.
- Oppgaver kan filtreres etter hyppighet og egne tagger.
- Trykk på oppgavenavnet for beskrivelse og avkryssbare underoppgaver. Beskrivelse, underoppgaver og tagg endres i Utvikler-fanen.
- Opprett oppgaver og tagger fra Utvikler-fanen. Tagger sorterer oppgavene, uten privat/felles-inndeling.
- Oppgaver med begrenset deltakerliste vises når en av deltakerne velges. De har en egen poengoversikt og inngår ikke i kollektivet sine månedsmål eller felles historikk.
- Filtre kan slettes. Oppgavene beholdes, men blir uten tagg.
- Oppgavenes navn, hyppighet, poeng, beskrivelse, underoppgaver, tagg og deltakere kan redigeres i Utvikler-fanen. «Alle» gjelder også personer som legges til senere.
- Navneknappene registrerer hver utførelse og gir poeng hver gang.
- Navnemerkene viser utførelser per person i valgt måned. Et trykk åpner bekreftelse før siste registrering for personen/oppgaven i måneden slettes. Eldre registreringer kan slettes enkeltvis i Historikk.
- Grønn status for oppgaver utført i den aktuelle perioden.
- Månedlig og årlig historikk, justerbare poeng, fravær og hensyn til hundehold.
- Ny måned viser en ny månedsoversikt automatisk, uten å slette historikken.

**Tidligere registreringer fra nettsiden hos ChatGPT følger ikke med.** Denne pakken starter med standardoppgaver i den nye Neon-databasen. Dersom dere har historikk som skal beholdes, må den eksporteres og importeres før dere tar den nye lenken i bruk. Den eksisterende nettsiden er ikke endret av denne eksporten.

## Redigere lokalt

Installer Node.js 22.13 eller nyere og åpne prosjektmappen i VS Code.

```sh
npm ci
```

Kopier `.env.example` til `.env.local`, fyll inn din tilkoblingsadresse, og kjør:

```sh
npm run dev
```

Åpne http://localhost:3000. Databasen må være opprettet med `database/setup.sql` først. Bruk en egen Neon-branch for testing dersom produksjonsdatabasen er i bruk.

```sh
npm run typecheck
npm run build
```

## Hvor endrer jeg hva?

| Fil | Innhold |
| --- | --- |
| `app/page.tsx` | Visning, filtre, registrering og slettingsdialog |
| `app/globals.css` | Farger, størrelser og oppsett |
| `lib/house.ts` | Navn, standardoppgaver, perioder og poengberegning |
| `app/api/house/route.ts` | Serverkode for lesing og endring av data |
| `lib/store.ts` | Tilkobling til Neon og innlegging av standardoppgaver |
| `database/setup.sql` | Tabellene som kjøres én gang i Neon |
| `components/ui/` | Gjenbrukbare knapper, faner og dialoger |

Oppgavenes ID-er kobler historikken til riktig oppgave. Ikke bytt ID for eksisterende oppgaver. Standardoppgaver legges bare inn når ID-en mangler; endringer i standardpoeng i `lib/house.ts` overskriver derfor ikke verdier som allerede ligger i Neon. Bruk appens innstillinger til poeng og aktivering.
Oppgavenes hyppighet kan endres i innstillingene. Årlig er en støttet hyppighet og teller én gang i beregningen av et års mål.

## Feilsøking

- **Kan ikke hente oversikten:** Kontroller `DATABASE_URL` i Production og at SQL-filen er kjørt i samme database/branch som tilkoblingsadressen peker til. Kjør Redeploy etter endring av miljøvariabler.
- **Tom ny historikk:** Neon-databasen har ikke automatisk tilgang til data fra den tidligere nettsiden.
- **Endringer vises ikke på annen enhet:** Kontroller at dere åpner samme produksjonslenke; appen oppdaterer oversikten hvert 15. sekund.

## Verifisering

Se `VERIFISERING.md` for kontrollene som er kjørt. Tilkobling til din Neon-database kan først testes etter at du har satt DATABASE_URL.

## Dokumentasjon

- https://neon.com/docs/connect/connect-from-any-app
- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/environment-variables
