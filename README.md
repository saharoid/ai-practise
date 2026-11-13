# ai-practise: demo za promenu plana pretplate

Mali lokalni React portal sa sintetičkim podacima, osnova za šestonedeljni program
„AI kao deo seniorskog frontend rada”. Jedan ekran: trenutni plan, izbor plana, obračun (preview)
i potvrda promene. Nema pravog backenda: sve odgovore daje MSW mock u browseru i u testovima.

Dizajn: `docs/superpowers/specs/2026-11-11-plan-change-demo-design.md`.
Plan implementacije: `docs/superpowers/plans/2026-11-11-plan-change-demo.md`.
Pravila za agente: `CLAUDE.md`.

## Pokretanje

Potreban je Node `^22.22.2`, `^24.15.0` ili `>=26` (zahtevi Vite, MSW i jsdom). Provereno sa
Node 22.23.4 i npm 10.9.9 (Linux). Na Mac-u još nije pokrenuto.

```bash
npm ci
npm run dev          # http://localhost:3000, MSW service worker se pokreće sam
```

| Komanda                             | Šta radi                                                       |
| ----------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                       | dev server na portu 3000                                       |
| `npm run build`                     | typecheck + produkcioni build (bez mocka)                      |
| `npm run test`                      | Vitest u watch režimu; `npm run test -- --run` za jedan prolaz |
| `npm run lint` / `npm run lint:fix` | ESLint + Prettier provera / ispravka                           |
| `npm run typecheck`                 | `tsc --noEmit`                                                 |

## Mock API

Stanje živi u memoriji (`src/mocks/db.ts`) i gubi se na reload. Pretplata `sub_1` počinje na planu
Basic. Cene: Basic 9,00 €, Standard 19,00 €, Pro 39,00 €.

| Ruta                                               | Odgovor                                                                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/subscriptions/:id`                       | `{ subscriptionId, planId, version }`; nepoznat id → `404 NOT_FOUND`                                                                            |
| `GET /api/subscriptions/:id/preview?planId=`       | pravi quote i vraća **nested format**: `{ subscriptionId, plan: { id }, quoteId, dueNow: { amountMinor, currency }, effectiveDate, expiresAt }` |
| `POST /api/subscriptions/:id/change` `{ quoteId }` | menja plan i povećava `version`; nepostojeći, tuđi ili iskorišćen quote → `409 QUOTE_INVALID`; istekao → `409 QUOTE_EXPIRED`                    |

`src/mocks/control.ts` podešava kašnjenje (u dev-u 400 ms, u testovima 0) i trajanje quote-a
(5 minuta). Testovi za tačan redosled odgovora koriste `server.use(...)` i `deferred()` iz
`src/test/helpers.ts`.

## Kako radi ekran

- Server state ide samo kroz TanStack Query; izabrani plan je lokalni `useState`.
- Preview query key je `['preview', subscriptionId, planId]`, a prikazuje se samo preview čiji
  `planId` odgovara izboru. To je postojeća zaštita od zakasnelog odgovora.
- Preview DTO prolazi kroz `src/api/adapters/preview.ts` (`toPreview`). Adapter privremeno prima i
  stari flat format (`planId`, `amountMinor`, `currency`) i oba pretvara u isti model sa `plan.id` i
  `dueNow`; odgovor ni u jednom formatu ruši query. Model koriste `PreviewSummary` (prikaz),
  `ConfirmChange` (iznos) i `PlanChangePage` (`plan.id` za zaštitu od zakasnelog odgovora, `quoteId`
  za potvrdu).
- Potvrda je onemogućena bez važećeg preview-a, posle isteka quote-a i dok zahtev traje.
  Posle `409` preview se ponovo učitava; servis i sam proverava quote.

## Ograničenja i šta je namerno van osnove

- Mock proverava frontend prema dogovorenom API contract-u; ne predstavlja garancije pravog
  billing sistema.
- Ručno provereno u headless Chromium-u (izbor Pro, prikaz 39,00 €, potvrda, novi plan). Fokus i
  čitači ekrana nisu posebno provereni.
- Zadaci programa koji ovde nisu urađeni: A/B/A sa istekom ili promenom konteksta (nedelja 2), intent, status endpoint i
  izgubljen odgovor (nedelja 3), CI ili git hook (nedelja 5).
