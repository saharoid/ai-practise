# Plan change demo: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lokalni React portal za promenu pretplate (jedan ekran, MSW mock, stari flat preview format) kao osnova za AI program.

**Architecture:** Vite SPA. Server state samo kroz TanStack Query; izabrani plan je lokalni `useState`. MSW handleri i in-memory db se dele između dev browsera i Vitest-a. Preview DTO prolazi kroz jedan adapter (`toPreview`) koji koriste dva mesta: `PreviewSummary` i `ConfirmChange`.

**Tech Stack:** React 19, TypeScript 5 strict, Vite, TanStack Query 5, Vitest, React Testing Library, MSW, ESLint + Prettier, CSS Modules.

**Spec:** `docs/superpowers/specs/2026-11-11-plan-change-demo-design.md`

## Global Constraints

- Pravila iz `CLAUDE.md` (= react.md bez "Key Sections Explained" i "See Also"): named exports, bez default export-a, `{Component}Props` interfejsi, destrukturisani props, CSS Modules, bez inline stilova, bez `any` bez komentara, `interface` za oblike objekata, discriminated unions za stanja, API tipovi u `src/api/types.ts`, test helperi u `src/test/helpers.ts`, testovi pored fajla.
- Tačne verzije (bez `^`), `package-lock.json` u repou. Polazne verzije (proverene na npm 2026-11-11): react/react-dom 19.3.1, typescript 5.9.3 (react.md traži 5.x; 7.x se ne koristi), vite 8.3.8, @vitejs/plugin-react 6.3.0, @tanstack/react-query 5.107.1, vitest 5.1.0, @testing-library/react 16.3.3, @testing-library/user-event 14.6.9, @testing-library/jest-dom 7.0.1, jsdom 31.0.0, msw 3.0.5, eslint 10.14.0, @eslint/js 10.0.1, typescript-eslint 8.72.2, eslint-plugin-react-hooks 7.1.1, globals 17.14.0, prettier 3.10.0, @types/react 19.3.0, @types/react-dom 19.3.0. Ako `npm install` prijavi peer konflikt (npr. eslint 10 i react-hooks plugin), spusti samo taj paket na najbližu kompatibilnu verziju i zabeleži to u commit poruci. Bez drugih paketa.
- MSW API proveri u instaliranoj verziji (3.x) pre pisanja handlera; ne pretpostavljaj v2 API.
- Skripte: `dev` = `vite --port 3000`, `build`, `test` = `vitest`, `lint` = `eslint . && prettier --check .`, `lint:fix`, `typecheck` = `tsc --noEmit`. Pre svakog commit-a: `npm run typecheck && npm run lint`, i testovi sa `npm run test -- --run`.
- Git: lokalni repo, grana `main`, conventional commits (`feat:`, `chore:`, `test:`, `docs:`). Bez remote-a i PR-a.
- Rad i provera teku u Linux radnom folderu; u `~/Developer/ai-practise` na Mac-u idu izvorni kod, lockfile, `public/mockServiceWorker.js` i `.git`, nikad `node_modules`.
- Van obima: novi API format, A/B/A sa istekom, intent/status endpoint, izgubljen odgovor, CI/hook, Zustand, router, auth, Playwright.

## Review Focus

1. Dupli klik na "Potvrdi": dugme je onemogućeno dok mutacija traje; handler prima tačno jedan POST. Test u Task 5.
2. Korisnik izabere trenutni plan: nema preview zahteva, potvrda nije dostupna. Test u Task 4 i Task 5.
3. Preview istekne dok korisnik stoji na ekranu: klik daje `409 QUOTE_EXPIRED`, poruku i novi preview, bez lažnog uspeha. Test u Task 5.
4. Preview zahtev padne: poruka u `role="alert"` i "Pokušaj ponovo" učitava preview. Test u Task 5.
5. Iznos `0` i druga valuta: `formatMoney` ne vraća prazan string niti pogrešnu valutu. Test u Task 2.

---

### Task 1: Osnova projekta i alati

**Files:**
- Create: `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.gitignore`, `index.html`, `CLAUDE.md`, `src/main.tsx`, `src/App.tsx`, `src/App.module.css`, `src/App.test.tsx`, `src/test/setup.ts`, `src/vite-env.d.ts`
- Spec već postoji: `docs/superpowers/specs/2026-11-11-plan-change-demo-design.md`

**Interfaces:**
- Produces: `App` (named export) iz `src/App.tsx`; Vitest okruženje `jsdom`, `setupFiles: ['src/test/setup.ts']`, globals isključeni (importi iz `vitest`).

