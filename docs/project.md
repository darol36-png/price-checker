# Dokumentacja projektu — Price Checker

Aplikacja webowa do śledzenia cen produktów w sklepach internetowych. Użytkownik loguje się, dodaje linki do produktów, a aplikacja automatycznie pobiera ceny i pokazuje podsumowanie zmian.

**Produkcja:** https://onyx-nebula-z9zp.here.now/

---

## Stack technologiczny

| Warstwa | Technologia | Rola |
|---------|-------------|------|
| Frontend | React 19, TypeScript, Vite 8 | SPA w przeglądarce |
| Routing | React Router 7 | `/login`, `/dashboard` |
| Backend / baza | Supabase (PostgreSQL + Auth) | Użytkownicy, produkty, historia cen |
| Bezpieczeństwo danych | Row Level Security (RLS) | Izolacja danych per użytkownik |
| Hosting | [here.now](https://here.now) | Statyczne pliki SPA + proxy API |
| Pobieranie stron | Jina Reader (`r.jina.ai`) | Ekstrakcja HTML/Markdown sklepów |
| Proxy sklepów | here.now proxy routes | iSpot (bezpośrednio), Jina (fetch/reader) |
| Parser cen | Własny moduł heurystyczny | JSON-LD, meta tagi, regex PLN/EUR/USD |
| Testy | Vitest, Playwright | Unit, integracja RLS, e2e, smoke |
| CI/CD | GitHub Actions | Testy + auto-deploy na `main` |
| Linter | Oxlint | Statyczna analiza kodu TS/TSX |

Aplikacja **nie ma własnego serwera backendowego** — logika działa w przeglądarce, dane w Supabase, a proxy zewnętrznych API obsługuje here.now.

---

## Architektura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Przeglądarka użytkownika                  │
│  React SPA (site/)                                               │
│  ├─ Auth (Supabase Auth, sesja w localStorage)                   │
│  ├─ CRUD produktów (Supabase REST API, bezpośrednio)             │
│  └─ Sprawdzanie cen                                              │
│       ├─ iSpot → /api/ispot/* (proxy here.now)                   │
│       └─ inne sklepy → /api/fetch/* lub /api/jina-reader         │
└───────────────┬───────────────────────────────┬───────────────────┘
                │                               │
                ▼                               ▼
     ┌──────────────────┐            ┌──────────────────┐
     │     Supabase     │            │     here.now      │
     │  Auth + Postgres │            │  SPA + proxy.json │
     │  (RLS per user)  │            └────────┬─────────┘
     └──────────────────┘                     │
                                    ┌────────┴────────┐
                                    ▼                 ▼
                              ispot.pl          r.jina.ai
```

### Przepływ sprawdzania ceny

1. Użytkownik klika „Sprawdź teraz” (lub sprawdzenie startuje po logowaniu).
2. `price-checker.ts` dla każdego produktu wywołuje `fetchPageContent(url)`.
3. `fetch-page.ts` wybiera strategię:
   - **ispot.pl** → bezpośredni proxy `/api/ispot/...`
   - **pozostałe** → Jina GET `/api/fetch/{url}`, a przy blokadzie anty-bot → Jina POST `/api/jina-reader`
4. `price-parser.ts` wyciąga cenę z HTML/Markdown.
5. `price-diff.ts` porównuje z poprzednią ceną.
6. Wynik zapisywany w `products` i `price_history` (Supabase).
7. `PriceChangeSummary` wyświetla banner z podsumowaniem.

---

## Struktura katalogów

```
price-checker/
├── site/                    # Frontend — React SPA
│   ├── src/
│   │   ├── components/      # Komponenty UI
│   │   ├── hooks/           # Logika React (auth, produkty, sprawdzanie cen)
│   │   ├── lib/             # Moduły biznesowe (parser, fetch, Supabase)
│   │   ├── pages/           # Strony: Login, Dashboard
│   │   └── types/           # Typy TypeScript (Product, PriceHistory, …)
│   ├── .herenow/
│   │   └── proxy.json       # Konfiguracja proxy here.now (WAŻNE: musi być w repo)
│   ├── vite.config.ts       # Dev server + proxy lokalne + kopiowanie .herenow do dist
│   └── dist/                # Build produkcyjny (generowany, nie commitowany)
│
├── supabase/
│   └── migrations/          # Schemat bazy i polityki RLS
│       ├── 001_init.sql     # Tabele products, price_history, RLS
│       └── 002_fix_products_rls.sql  # Trigger user_id przy INSERT
│
├── tests/
│   ├── unit/                # Vitest — parser, diff, bot-page, auth-errors
│   ├── integration/         # Vitest + live Supabase — test RLS
│   └── e2e/                 # Playwright — UI i flow cen
│       ├── smoke/           # Smoke testy produkcji
│       └── helpers/         # Mocki Supabase dla e2e
│
├── scripts/
│   ├── deploy.sh            # Deploy lokalny (skill here.now, auto-slug ze state)
│   └── ci-deploy.sh         # Deploy z CI / ręczny z env
│
├── .github/workflows/
│   ├── ci.yml               # Testy + auto-deploy na main
│   └── smoke-integration.yml # Ręczny: smoke + test RLS
│
├── docs/                    # Dokumentacja projektu
├── context/foundation/      # Plan testów (workflow 10xDevs)
│
├── .env                     # Zmienne lokalne (nie w repo)
├── .env.example             # Szablon zmiennych
├── /.herenow/               # Stan lokalny publish (nie w repo)
├── package.json             # Skrypty root: test, build, deploy
├── vitest.config.ts
├── playwright.config.ts
└── playwright.smoke.config.ts
```

---

## Opis katalogów i plików

### `site/src/components/`

| Plik | Opis |
|------|------|
| `AuthForm.tsx` | Formularz logowania i rejestracji |
| `ProductForm.tsx` | Dodawanie / edycja produktu (nazwa + URL) |
| `ProductList.tsx` | Lista produktów z ceną, edycją i usuwaniem |
| `PriceChangeSummary.tsx` | Banner podsumowania zmian cen po sprawdzeniu |

### `site/src/hooks/`

| Plik | Opis |
|------|------|
| `useAuth.tsx` | Kontekst autentykacji Supabase (signIn, signUp, signOut) |
| `useProducts.ts` | CRUD produktów przez Supabase REST |
| `usePriceCheck.ts` | Uruchamianie sprawdzania cen, stan bannera |

### `site/src/lib/` — logika biznesowa

| Plik | Opis |
|------|------|
| `supabase-client.ts` | Klient Supabase (bezpośrednie połączenie z API) |
| `fetch-page.ts` | Pobieranie stron sklepów (iSpot / Jina GET / Jina POST) |
| `price-parser.ts` | Heurystyczna ekstrakcja ceny z HTML/Markdown |
| `price-checker.ts` | Orchestracja sprawdzania: fetch → parse → zapis → podsumowanie |
| `price-diff.ts` | Porównanie cen (wzrost / spadek / bez zmian / pierwsze sprawdzenie) |
| `bot-page.ts` | Wykrywanie stron anty-botowych (Cloudflare itp.) |
| `auth-errors.ts` | Tłumaczenie komunikatów błędów Supabase Auth na polski |

### `site/src/pages/`

| Plik | Opis |
|------|------|
| `Login.tsx` | Strona logowania / rejestracji |
| `Dashboard.tsx` | Główny panel: lista produktów, sprawdzanie cen, wylogowanie |

### `site/.herenow/proxy.json`

Konfiguracja tras proxy na here.now. **Musi być w repozytorium Git** — bez tego pliku deploy z CI nie konfiguruje proxy i sprawdzanie cen przestaje działać.

| Trasa | Upstream | Cel |
|-------|----------|-----|
| `/api/ispot/*` | `ispot.pl` | Bezpośrednie pobieranie HTML iSpot |
| `/api/fetch/*` | `r.jina.ai` | Jina Reader GET |
| `/api/jina-reader` | `r.jina.ai` | Jina Reader POST (browser engine) |

### `supabase/migrations/`

| Plik | Opis |
|------|------|
| `001_init.sql` | Tabele `products`, `price_history`, polityki RLS |
| `002_fix_products_rls.sql` | Trigger ustawiający `user_id` z JWT przy INSERT |

### `tests/`

| Katalog | Framework | Co testuje |
|---------|-----------|------------|
| `unit/` | Vitest | Parser cen, diff, bot-page, komunikaty auth |
| `integration/` | Vitest + Supabase | Izolacja RLS między dwoma użytkownikami |
| `e2e/` | Playwright | UI, logowanie, flow sprawdzania cen (mocki) |
| `e2e/smoke/` | Playwright | Dostępność produkcji i działanie proxy |

---

## Zmienne konfiguracyjne

### Lokalnie — plik `.env` (katalog główny)

Skopiuj z `.env.example`. Plik **nie trafia do Git**.

| Zmienna | Wymagana | Opis |
|---------|----------|------|
| `VITE_SUPABASE_URL` | tak | URL projektu Supabase |
| `VITE_SUPABASE_ANON_KEY` | tak | Klucz publiczny (publishable) Supabase |
| `VITE_JINA_API_KEY` | nie | Klucz Jina — wyższy limit w dev (proxy Vite) |
| `HERENOW_API_KEY` | deploy | Klucz API here.now |
| `HERENOW_SLUG` | deploy | Slug strony (np. `onyx-nebula-z9zp`) |
| `SUPABASE_URL` | test integr. | Ten sam URL co `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | test integr. | Ten sam klucz co `VITE_SUPABASE_ANON_KEY` |
| `TEST_USER_A_EMAIL` | test integr. | Konto testowe A |
| `TEST_USER_A_PASSWORD` | test integr. | Hasło konta A |
| `TEST_USER_B_EMAIL` | test integr. | Konto testowe B |
| `TEST_USER_B_PASSWORD` | test integr. | Hasło konta B |
| `PLAYWRIGHT_BASE_URL` | smoke | URL produkcji do testów smoke |

Vite wczytuje `.env` z katalogu głównego (`site/vite.config.ts` → `envDir: root`).

### GitHub Actions — sekrety i zmienne

| Nazwa | Typ w GitHub | Użycie |
|-------|--------------|--------|
| `HERENOW_API_KEY` | Secret | Deploy na here.now |
| `VITE_SUPABASE_URL` | Secret | Build produkcyjny SPA |
| `VITE_SUPABASE_ANON_KEY` | Secret | Build produkcyjny SPA |
| `HERENOW_SLUG` | **Variable** (nie Secret!) | Slug strony here.now |

Opcjonalnie w `smoke-integration.yml`: `TEST_USER_*`, `SUPABASE_*`.

Szczegóły: [github-cicd.md](github-cicd.md).

### here.now Dashboard — Variables (produkcja)

Ustawiane w panelu here.now dla opublikowanej strony. **Nie w GitHub.**

| Zmienna | Opis |
|---------|------|
| `JINA_API_KEY` | Wstrzykiwany do proxy jako `Authorization: Bearer …` przy zapytaniach do Jina |

Bez `JINA_API_KEY` proxy działa, ale limit zapytań Jina jest bardzo niski.

### Pliki konfiguracyjne (nie zmienne env)

| Plik | Opis |
|------|------|
| `site/.herenow/proxy.json` | Trasy proxy — commitowany do repo |
| `site/vite.config.ts` | Proxy dev, kopiowanie `.herenow` do `dist/` |
| `vitest.config.ts` | Testy unit + integracja, ładowanie `.env` |
| `playwright.config.ts` | E2E lokalne (dev server na :5173) |
| `playwright.smoke.config.ts` | Smoke testy produkcji |
| `/.herenow/state.json` | Lokalny stan publish (ignorowany przez Git) |
| `~/.herenow/credentials` | Lokalny klucz API here.now (poza repo) |

---

## Baza danych (Supabase)

### Tabela `products`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | uuid | Klucz główny |
| `user_id` | uuid | Właściciel (FK → auth.users) |
| `name` | text | Nazwa produktu |
| `url` | text | Link do strony sklepu (unikalny per user) |
| `current_price` | numeric | Ostatnia znana cena |
| `currency` | text | Waluta (domyślnie PLN) |
| `last_checked_at` | timestamptz | Data ostatniego sprawdzenia |

### Tabela `price_history`

Historia sprawdzeń — każde udane pobranie ceny tworzy wpis powiązany z `product_id`.

### RLS

Każdy użytkownik widzi i modyfikuje wyłącznie własne produkty (`auth.uid() = user_id`). Test integracyjny: `npm run test:integration`.

---

## Skrypty npm (katalog główny)

| Komenda | Opis |
|---------|------|
| `npm run dev` | Dev server Vite (http://localhost:5173) |
| `npm run build` | Build produkcyjny → `site/dist/` |
| `npm run lint` | Oxlint |
| `npm test` | Testy jednostkowe (Vitest) |
| `npm run test:integration` | Test RLS na live Supabase |
| `npm run test:e2e` | Testy E2E lokalne (Playwright) |
| `npm run test:smoke` | Smoke testy produkcji |
| `npm run deploy:ci` | Build + deploy na here.now (wymaga `.env`) |
| `npm run deploy` | Deploy lokalny ze slugiem z `.herenow/state.json` |

---

## CI/CD

Push na gałąź `main`:

1. **test** — lint, unit, build (weryfikacja), e2e
2. **deploy** — build z produkcyjnymi `VITE_*`, publish na here.now, smoke test

Pull requesty uruchamiają tylko job **test**.

---

## Powiązana dokumentacja

| Dokument | Zawartość |
|----------|-----------|
| [prd.md](prd.md) | Wymagania produktowe, user stories |
| [roadmap.md](roadmap.md) | Plan rozwoju i kamienie milowe |
| [infrastructure.md](infrastructure.md) | Szczegóły infrastruktury i deploy |
| [github-cicd.md](github-cicd.md) | Konfiguracja GitHub Actions |
| [test-plan.md](test-plan.md) | Ryzyka i mapowanie na testy |
| [../context/foundation/test-plan.md](../context/foundation/test-plan.md) | Pełny plan testów (10x) |
