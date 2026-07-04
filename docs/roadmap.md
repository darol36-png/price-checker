# Roadmap — Price Checker

## Faza 0 — Fundament (tydzień 1)

- [x] Dokumentacja kontekstowa: PRD, roadmap, infrastructure
- [x] Scaffold projektu: Vite + React + TypeScript
- [x] Konfiguracja Supabase (migracja SQL, RLS)
- [x] Konfiguracja here.now (proxy.json, publish script)
- [ ] Utworzenie projektu Supabase i konfiguracja zmiennych here.now

## Faza 1 — Auth + CRUD (tydzień 1–2)

- [x] Rejestracja i logowanie (Supabase Auth)
- [x] Dashboard z listą produktów
- [x] Formularz dodawania produktu
- [x] Edycja i usuwanie produktów
- [x] Walidacja URL

## Faza 2 — Silnik cen (tydzień 2)

- [x] Parser heurystyczny (JSON-LD, meta, regex)
- [x] Integracja Jina Reader przez proxy
- [x] Automatyczne sprawdzanie cen po logowaniu
- [x] Przycisk „Sprawdź teraz”
- [x] Banner PriceChangeSummary

## Faza 3 — Jakość i deploy (tydzień 2–3)

- [x] Testy jednostkowe (Vitest)
- [x] Testy E2E (Playwright)
- [x] CI (GitHub Actions)
- [x] Deploy na here.now
- [x] Smoke test na produkcji (`npm run test:smoke`)
- [x] Test integracyjny RLS (`npm run test:integration`)

## Faza 4 — Przyszłość (backlog)

- OpenRouter jako fallback ekstrakcji cen
- Powiadomienia email przy spadku ceny
- Harmonogram sprawdzania (cron / Supabase Edge Functions)
- Wykres historii cen
- Import listy produktów z CSV
- Obsługa wielu walut z konwersją NBP

## Kamienie milowe

| Milestone | Data docelowa | Status |
|-----------|---------------|--------|
| M1: Dokumentacja + scaffold | Tydzień 1 | Done |
| M2: Auth + CRUD działają lokalnie | Tydzień 2 | Done |
| M3: Sprawdzanie cen + banner | Tydzień 2 | Done |
| M4: Testy + CI zielone | Tydzień 3 | Done |
| M5: Produkcja na here.now | Tydzień 3 | Done |
