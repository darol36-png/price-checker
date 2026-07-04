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

### Automatyczny deploy (GitHub Actions)

Po pushu na `main`: testy → build → deploy → smoke test.

Konfiguracja sekretów i zmiennych: **[docs/github-cicd.md](docs/github-cicd.md)**

Jeśli deploy pada, sprawdź w logach joba `deploy` krok **Validate deploy secrets** — wypisze brakujące nazwy.

### Deploy ręczny

1. Zainstaluj skill: `npx skills add heredotnow/skill --skill here-now -g`
2. Ustaw w `.env`: `HERENOW_API_KEY`, `HERENOW_SLUG`, `VITE_SUPABASE_*`
3. Ustaw `JINA_API_KEY` w dashboardzie here.now (Variables)
4. Opublikuj:

```bash
npm run deploy:ci
# lub lokalny skrypt z auto-slugiem z .herenow/state.json:
npm run deploy
```

## Dokumentacja

- **[Dokumentacja projektu](docs/project.md)** — stack, struktura katalogów, zmienne konfiguracyjne, architektura
- [PRD](docs/prd.md) — wymagania produktowe
- [Test Plan](docs/test-plan.md) — ryzyka i mapowanie na testy
- [Roadmap](docs/roadmap.md) — plan rozwoju
- [Infrastructure](docs/infrastructure.md) — architektura i deploy
- [GitHub CI/CD](docs/github-cicd.md) — automatyczny deploy z GitHub Actions

## Struktura

Szczegółowy opis katalogów: **[docs/project.md](docs/project.md)**

```
price-checker/
├── site/              # Frontend (React SPA)
├── supabase/          # Migracje SQL
├── tests/             # Vitest + Playwright
├── scripts/           # Deploy (lokalny i CI)
├── .github/workflows/ # CI/CD GitHub Actions
├── context/foundation/# Plan testów (workflow 10x)
└── docs/              # Dokumentacja
```
