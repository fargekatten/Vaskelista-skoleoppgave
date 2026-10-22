# Casa Caos – Vaskelista

Dette er en kopi av kildekoden til Casa Caos sin vaskeliste. Repositoryet inneholder ikke produksjonsdata, databasepassord eller en aktiv kobling til en database eller publisert nettside.

## Lokal kjøring

Prosjektet krever Node.js 22.13 eller nyere og en PostgreSQL-database. Databasen må opprettes separat ved hjelp av `database/setup.sql`. Kopier `.env.example` til `.env.local` og fyll inn `DATABASE_URL` for databasen du selv vil bruke. Uten denne variabelen kobler appen seg ikke til noen database.

```sh
npm ci
npm run dev
```

Åpne deretter `http://localhost:3000`.

Kontroller kildekoden med:

```sh
npm run typecheck
npm run build
```

## Innhold

- `app/` – sider, API og stilark
- `components/ui/` – gjenbrukbare grensesnittkomponenter
- `database/setup.sql` – SQL-oppsett for tabellene
- `lib/house.ts` – oppgaver, perioder og poengberegning
- `lib/store.ts` – databasekobling og lagring

Appen har ingen brukerinnlogging. Alle som kan åpne en kjørende app kan registrere og endre oppgaver. Ikke legg ekte tilkoblingspassord eller husholdningsdata i dette repositoryet.
