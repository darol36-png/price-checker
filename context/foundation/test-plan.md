# Test Plan — Price Checker

Plan testów dla MVP Price Checker. Definiuje ryzyka produkcyjne (z [PRD](../../docs/prd.md#ograniczenia-i-ryzyka)) oraz testy, które je adresują.

## Ryzyka i pokrycie testami

| ID | Ryzyko | Wpływ | Test(y) | Plik |
|----|--------|-------|---------|------|
| R1 | Parser heurystyczny nie rozpozna ceny w niestandardowym HTML/Markdown sklepu | Użytkownik widzi „Nie znaleziono ceny” mimo poprawnej strony | `extracts price from JSON-LD Product schema`, `extracts price from meta tags`, `extracts Morele price without grosze`, `extracts iSpot data-price-amount finalPrice`, `extracts Honor Store promo price and ignores USD subscription footnote`, `ignores monthly installment and picks product price on iSpot-like page` | `tests/unit/price-parser.test.ts` |
| R2 | Sklep zwraca stronę anty-botową (Cloudflare) zamiast treści produktu | Fałszywa cena lub błąd pobierania | `detects Cloudflare bot wall`, `detects javascript cookie wall`, `does not flag pages with product prices` | `tests/unit/bot-page.test.ts` |
| R3 | Limit zapytań Jina Reader (HTTP 429) na produkcji | Masowe błędy sprawdzania cen | `returns Polish message for 429`, `returns generic message for other status codes` | `tests/unit/fetch-page.test.ts` |
| R4 | Błędna klasyfikacja zmiany ceny (wzrost/spadek/bez zmian) | Mylące podsumowanie po logowaniu | `returns first_check when previous price is null`, `returns up when price increased`, `returns down when price decreased`, `returns unchanged when price is the same`, `groups results by status` | `tests/unit/price-diff.test.ts`, `tests/unit/price-checker.test.ts` |
| R5 | Niezalogowany użytkownik ma dostęp do cudzych produktów | Naruszenie prywatności danych | `redirects unauthenticated users from dashboard` | `tests/e2e/auth-crud-price.spec.ts` |
| R6 | Pełny flow sprawdzania cen po logowaniu nie działa end-to-end | Brak głównej wartości produktu | `shows price decrease summary after login` | `tests/e2e/price-check.spec.ts` |
| R7 | Komunikaty błędów auth po angielsku zamiast po polsku | Zła UX przy logowaniu | `translates invalid login credentials`, `returns unknown messages unchanged` | `tests/unit/auth-errors.test.ts` |
| R8 | Użytkownik A widzi lub modyfikuje produkty użytkownika B (naruszenie RLS) | Wyciek danych między kontami | `użytkownik B nie widzi produktu użytkownika A na liście`, `użytkownik B nie może zaktualizować produktu A`, `użytkownik A nie widzi produktu B` | `tests/integration/rls-isolation.test.ts` |
| R9 | Produkcja niedostępna lub SPA nie działa po deployu | Aplikacja offline dla użytkowników | `strona logowania ładuje się i wyświetla formularz`, `dashboard przekierowuje niezalogowanego użytkownika`, `statyczne assety SPA są dostępne` | `tests/e2e/smoke/production.spec.ts` |

## Ryzyka poza zakresem automatycznych testów (v1)

| Ryzyko | Powód pominięcia | Mitigacja |
|--------|------------------|-----------|
| Konkretny sklep blokuje scraping w 100% przypadków | Wymaga live HTTP i rotacji IP | Test ręczny na produkcji; dedykowany proxy (np. iSpot) |
| Limit 30 req/h/IP Jina w praktyce produkcyjnej | Test integracyjny kosztowny i niestabilny | `JINA_API_KEY`, opóźnienie między sprawdzeniami (`DELAY_BETWEEN_CHECKS_MS`) |

## Uruchamianie testów

```bash
npm test              # unit (Vitest) — R1–R4, R7
npm run test:integration  # RLS na live Supabase — R8 (wymaga TEST_USER_*)
npm run test:e2e      # e2e lokalne (mocki) — R5, R6
npm run test:smoke    # smoke produkcji — R9 (PLAYWRIGHT_BASE_URL)
npm run build         # weryfikacja kompilacji przed deployem
```

CI (`.github/workflows/ci.yml`): lint → unit → build → e2e przy każdym push/PR.  
Opcjonalnie: `.github/workflows/smoke-integration.yml` (workflow_dispatch) — smoke + RLS z sekretami GitHub.

## Kryteria zaliczenia

Test plan uznaje się za spełniony, gdy:

1. Każde ryzyko R1–R9 ma co najmniej jeden test wymieniony w tabeli.
2. Wszystkie testy unit i e2e przechodzą lokalnie (`npm test && npm run test:e2e`).
3. Nowe ryzyko dodane do PRD ma odpowiadający wpis w tej tabeli przed merge.
