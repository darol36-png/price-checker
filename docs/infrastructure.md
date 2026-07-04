# Infrastructure — Price Checker

## Architektura

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Przeglądarka│────▶│  here.now (SPA)  │────▶│  Supabase       │
│  React SPA  │     │  + proxy routes  │     │  Auth + Postgres│
└─────────────┘     └────────┬─────────┘     └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Jina Reader    │
                    │  r.jina.ai      │
                    └─────────────────┘
```

### Proxy routes (here.now)

Plik [`site/.herenow/proxy.json`](../site/.herenow/proxy.json):

| Ścieżka | Upstream | Cel |
|---------|----------|-----|
| `/api/supabase/*` | `https://<PROJECT>.supabase.co` | Auth + REST API |
| `/api/fetch/*` | `https://r.jina.ai/` | Pobieranie stron produktów |

Nagłówek `apikey` wstrzykiwany z zmiennej `SUPABASE_ANON_KEY`.  
Nagłówek `Authorization: Bearer <jwt>` przekazywany z przeglądarki (sesja użytkownika).

### Lokalny development

Vite dev server (`site/vite.config.ts`) proxy'uje te same ścieżki:
- `/api/supabase` → `VITE_SUPABASE_URL`
- `/api/fetch` → `https://r.jina.ai`

## Supabase

### Setup

1. Utwórz projekt na [supabase.com](https://supabase.com)
2. Uruchom migrację z [`supabase/migrations/001_init.sql`](../supabase/migrations/001_init.sql) (SQL Editor lub CLI)
3. Skopiuj `Project URL` i `anon public` key

### Tabele

- `products` — produkty użytkowników (RLS: `auth.uid() = user_id`)
- `price_history` — historia sprawdzeń (RLS przez ownership produktu)

### Zmienne środowiskowe (lokalnie)

Plik `.env` w katalogu głównym (na podstawie `.env.example`):

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## here.now

### Wymagania

- Konto here.now z API key (`~/.herenow/credentials`)
- Zmienna konta: `SUPABASE_ANON_KEY` z `allowedUpstreams: ["xxxxx.supabase.co"]`
- Zaktualizuj `upstream` w `proxy.json` na właściwy URL Supabase

### Publikacja

```bash
# Build (kopiuje .herenow/ do dist/)
npm run build

# Publish (wymaga skill here-now)
~/.agents/skills/here-now/scripts/publish.sh site/dist --spa --client cursor --slug price-checker
```

Aktualizacja istniejącej strony:

```bash
~/.agents/skills/here-now/scripts/publish.sh site/dist --spa --slug price-checker --client cursor
```

### SPA mode

Flaga `--spa` włącza routing SPA — nieznane ścieżki serwują `index.html` (React Router).

### Rollback

Opublikuj poprzednią wersję z `--slug price-checker` używając wcześniejszego buildu.

## Sekrety

| Sekret | Gdzie przechowywać | Nigdy w repo |
|--------|-------------------|--------------|
| `SUPABASE_ANON_KEY` | `.env` (lokalnie), here.now Variables (prod) | ✓ |
| `HERENOW_API_KEY` | `~/.herenow/credentials` | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | Tylko jeśli potrzebny admin — nie używać w przeglądarce | ✓ |

Pliki ignorowane przez git: `.env`, `.herenow/`, `~/.herenow/credentials`

## Testowanie

Plan testów (ryzyka → testy): [`test-plan.md`](test-plan.md) / [`context/foundation/test-plan.md`](../context/foundation/test-plan.md).

### Unit (Vitest)

```bash
npm test
```

### E2E (Playwright, lokalne mocki)

```bash
npm run test:e2e
```

### Smoke produkcji (Playwright)

Weryfikuje dostępność SPA i proxy po deployu — bez logowania i sekretów.

```bash
npm run test:smoke
# lub z własnym URL:
PLAYWRIGHT_BASE_URL=https://onyx-nebula-z9zp.here.now npm run test:smoke
```

### Integracja RLS (Vitest + live Supabase)

Wymaga dwóch kont testowych w Supabase Auth oraz zmiennych z `.env.example`:

```bash
npm run test:integration
```

Test tworzy tymczasowe produkty, weryfikuje izolację między użytkownikami A i B, a następnie je usuwa.

**Przygotowanie kont testowych (jednorazowo):**

1. W Supabase Dashboard → Authentication → Users utwórz dwa konta (email + hasło).
2. Wyłącz „Confirm email” w ustawieniach Auth (lub potwierdź adresy ręcznie).
3. Uzupełnij `TEST_USER_A_*` i `TEST_USER_B_*` w `.env` (patrz `.env.example`).

### CI

GitHub Actions (`.github/workflows/ci.yml`): lint → test → build → e2e (mocki, bez sekretów).

Opcjonalny workflow (`.github/workflows/smoke-integration.yml`, `workflow_dispatch`): smoke produkcji + test RLS z sekretami `SUPABASE_*` i `TEST_USER_*`.

## Monitoring

- Błędy per produkt wyświetlane w bannerze podsumowania
- Supabase Dashboard: logi Auth, zapytania SQL
- here.now Dashboard: analytics, Site Data (nieużywane w v1)

## Limity produkcyjne

| Usługa | Limit |
|--------|-------|
| Jina Reader (proxy) | 30 req/h/IP |
| Supabase (free) | 50k MAU, 500 MB DB |
| here.now proxy | 100 req/h/IP (domyślnie), konfigurowalne per route |
