# Antagelser

## Uafklaret adgang ("?")

Disse tre aktiviteter vises med "Tjek ved indtjekning" og grå markering. Målgruppen er sat til "alle":

| Dag | Tid | Aktivitet | Sted |
|---|---|---|---|
| Tor | 18.30–19.30 | Smag på Magien | Platform K |
| Tor | 19.00–20.00 | Magic & Science (Matt Pritchard, Folkeuniversitetet) | VIA, Campus Horsens |
| Tor | 19.00–20.00 | Det Færøske Trylleshow | Horsens Ny Teater |

## Tider

- **Åbent hus hos Pegani søndag:** kilderne siger enten kl. 15.00 eller 15.30. Kalenderen placerer det fra kl. 15.00 og viser teksten "ca. 15.00/15.30–18.00".
- **Efter midnat:** lounges til kl. 01.00 hører til aftenens festivaldag. Dagen skifter kl. 05.00.
- **Lav din egen tryllestav** torsdag kl. 10–14 står på IllusionsPladsen, selv om pladsen først åbner kl. 12. Tiden er bevaret som angivet.
- **Nedtælling** tæller ned til første punkt (torsdag kl. 08.00, Wonders in the Shadows).
- Appen åbner på dags dato i festivalperioden. Ellers åbner den på den sidst valgte dag eller på torsdag.

## Hele dagen og "kom og gå"

- "Hele dagen" indeholder alle syv punkter fra afsnittet *Hele dagen* i oplægget: Wonders in the Shadows, Poxycat Bio, Mærk Magien, IllusionsPladsen, Close-up i MirakelTeatret og IllusionsVognen, Lav din egen tryllestav og La strada de illusione.
- Disse tidsrum er markeret som "kom og gå" (`aabent`): Indtjekning/Tryllecafé, Indregistrering, Tryllecafé, frokosten lørdag (kan tages med), begge lounges og Åbent hus hos Pegani. De vises som smalle lodrette skinner i kalenderen, når de ligger samtidig med faste shows.
- **Overlap-advarsler** gælder kun faste aktiviteter. "Hele dagen" og "kom og gå" giver ingen advarsel. Middagene er faste, så middagen fredag og En forræder på Hotellet (begge Jørgensens Hotel) giver en advarsel.
- **Gåtid:** advarslen kommer, når der er under 15 minutter mellem to faste aktiviteter på forskellige steder. Der regnes ikke på afstande, men der er en knap til rutevejledning.

## Indhold

- Beskrivelserne er korte og bygger kun på oplægget. Der er ikke opfundet fakta om kunstnerne. Hvad *Poxycat Bio* er, fremgår ikke af oplægget.
- Hustlerhjørnet fredag antages at være med Thomas Christensen som torsdag.
- Hokus Pokus Horsens har målgruppen "børn" (familieshow) og adgangen Billet.
- Transport til Pegani søndag har adgangen Armbånd som angivet. Transportformen kendes ikke.
- Hvilke shows og seminarer der foregår på engelsk, kendes ikke. Det står derfor kun i Info.
- tryl@pegani.dk og 7562 0217 vises som "Arrangørerne (Pegani)".

## Steder og kort

- Adresser bruges kun, hvor oplægget angiver dem (HNT, Pegani, IllusionsPladsen/Søndergade, Café Gran/Grønnegade). Ellers søges der på stedets navn + "Horsens".
- Specielle søgninger: Bytorv → "Bytorvet, Horsens"; VIA → "VIA University College Campus Horsens"; Midtbyen → "Horsens Midtby"; Hovedgård og Gedved Bibliotek → "…, Horsens Kommune" (de ligger uden for byen).
- Fængselsmuseet og Kulturgården står i stedtabellen, men har ingen aktiviteter i programmet.

## Filtre

- Målgruppen "Børn" viser aktiviteter for børn **og** for alle. Det samme gælder "Voksne". Det står også i filterarket.
- Adgangsfilteret har en femte mulighed, "Ikke afklaret", til "?"-punkterne.
- Filtre gælder fanen Program. Mit program viser altid alle stjernemarkerede punkter.

## Teknik

- Kravene `user-scalable=no` og `maximum-scale=1` koster point i Lighthouse Accessibility (93 i stedet for 100). iOS ignorerer `user-scalable=no`, så knibe-zoom blokeres også med JavaScript.
- Lighthouse 12+ har ingen PWA-kategori. PWA er målt med Lighthouse 11.7.1.
- Topbjælken er mørk i begge tilstande, fordi iPhone-statusbjælken er sort med hvid tekst (`black`). `black-translucent` gav en død stribe i bunden på nyere iPhones.
- Kalenderfilen (.ics) bruger tidszonen Europe/Copenhagen og har en påmindelse 15 minutter før. På iPhone hentes filen først, og så trykker man på den for at føje den til Kalender.
- Når der er net, tjekkes programdata i baggrunden, og der vises en besked, hvis `data.js` er ændret. App-filerne opdateres, når `VERSION` i `sw.js` hæves.
