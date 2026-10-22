# Casa Caos – Assignment 2

En liten, lokal husarbeidsapp inspirert av vaskelista. Hver testbruker kan logge inn og opprette, vise, redigere, fullføre og slette sine egne oppgaver. Oppgavene har fritekstbeskrivelse, hyppighet og poeng. Søkefeltet søker i navn og beskrivelse.

## Start med Docker Desktop

Åpne Ledetekst i denne mappen og kjør:

```text
docker compose up --build
```

Når webtjenesten har startet, åpne http://127.0.0.1:8080. Stopp den med `Ctrl+C`, eller kjør `docker compose down` i et nytt Ledetekst-vindu.

Databasen nullstilles med `docker compose down -v` og startes på nytt med seed-data neste gang du kjører `docker compose up --build`.

## Syntetiske testkontoer

| Brukernavn | Passord |
| --- | --- |
| alice | alice123 |
| bob | bob123 |

Oppgavene og kontoene er oppdiktede testdata. Appen bruker PostgreSQL i Docker. Bare webporten er publisert, bundet til `127.0.0.1:8080`; databasen har ingen publisert port.

## Funksjoner

- Innlogging og utlogging med økt.
- Opprette, vise, redigere, fullføre og slette personlige husarbeidsoppgaver.
- Fritekstfelt for beskrivelse.
- Søk i oppgavenavn og beskrivelse.
- Hyppighet og poeng per oppgave.

Se `GENERATION_LOG.md` for prompt- og modellopplysninger.
