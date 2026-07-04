# PRD — Price Checker

## Problem

Użytkownicy chcą śledzić ceny produktów w sklepach internetowych bez ręcznego sprawdzania stron. Potrzebują prostego narzędzia, które po zalogowaniu automatycznie porówna aktualne ceny z poprzednimi i pokaże, czy produkt podrożał czy potaniał.

## Cele

- Umożliwić rejestrację i logowanie użytkowników
- Pozwolić na dodawanie, edycję, przeglądanie i usuwanie linków do produktów (CRUD)
- Po każdym logowaniu automatycznie sprawdzać ceny wszystkich produktów użytkownika
- Natychmiast po logowaniu wyświetlić podsumowanie zmian cen
- Wdrożyć aplikację na here.now z backendem Supabase

## Persony

**Anna — świadomy kupujący**  
Chce śledzić cenę telefonu i laptopa. Loguje się raz dziennie i oczekuje szybkiego podsumowania zmian.

**Marek — porównywarka ofert**  
Dodaje wiele linków z różnych sklepów. Potrzebuje CRUD i historii cen.

## User stories

| ID | Jako użytkownik | Chcę | Aby |
|----|-----------------|------|-----|
| US-1 | nowy użytkownik | zarejestrować się emailem i hasłem | mieć własne konto |
| US-2 | zalogowany użytkownik | dodać link do produktu z nazwą | śledzić jego cenę |
| US-3 | zalogowany użytkownik | edytować i usuwać produkty | zarządzać listą |
| US-4 | zalogowany użytkownik | po logowaniu zobaczyć podsumowanie zmian cen | wiedzieć, czy warto kupować |
| US-5 | zalogowany użytkownik | ręcznie uruchomić sprawdzanie cen | odświeżyć dane bez ponownego logowania |

## Wymagania funkcjonalne

### Autentykacja
- Rejestracja i logowanie przez Supabase Auth (email + hasło, min. 6 znaków)
- Sesja utrzymywana w localStorage
- Wylogowanie czyści sesję

### CRUD produktów
- Pola: nazwa (wymagana), URL (wymagany, http/https)
- Unikalność URL w obrębie użytkownika
- Lista produktów z ostatnią ceną i datą sprawdzenia
- Edycja URL resetuje zapisaną cenę (wymusza ponowne sprawdzenie)
- Usunięcie produktu usuwa historię cen (kaskada)

### Sprawdzanie cen
- Automatyczne po logowaniu (jeśli użytkownik ma produkty)
- Ręczne przez przycisk „Sprawdź teraz”
- Pobieranie strony przez Jina Reader (proxy here.now)
- Ekstrakcja ceny heurystyczna: JSON-LD, meta tagi, regex
- Zapis nowej ceny i wpisu w `price_history`
- Maks. 3 równoległe sprawdzenia

### Podsumowanie zmian
- Banner z liczbą produktów: taniej / drożej / bez zmian / nowe ceny / błędy
- Rozwijana lista szczegółów per produkt
- Możliwość zamknięcia bannera

## Wymagania niefunkcjonalne

- Interfejs w języku polskim
- Responsywny layout (mobile-first)
- Frontend: React + TypeScript + Vite
- Backend: Supabase (PostgreSQL + RLS)
- Deploy: here.now (SPA + proxy routes)
- Testy: Vitest (unit) + Playwright (e2e); plan testów: [`test-plan.md`](test-plan.md)

## Kryteria akceptacji

**US-1 — Rejestracja**
- Given formularz rejestracji, When podam email i hasło (≥6 znaków), Then konto zostanie utworzone i zostanę przekierowany do dashboardu.

**US-2 — Dodanie produktu**
- Given zalogowany użytkownik na dashboardzie, When dodam nazwę i prawidłowy URL, Then produkt pojawi się na liście.

**US-3 — Edycja i usuwanie**
- Given produkt na liście, When kliknę „Edytuj” i zmienię dane, Then lista się zaktualizuje.
- Given produkt na liście, When kliknę „Usuń” i potwierdzę, Then produkt zniknie z listy.

**US-4 — Sprawdzanie po logowaniu**
- Given użytkownik z co najmniej 1 produktem, When się zaloguję, Then ceny zostaną sprawdzone i zobaczę banner podsumowania.

**US-5 — Sprawdź teraz**
- Given dashboard z produktami, When kliknę „Sprawdź teraz”, Then ceny zostaną odświeżone i zobaczę zaktualizowane podsumowanie.

## Poza zakresem (v1)

- Integracja AI (OpenRouter) do ekstrakcji cen
- Powiadomienia email / push
- Aplikacja mobilna
- Harmonogram sprawdzania bez logowania (cron)
- Wsparcie dla wszystkich sklepów (ograniczenia anty-botowe)

## Ograniczenia i ryzyka

- Nie wszystkie sklepy pozwalają na scraping — błąd per produkt, nie blokuje pozostałych (R2, R5–R6 w [test-plan.md](test-plan.md))
- Jina Reader ma limit 30 req/h/IP na produkcji (here.now proxy) (R3 w [test-plan.md](test-plan.md))
- Parser heurystyczny może nie rozpoznać niestandardowych layoutów (R1 w [test-plan.md](test-plan.md))