- [ ] **Step 1:** `git init -b main`, `npm init`, instaliraj tačne verzije iz Global Constraints sa `--save-exact`. `CLAUDE.md` = sadržaj `react.md` do linije pre "## Key Sections Explained", bez zalutalog zatvarajućeg ``` .
- [ ] **Step 2: Failing test** `src/App.test.tsx`: `it('renders the page heading')` očekuje `getByRole('heading', { name: 'Promena plana' })`.
- [ ] **Step 3:** `npm run test -- --run` → FAIL (nema `App`).
- [ ] **Step 4:** `App` renderuje `<h1>Promena plana</h1>`; `main.tsx` montira `App` u `QueryClientProvider`.
- [ ] **Step 5:** `npm run test -- --run`, `npm run typecheck`, `npm run lint`, `npm run build` → sve prolazi.
- [ ] **Step 6:** Commit: `chore: scaffold vite react app with tooling and CLAUDE.md` (uključuje spec i ovaj plan).

### Task 2: Tipovi, adapter i formatiranje iznosa

**Files:**
- Create: `src/api/types.ts`, `src/types/plan.ts`, `src/api/adapters/preview.ts`, `src/api/adapters/preview.test.ts`, `src/utils/formatMoney.ts`, `src/utils/formatMoney.test.ts`

**Interfaces:**
- Produces (`src/api/types.ts`):
  - `interface SubscriptionDto { subscriptionId: string; planId: PlanId; version: number }`
  - `interface PreviewDto { subscriptionId: string; planId: PlanId; quoteId: string; amountMinor: number; currency: string; effectiveDate: string; expiresAt: string }` (stari flat format, ISO datumi)
  - `interface ChangeRequestDto { quoteId: string }`
  - `interface ApiErrorDto { code: 'QUOTE_INVALID' | 'QUOTE_EXPIRED' | 'NOT_FOUND' }`
- Produces (`src/types/plan.ts`): `type PlanId = 'basic' | 'standard' | 'pro'`; `interface Plan { id: PlanId; name: string }`; `PLANS: readonly Plan[]` (Basic, Standard, Pro); `interface Money { amountMinor: number; currency: string }`; `interface Preview { subscriptionId: string; planId: PlanId; quoteId: string; dueNow: Money; effectiveDate: string; expiresAt: string }`.
- Produces: `toPreview(dto: PreviewDto): Preview`; `formatMoney(money: Money, locale?: string): string` (podrazumevano `'sr-RS'`).

Napomena: normalizovan model već ima `dueNow`, a DTO je flat. Nedelja 1 menja samo DTO stranu adaptera.

- [ ] **Step 1: Failing tests**
  - `toPreview maps flat dto to normalized preview`: ulaz `{ subscriptionId: 'sub_1', planId: 'standard', quoteId: 'q_1', amountMinor: 1900, currency: 'EUR', effectiveDate: '2026-12-01', expiresAt: '2026-11-11T13:05:00.000Z' }` → `dueNow: { amountMinor: 1900, currency: 'EUR' }`, ostala polja ista.
  - `formatMoney formats EUR minor units`: `formatMoney({ amountMinor: 1900, currency: 'EUR' }, 'en-US')` → `'€19.00'`.
  - `formatMoney formats zero`: `amountMinor: 0` → `'€0.00'` (en-US).
  - `formatMoney respects currency`: `{ amountMinor: 1900, currency: 'USD' }`, en-US → `'$19.00'`.
- [ ] **Step 2:** testovi → FAIL.
- [ ] **Step 3:** implementacija; `formatMoney` deli sa 100 i koristi `Intl.NumberFormat(locale, { style: 'currency', currency })`.
- [ ] **Step 4:** testovi, typecheck, lint → PASS.
- [ ] **Step 5:** Commit `feat: add api types, preview adapter and money formatting`.

### Task 3: Mock servis (db, control, handleri)

**Files:**
- Create: `src/mocks/db.ts`, `src/mocks/control.ts`, `src/mocks/handlers.ts`, `src/mocks/handlers.test.ts`, `src/mocks/server.ts`, `src/mocks/browser.ts`
- Modify: `src/test/setup.ts` (server listen `onUnhandledRequest: 'error'`, `resetHandlers` + `resetDb` + `resetControl` posle svakog testa, close)

**Interfaces:**
- Produces (`db.ts`): `PRICES: Record<PlanId, number>` = `{ basic: 900, standard: 1900, pro: 3900 }` (EUR centi); `db` sa pretplatom `{ subscriptionId: 'sub_1', planId: 'basic', version: 1 }` i mapom quote-ova `{ quoteId, subscriptionId, planId, amountMinor, currency, expiresAt: number, used: boolean }`; `resetDb(): void`.
- Produces (`control.ts`): `control = { delayMs: number; quoteTtlMs: number }`, podrazumevano `delayMs: 0`, `quoteTtlMs: 300_000`; `resetControl(): void`. `browser.ts` postavlja `control.delayMs = 400`.
- Produces (`handlers.ts`): `handlers` niz za rute iz speca: `GET /api/subscriptions/:id`, `GET /api/subscriptions/:id/preview?planId=`, `POST /api/subscriptions/:id/change`. `quoteId` = `quote_<n>` (brojač resetuje `resetDb`). `effectiveDate` = sledeći prvi u mesecu (ISO datum). Greške: nepoznata pretplata `404 { code: 'NOT_FOUND' }`; quote ne postoji, druga pretplata ili već iskorišćen → `409 QUOTE_INVALID`; istekao → `409 QUOTE_EXPIRED`.
- Produces (`server.ts`): `server` (MSW node), uz `capturedChangeRequests: ChangeRequestDto[]` koje handler puni i `resetDb` prazni.

- [ ] **Step 1: Failing tests** (`handlers.test.ts`, pravi `fetch` kroz MSW server):
  - `returns subscription sub_1 on basic, version 1`
  - `returns 404 for unknown subscription`
  - `preview returns flat dto with price for plan`: `planId=pro` → `amountMinor: 3900, currency: 'EUR'`, `quoteId` počinje sa `quote_`.
  - `change applies plan and bumps version`: preview `standard`, POST njegov `quoteId` → `200`, `planId: 'standard', version: 2`; zatim GET pokazuje isto.
  - `change rejects reused quote`: drugi POST istog `quoteId` → `409 QUOTE_INVALID`, `version` ostaje 2.
  - `change rejects expired quote`: `control.quoteTtlMs = 0` (ili lažno vreme `vi.useFakeTimers`/`vi.setSystemTime`) → `409 QUOTE_EXPIRED`, plan ostaje `basic`.
  - `change rejects unknown quote` → `409 QUOTE_INVALID`.
- [ ] **Step 2:** testovi → FAIL.
- [ ] **Step 3:** implementacija; kašnjenje kroz MSW `delay(control.delayMs)` (proveri ime u MSW 3).
- [ ] **Step 4:** testovi, typecheck, lint → PASS.
- [ ] **Step 5:** Commit `feat: add in-memory msw mock service`.

### Task 4: API klijent i hookovi

**Files:**
- Create: `src/api/client.ts`, `src/api/client.test.ts`, `src/features/plan-change/useSubscription.ts`, `src/features/plan-change/usePreview.ts`, `src/features/plan-change/usePreview.test.tsx`, `src/features/plan-change/useConfirmChange.ts`, `src/test/helpers.ts`

**Interfaces:**
- Produces (`client.ts`): `class ApiError extends Error { status: number; code: ApiErrorDto['code'] | 'UNKNOWN' }`; `getSubscription(id: string, signal?: AbortSignal): Promise<SubscriptionDto>`; `getPreview(id: string, planId: PlanId, signal?: AbortSignal): Promise<Preview>` (poziva `toPreview`, jedino mesto gde se adapter zove); `confirmChange(id: string, body: ChangeRequestDto): Promise<SubscriptionDto>`. Ne-2xx odgovor → `ApiError`.
- Produces (hookovi): `useSubscription(id)` sa key `['subscription', id]`; `usePreview(id: string, planId: PlanId | null, currentPlanId: PlanId | undefined)` sa key `['preview', id, planId]`, `enabled` samo kad je `planId` zadat i različit od `currentPlanId`, `queryFn` prosleđuje `signal`, `retry: false`; `useConfirmChange(id)` = `useMutation`, na uspeh invalidira `['subscription', id]` i `['preview', id]`; na `ApiError` sa statusom 409 invalidira `['preview', id]` (novi quote).
- Produces (`helpers.ts`): `renderWithClient(ui: ReactElement)` i `createTestQueryClient()` (retry isključen, `gcTime: Infinity` nije potreban), `deferred<T>()` iz PDF-a.

- [ ] **Step 1: Failing tests**
  - `client.test.ts`: `getPreview returns normalized preview` (ima `dueNow`), `confirmChange throws ApiError with code QUOTE_EXPIRED on 409`.
  - `usePreview.test.tsx`: `does not request preview when planId equals current plan` (handler brojač ostaje 0), `requests preview with key per plan`.
- [ ] **Step 2:** testovi → FAIL.
- [ ] **Step 3:** implementacija.
- [ ] **Step 4:** testovi, typecheck, lint → PASS.
- [ ] **Step 5:** Commit `feat: add api client and plan change query hooks`.

### Task 5: Ekran za promenu plana

**Files:**
- Create u `src/features/plan-change/`: `PlanChangePage.tsx`, `CurrentPlan.tsx`, `PlanPicker.tsx`, `PreviewSummary.tsx`, `ConfirmChange.tsx`, svaki sa `.module.css` i `.test.tsx`; `PlanChangePage.test.tsx` sadrži integracione testove.
- Modify: `src/App.tsx` (renderuje `PlanChangePage subscriptionId="sub_1"`).

**Interfaces:**
- Consumes: hookovi i `formatMoney` iz Task 2 i 4, `server`, `capturedChangeRequests`, `control` iz Task 3, `deferred` i `renderWithClient` iz Task 4.
- Produces: `PlanChangePage({ subscriptionId }: PlanChangePageProps)`; `PlanPicker({ plans, currentPlanId, selectedPlanId, onSelect })` kao `radiogroup` sa labelom "Izaberi plan"; `PreviewSummary({ preview })`; `ConfirmChange({ preview, isExpired, isPending, onConfirm })` sa dugmetom "Potvrdi promenu".
- Tekstovi (tačni, testovi ih koriste): status učitavanja "Učitavanje...", greška preview-a "Obračun nije dostupan." + dugme "Pokušaj ponovo", `QUOTE_EXPIRED` → "Obračun je istekao. Učitali smo novi.", `QUOTE_INVALID` → "Obračun više ne važi. Učitali smo novi.", uspeh → "Plan je promenjen na {name}." u `role="status"`.

- [ ] **Step 1: Failing tests** (`PlanChangePage.test.tsx`)
  - `shows current plan`: "Basic" kao trenutni plan.
  - `selecting current plan does not enable confirm`.
  - `selecting a plan shows its amount`: izbor Pro → prikaz `formatMoney` za 3900 EUR.
  - `confirm sends quote of selected plan and shows new plan`: izbor Standard, klik → `capturedChangeRequests` je tačno `[{ quoteId: <quoteId standard preview-a> }]`, zatim status "Plan je promenjen na Standard.", trenutni plan Standard.
  - `double click sends one request`: dva brza klika → `capturedChangeRequests.length === 1`.
  - `expired quote shows message and loads new preview`: `control.quoteTtlMs = 0` pre izbora, klik → "Obračun je istekao. Učitali smo novi." u `role="alert"`, plan ostaje Basic.
  - `preview failure can be retried`: `server.use` vrati 500 jednom → "Obračun nije dostupan.", klik "Pokušaj ponovo" → iznos prikazan.
  - `A/B: late response for A does not replace B`: preview handler preko `server.use` vraća `a.promise` / `b.promise` (deferred); izaberi Standard pa Pro, razreši B pa A, sačekaj da se A obradi (npr. `queryClient.isFetching() === 0`), proveri prikaz za Pro i da POST šalje Pro `quoteId`.
  - smoke test po komponenti.
- [ ] **Step 2:** testovi → FAIL.
- [ ] **Step 3:** implementacija. `isExpired` = `Date.parse(preview.expiresAt) <= Date.now()` u trenutku rendera; dugme onemogućeno ako nema preview-a za izabrani plan, ako je istekao ili dok mutacija traje.
- [ ] **Step 4:** svi testovi, typecheck, lint, build → PASS.
- [ ] **Step 5:** Commit `feat: add plan change screen`.

### Task 6: Dev MSW, README i predaja na Mac

**Files:**
- Modify: `src/main.tsx` (u `import.meta.env.DEV` pokreće `worker.start()` iz `src/mocks/browser.ts` pre rendera)
- Create: `public/mockServiceWorker.js` (`npx msw init public --save`), `README.md`

**Interfaces:**
- Consumes: `browser.ts` iz Task 3.

- [ ] **Step 1:** `npx msw init public --save`; izmena `main.tsx`.
- [ ] **Step 2:** `npm run dev` i ručna provera (ili headless browser ako je dostupan): ekran učitava Basic, izbor Pro prikazuje iznos posle ~400 ms, potvrda menja plan. Zabeleži šta je stvarno provereno i čime.
- [ ] **Step 3:** `README.md`: šta je projekat, `npm ci` / `npm run dev` / ostale komande, opis mock API-ja i `control.ts`, ograničenja (stanje u memoriji, nema pravog backenda), Node verzija korišćena pri proveri (`engines` u `package.json`), šta je van obima i u kojoj nedelji programa se radi.
- [ ] **Step 4:** pun prolaz: `npm run test -- --run`, `npm run typecheck`, `npm run lint`, `npm run build`.
- [ ] **Step 5:** Commit `docs: add readme and enable msw in dev`.
- [ ] **Step 6:** Kopiraj u `~/Developer/ai-practise` sve osim `node_modules` i `dist` (uključujući `.git`). Proveri na Mac strani da `git log --oneline` pokazuje 6 commit-ova i da `git status` nema izmena.
