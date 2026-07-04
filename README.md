# Price Checker

Aplikacja webowa do śledzenia cen produktów. Po zalogowaniu automatycznie sprawdza ceny i pokazuje, czy wzrosły czy spadły.

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (Auth, PostgreSQL, RLS)
- **Deploy**: [here.now](https://here.now)
- **Scraping**: Jina Reader + parser heurystyczny

## Szybki start

### 1. Supabase

1. Utwórz projekt na [supabase.com](https://supabase.com)
2. Uruchom migrację z [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)
3. Skopiuj URL i anon key

### 2. Konfiguracja lokalna

```bash
cp .env.example .env
# Uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY
```

### 3. Uruchomienie

```bash
npm install
npm install --prefix site
npm run dev
```

Aplikacja: http://localhost:5173

### 4. Testy

```bash
npm test               # unit (Vitest)
npm run test:integration  # RLS na live Supabase (wymaga kont testowych)
npm run test:e2e       # e2e lokalne (Playwright, mocki)
npm run test:smoke     # smoke produkcji (Playwright)
npm run build          # produkcyjny build
```

## Deploy na here.now

**Produkcja:** https://onyx-nebula-z9zp.here.now/

Aby zachować stronę na stałe, użyj [claim URL](https://here.now/claim?slug=sentient-pumice-zbfb&token=904d60c0889547ceecf524dccb9ad2f122ebf48a83fd16e9ac1dfadec580ad96) starej anonimowej wersji (opcjonalnie) lub po prostu używaj nowego URL powyżej.

1. Zainstaluj skill: `npx skills add heredotnow/skill --skill here-now -g`
2. Skonfiguruj API key here.now (`~/.herenow/credentials`)
3. Ustaw zmienną `SUPABASE_ANON_KEY` w dashboardzie here.now
4. Zaktualizuj `upstream` w [`site/.herenow/proxy.json`](site/.herenow/proxy.json)
5. Opublikuj:

```bash
npm run build
~/.agents/skills/here-now/scripts/publish.sh site/dist --spa --client cursor --slug price-checker
```

## Dokumentacja

- [PRD](docs/prd.md) — wymagania produktowe
- [Test Plan](docs/test-plan.md) — ryzyka i mapowanie na testy
- [Roadmap](docs/roadmap.md) — plan rozwoju
- [Infrastructure](docs/infrastructure.md) — architektura i deploy

## Struktura

```
price-checker/
├── site/              # Frontend (React SPA)
├── supabase/          # Migracje SQL
├── tests/             # Vitest + Playwright
├── context/foundation/# Plan testów (workflow 10x)
└── docs/              # Dokumentacja kontekstowa
```
