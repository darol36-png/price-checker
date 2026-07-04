# Frontend — Price Checker

Katalog `site/` zawiera aplikację React (SPA) — jedyny moduł z kodem UI.

Pełna dokumentacja projektu: **[../docs/project.md](../docs/project.md)**

## Szybko

```bash
# z katalogu głównego repozytorium
npm run dev      # http://localhost:5173
npm run build    # wynik w site/dist/
```

Wymaga pliku `.env` w katalogu głównym (patrz `../.env.example`).

## Struktura `src/`

| Katalog | Zawartość |
|---------|-----------|
| `components/` | Formularze, lista produktów, banner cen |
| `hooks/` | Auth, CRUD produktów, sprawdzanie cen |
| `lib/` | Parser cen, fetch stron, klient Supabase |
| `pages/` | Login, Dashboard |
| `types/` | Typy TypeScript |

Konfiguracja proxy produkcyjnego: `.herenow/proxy.json` (kopiowany do `dist/` przy buildzie).
