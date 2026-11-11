# Plan change demo: osnova projekta

Datum: 2026-11-11
Status: dizajn odobren u razgovoru, spec čeka pregled

## Cilj

Mali lokalni portal za promenu pretplate sa sintetičkim podacima, kao osnova za šestonedeljni AI program
("AI kao deo seniorskog frontend rada", odeljak 2). Osnova je namerno mala: migracija, A/B/A scenario,
izgubljen odgovor i CI/hook su zadaci programa i ne ulaze ovde.

Uspeh: `npm ci`, `npm run dev` (port 3000), `npm run test`, `npm run typecheck` i `npm run lint` rade
na Mac-u, a ekran pokazuje trenutni plan, izbor plana, preview iznosa i potvrdu promene.

## Odluke

| Odluka | Izbor | Razlog |
| --- | --- | --- |
| Projekat | Nov, samo lokalni, u `~/Developer/ai-practise` | Korisnik nema postojeći projekat |
| Format preview odgovora | Stari flat format (`planId`, `amountMinor`, `currency`) | Nedelja 1 je migracija na `plan.id` + `dueNow` |
| Pravila projekta | `react.md` postaje `CLAUDE.md` (bez delova "Key Sections Explained" i "See Also") | Zahtev korisnika |
| Global state | Bez Zustand-a u osnovi | Server state ide samo kroz TanStack Query; izbor plana je lokalni state |
| Git | Lokalni repo, `main` + grane `feature/` i `fix/`, lokalno spajanje, bez PR-a | Nema remote-a; nedelja 4 i 5 rade lokalno |
| Mock servis | MSW u browseru (dev) i u Vitest-u (node), zajednički handleri i in-memory stanje | Jedna implementacija mocka, bez dodatnog servera i paketa van react.md |

## Stack

React 19, TypeScript 5 (strict), Vite, TanStack Query, Vitest, React Testing Library, MSW, ESLint
(flat config, typescript-eslint, react-hooks) i Prettier, CSS Modules. Tačne verzije u `package.json`,
`package-lock.json` u repozitorijumu. Novi paketi van ovog spiska traže dogovor.

Skripte (iz react.md): `dev` (port 3000), `build`, `test`, `lint` (ESLint + Prettier check), `lint:fix`,
`typecheck` (`tsc --noEmit`).

## Struktura

```
CLAUDE.md
src/main.tsx                 QueryClientProvider, pokretanje MSW workera u dev-u
src/App.tsx
src/api/types.ts             DTO tipovi (Subscription, PreviewDto u flat formatu, greške)
src/api/client.ts            fetch funkcije; prosleđuju AbortSignal iz TanStack Query-ja
src/api/adapters/preview.ts  toPreview(dto): flat DTO -> Preview model
src/types/                   Preview, Plan i ostali modeli koje koriste komponente
src/utils/formatMoney.ts     Intl.NumberFormat za amountMinor + currency
src/features/plan-change/
  PlanChangePage.tsx         drži izabrani plan (useState)
  CurrentPlan.tsx
  PlanPicker.tsx             radio grupa
  PreviewSummary.tsx         prikaz iznosa, valute i datuma primene
  ConfirmChange.tsx          dugme za potvrdu; šalje quoteId
  useSubscription.ts
  usePreview.ts              queryKey ['preview', subscriptionId, planId]
  useConfirmChange.ts        useMutation, posle uspeha invalidira pretplatu i preview
src/mocks/
  db.ts                      planovi, pretplata sub_1, quote-ovi; resetDb()
  control.ts                 kašnjenje i trajanje quote-a
  handlers.ts
  browser.ts / server.ts
src/test/setup.ts, src/test/helpers.ts
```

Svaka komponenta ima `*.module.css` i `*.test.tsx` pored sebe. Named exports, props interfejs
`{Component}Props`.

## Tok podataka

