# ILLUSIONS 2026 – festivalapp

**Live:** https://illusionsapp.vercel.app

Installérbar PWA med programmet for ILLUSIONS 2026 i Horsens (torsdag 15. til søndag 18. oktober 2026). Ren HTML, CSS og JavaScript (ES-moduler) uden build-trin og uden backend. Appen virker offline efter første besøg.

**Funktioner:** kalender og liste pr. dag, "Hele dagen", mit program med overlap- og gåtidsadvarsler, nu og næste, filtre og søgning, detaljer i et bundark (Google Maps, rute, .ics, del), praktisk info og menuer, lys og mørk tilstand.

## Filer

| Fil | Indhold |
|---|---|
| `data.js` | Al programdata som ren JSON (aktiviteter, steder, menuer, info) |
| `index.html`, `css/app.css` | App-skal og design |
| `js/app.js` | Skærme og interaktion |
| `js/layout.js` | Overlap, kalenderlayout, konflikter, stramme skift |
| `js/time.js`, `js/ics.js`, `js/sheet.js`, `js/icons.js` | Tid (Europe/Copenhagen), kalenderfil, bundark, SVG-ikoner |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA: offline-cache, manifest, ikoner |
| `vercel.json` | Headers til Vercel (service worker, manifest) |
| `tests/` | Enhedstests og browsertest |
| `ANTAGELSER.md` | Antagelser og uafklarede punkter |

## Kør lokalt

```bash
npx serve .            # eller: python3 -m http.server 8080
```

Åbn `http://localhost:3000` (eller `:8080`). Service workeren kræver `localhost` eller https.

**Test et bestemt tidspunkt:** tilføj `?nu=2026-10-16T20:20` til adressen. Så opfører "nu"-linjen, "Nu og næste" og valg af dag sig, som om klokken var fredag kl. 20.20.

## Ret programmet

1. Ret i `data.js` (kun mellem `DATA_START` og `DATA_SLUT`, ren JSON). Feltbeskrivelse står øverst i filen.
2. Hæv `VERSION` i `sw.js`, så installerede apps henter den nye version. (Programdata tjekkes også i baggrunden, og brugeren får besked "Programmet er opdateret".)
3. Kør testene:

```bash
node --test tests/*.test.mjs                 # logik og datavalidering
npx http-server -p 8080 -c-1 &               # lokal server
node tests/e2e.mjs http://localhost:8080     # browsertest i Chromium (Playwright)
```

## Deploy til Vercel

Projektet er koblet til GitHub-repoet. Hvert push til `main` deployer automatisk til produktion.

Manuelt fra bunden: Vercel → *Add New Project* → importér repoet → Framework Preset *Other*, intet build-kommando, output = roden → *Deploy*.

## Installér på telefonen

- **iPhone (Safari):** åbn adressen → tryk på Del-ikonet → *Føj til hjemmeskærm* → *Tilføj*.
- **Android (Chrome):** åbn adressen → tryk *Installér* i bunden, eller menuen (⋮) → *Installér app* / *Føj til startskærm*.

Åbn appen én gang med net, så ligger hele programmet på telefonen (test med flytilstand).

## Kvalitet

- Lighthouse 11.7.1 (mobil): PWA 100, Best Practices 100, Accessibility 93, Performance 96. Lighthouse 12+ har ikke længere en PWA-kategori.
- Accessibility trækkes kun ned af `user-scalable=no` i viewport, som kravspecifikationen kræver. Fjernes det, er der ingen fund.
- axe-core: ingen fund i mørk eller lys tilstand på kalender, liste, detaljer, filtre, mit program, nu og info (bortset fra viewport).
- Browsertest: ingen sidescroll på 360 px, siden scroller ikke, kun indholdet. Touch-mål på mindst 44 px, offline-genindlæsning virker.
