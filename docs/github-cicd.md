# Konfiguracja GitHub — CI/CD

Automatyczny pipeline: **push/PR → testy**, **push na `main` → deploy na here.now + smoke**.

## 1. Utwórz repozytorium na GitHub

```bash
git remote add origin https://github.com/TWOJ_USER/price-checker.git
git push -u origin main
```

## 2. Sekrety (Settings → Secrets and variables → Actions → Secrets)

| Sekret | Wartość | Opis |
|--------|---------|------|
| `HERENOW_API_KEY` | klucz z here.now | Publikacja strony |
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Wbijany w build SPA |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` | Klucz publiczny Supabase |

`VITE_*` trafiają do bundle w przeglądarce — to normalne (klucz publishable + RLS).

## 3. Zmienne (Settings → Secrets and variables → Actions → Variables)

| Zmienna | Przykład | Opis |
|---------|----------|------|
| `HERENOW_SLUG` | `onyx-nebula-z9zp` | Slug istniejącej strony na here.now |

## 4. Zmienne na here.now (dashboard, nie GitHub)

W [here.now Dashboard](https://here.now) → Twoja strona → **Variables**:

| Zmienna | Opis |
|---------|------|
| `JINA_API_KEY` | Wyższy limit Jina Reader (proxy `/api/fetch`, `/api/jina-reader`) |

`SUPABASE_ANON_KEY` na here.now **nie jest wymagany** — aplikacja łączy się z Supabase bezpośrednio z przeglądarki.

## 5. Środowisko `production` (opcjonalnie)

Workflow używa `environment: production`. W GitHub możesz dodać reguły zatwierdzania przed deployem (Settings → Environments → production).

## 6. Przepływ

```
PR / push
   └─ job: test (lint, unit, build, e2e)

push na main (po przejściu testów)
   └─ job: deploy
        ├─ build z VITE_SUPABASE_*
        ├─ publish → https://{HERENOW_SLUG}.here.now/
        └─ smoke test produkcji
```

## 7. Deploy ręczny (lokalnie)

```bash
# .env: HERENOW_API_KEY, HERENOW_SLUG, VITE_SUPABASE_*
bash scripts/ci-deploy.sh
```

## 8. Opcjonalny workflow ręczny

`smoke-integration.yml` (`workflow_dispatch`) — smoke + test RLS z dodatkowymi sekretami `TEST_USER_*`.