1. `useSubscription` učitava pretplatu (trenutni plan, `version`).
2. Izabrani plan je lokalni `useState` u `PlanChangePage`. Na početku nije izabran nijedan drugi plan.
3. `usePreview(subscriptionId, planId)` radi samo kada je plan izabran i različit od trenutnog. Query key
   sadrži `subscriptionId` i `planId`; to je postojeća zaštita od zastarelog odgovora.
4. Rezultat prolazi kroz `toPreview` i ima dva korisnika: `PreviewSummary` (prikaz) i `ConfirmChange`
   (šalje `quoteId`). To su dva mesta koja nedelja 1 migrira.
5. Potvrda je dostupna samo kada postoji preview za izabrani plan i `expiresAt` nije prošao.
6. Posle uspešne potvrde UI prikazuje novi plan iz osvežene pretplate, ne iz lokalnog izbora.

## Mock API

Podaci: planovi `basic`, `standard`, `pro` sa cenama u EUR centima; pretplata `sub_1` na `basic`,
`version: 1`.

- `GET /api/subscriptions/:id` vraća `{ subscriptionId, planId, version }`.
- `GET /api/subscriptions/:id/preview?planId=` pravi quote, čuva ga u db i vraća
  `{ subscriptionId, planId, quoteId, amountMinor, currency, effectiveDate, expiresAt }`.
- `POST /api/subscriptions/:id/change` sa `{ quoteId }`: quote mora da postoji, pripada pretplati,
  nije istekao i nije iskorišćen. Uspeh menja plan, povećava `version`, označava quote iskorišćenim i
  vraća pretplatu. Inače `409` sa `{ code: 'QUOTE_INVALID' | 'QUOTE_EXPIRED' }`. Nepoznata pretplata: `404`.

`control.ts`: kašnjenje odgovora (dev 400 ms, testovi 0) i trajanje quote-a (podrazumevano 5 minuta).
Za tačan redosled odgovora testovi koriste `server.use(...)` sa deferred promise-om. Nema UI prekidača
za scenarije. Stanje živi u memoriji i gubi se na reload.

## Greške i pristupačnost

- Pretplata ili preview ne uspe: poruka u `role="alert"` i dugme "Pokušaj ponovo" (refetch).
- `409`: poruka po kodu; preview za izabrani plan se ponovo traži.
- Loading i uspeh: `role="status"`.
- Izbor plana je radio grupa; ceo tok se može proći tastaturom.

## Testovi

- Smoke test za svaku komponentu.
- `toPreview`: flat DTO daje očekivani model.
- `formatMoney`: iznos i valuta.
- Integracioni testovi `PlanChangePage` sa MSW-om:
  - izbor plana prikazuje njegov iznos;
  - potvrda šalje `quoteId` izabranog plana (provera payload-a koji je handler primio) i prikazuje novi plan;
  - istekao quote daje `409` i poruku;
  - A/B redosled: odgovor za B stiže pre A; prikaz i payload potvrde ostaju na B.
- Čekanja u testovima zasnovana na stanju, bez fiksnog sleep-a.

## Okruženje i isporuka

Agent radi u Linux okruženju, korisnik na Mac-u (arm64). `node_modules` iz Linux-a ne radi na Mac-u
(Vite/esbuild imaju binarne delove za platformu). Zato se projekat gradi i proverava u zasebnom
radnom folderu, a u `ai-practise` se upisuju izvorni kod, `package-lock.json`, `public/mockServiceWorker.js`
i `.git` sa početnim commit-om. Korisnik jednom pokreće `npm ci`.

Ako Node verzija na Mac-u nije poznata, `package.json` navodi `engines` prema verziji korišćenoj pri
proveri, a README to navodi.

## Van obima

Migracija na novi format (nedelja 1), A/B/A sa istekom ili promenom konteksta (nedelja 2), intent,
status endpoint i izgubljen odgovor (nedelja 3), CI ili hook (nedelja 5). Takođe: Zustand, router,
autentikacija, pravo naplaćivanje, design system, Playwright, istorija i otkazivanje.
