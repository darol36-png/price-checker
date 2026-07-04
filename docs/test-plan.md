# Test Plan — Price Checker

> Kanoniczna wersja planu testów (workflow 10x): [`context/foundation/test-plan.md`](../context/foundation/test-plan.md)

Plan testów definiuje ryzyka produkcyjne i mapuje je na konkretne testy w repozytorium.

## Ryzyka i pokrycie testami

| ID | Ryzyko | Test(y) | Plik |
|----|--------|---------|------|
| R1 | Parser heurystyczny nie rozpozna ceny w niestandardowym HTML/Markdown | `extracts price from JSON-LD Product schema`, `extracts Morele price without grosze`, `extracts Honor Store promo price…`, `extracts iSpot data-price-amount finalPrice` | `tests/unit/price-parser.test.ts` |
| R2 | Sklep zwraca stronę anty-botową zamiast produktu | `detects Cloudflare bot wall`, `detects javascript cookie wall` | `tests/unit/bot-page.test.ts` |
| R3 | Limit zapytań Jina Reader (HTTP 429) | `returns Polish message for 429` | `tests/unit/fetch-page.test.ts` |
| R4 | Błędna klasyfikacja zmiany ceny | `comparePrices` (up/down/unchanged/first_check), `groups results by status` | `tests/unit/price-diff.test.ts`, `tests/unit/price-checker.test.ts` |
| R5 | Niezalogowany dostęp do dashboardu | `redirects unauthenticated users from dashboard` | `tests/e2e/auth-crud-price.spec.ts` |
| R6 | Flow sprawdzania cen po logowaniu | `shows price decrease summary after login` | `tests/e2e/price-check.spec.ts` |
| R7 | Komunikaty błędów auth po angielsku | `translates invalid login credentials` | `tests/unit/auth-errors.test.ts` |
| R8 | Naruszenie RLS — użytkownik widzi cudze produkty | `użytkownik B nie widzi produktu użytkownika A…` | `tests/integration/rls-isolation.test.ts` |
| R9 | Produkcja niedostępna po deployu | `strona logowania ładuje się…`, `dashboard przekierowuje…` | `tests/e2e/smoke/production.spec.ts` |

Szczegóły, ryzyka poza zakresem automatycznych testów i kryteria zaliczenia: [`context/foundation/test-plan.md`](../context/foundation/test-plan.md).

## Uruchamianie

```bash
npm test
npm run test:integration   # wymaga TEST_USER_A/B_* w .env
npm run test:e2e
npm run test:smoke           # PLAYWRIGHT_BASE_URL → produkcja
```
