// ILLUSIONS 2026 – al programdata.
//
// Alt mellem DATA_START og DATA_SLUT er ren JSON (dobbelte anførselstegn, ingen
// kommentarer, intet komma efter sidste element). Ret programmet her uden at
// røre UI-koden. Kør `node --test` for at tjekke, at filen stadig er gyldig.
//
// Felter pr. aktivitet:
//   id          unik og stabil (bruges til stjernemarkeringer – omdøb ikke)
//   dag         "tor" | "fre" | "lor" | "son"  (se "dage")
//   start/slut  "HH:MM" lokal tid (Europe/Copenhagen). Slut før start = efter midnat.
//   titel, artist
//   sted        nøgle i "steder"; lokale = valgfrit rum (fx "Sal 3")
//   adgang      "A" Armbånd | "G" Gratis | "B" Billet | "+" Ekstra billet | "?" Ikke afklaret
//   maalgruppe  "alle" | "børn" | "voksne"
//   beskrivelse, noter
//   heleDagen   true = vises i "Hele dagen" øverst i kalenderen (valgfri)
//   aabent      true = "kom og gå"-tidsrum; giver ikke overlap-advarsler (valgfri)
//   visTid      tekst der erstatter det viste tidspunkt (valgfri)
export default /* DATA_START */ {
  "meta": {
    "navn": "ILLUSIONS 2026",
    "by": "Horsens",
    "tidszone": "Europe/Copenhagen",
    "programVersion": "2026-10-15",
    "forbehold": "Forbehold for ændringer. Visse shows og seminarer er på engelsk."
  },
  "dage": [
    { "id": "tor", "dato": "2026-10-15", "kort": "TOR", "navn": "Torsdag" },
    { "id": "fre", "dato": "2026-10-16", "kort": "FRE", "navn": "Fredag" },
    { "id": "lor", "dato": "2026-10-17", "kort": "LØR", "navn": "Lørdag" },
    { "id": "son", "dato": "2026-10-18", "kort": "SØN", "navn": "Søndag" }
  ],
  "adgang": {
    "A": { "navn": "Armbånd", "kort": "INSIDE-adgang med armbånd: shows, seminarer, mad og lounge." },
    "G": { "navn": "Gratis", "kort": "Gratis og åbent for alle." },
    "B": { "navn": "Billet", "kort": "Kræver offentlig billet." },
    "+": { "navn": "Ekstra billet", "kort": "Kræver særlig billet. Ikke en del af INSIDE." },
    "?": { "navn": "Ikke afklaret", "kort": "Adgang er ikke afklaret. Tjek ved indtjekning." }
  },
  "steder": {
    "hnt": { "navn": "Horsens Ny Teater", "kort": "HNT", "adresse": "Teatertorvet, 8700 Horsens" },
    "pegani": { "navn": "Pegani (tryllebutik)", "kort": "Pegani", "adresse": "Østerhåbsvej 85A, 8700 Horsens", "soeg": "Pegani" },
    "illusionspladsen": { "navn": "IllusionsPladsen", "kort": "IllusionsPladsen", "adresse": "Søndergade, 8700 Horsens", "note": "Midt på Søndergade, i teltet." },
    "bytorv": { "navn": "Bytorv Horsens", "kort": "Bytorv", "soeg": "Bytorvet" },
    "kuben": { "navn": "Kuben", "kort": "Kuben" },
    "via": { "navn": "VIA University College, Campus Horsens", "kort": "VIA", "note": "Ved banegården.", "soeg": "VIA University College Campus Horsens" },
    "jorgensens": { "navn": "Jørgensens Hotel", "kort": "Jørgensens Hotel" },
    "gran": { "navn": "Gran Social / Café Gran", "kort": "Café Gran", "adresse": "Grønnegade, 8700 Horsens", "soeg": "Café Gran" },
    "faengslet": { "navn": "Fængselsmuseet (Fængslet)", "kort": "Fængslet", "soeg": "Fængslet" },
    "kulturgaarden": { "navn": "Kulturgården", "kort": "Kulturgården" },
    "platformk": { "navn": "Platform K", "kort": "Platform K" },
    "midtbyen": { "navn": "Midtbyen", "kort": "Midtbyen", "note": "Gadeteater rundt i midtbyen.", "soeg": "Horsens Midtby" },
    "hovedgaard": { "navn": "Hovedgård Bibliotek", "kort": "Hovedgård Bibl.", "note": "Uden for centrum.", "maps": "Hovedgård Bibliotek, Hovedgård, Horsens Kommune" },
    "gedved": { "navn": "Gedved Bibliotek", "kort": "Gedved Bibl.", "note": "Uden for centrum.", "maps": "Gedved Bibliotek, Gedved, Horsens Kommune" }
  },
  "aktiviteter": [
    { "id": "tor-wonders", "dag": "tor", "start": "08:00", "slut": "17:00", "titel": "Wonders in the Shadows", "artist": "Mattia \"Flip\" Bidoli", "sted": "via", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Fotoudstilling af Mattia \"Flip\" Bidoli.", "noter": "", "heleDagen": true },
    { "id": "tor-poxycat", "dag": "tor", "start": "10:00", "slut": "18:00", "titel": "Poxycat Bio", "artist": "", "sted": "bytorv", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Poxycat Bio på Bytorv. Kig forbi i åbningstiden.", "noter": "", "heleDagen": true },
    { "id": "tor-maerk", "dag": "tor", "start": "11:00", "slut": "17:00", "titel": "Mærk Magien", "artist": "", "sted": "bytorv", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Prøv illusionerne selv, og tag fotos.", "noter": "", "heleDagen": true },
    { "id": "tor-pladsen", "dag": "tor", "start": "12:00", "slut": "16:00", "titel": "IllusionsPladsen er åben", "artist": "", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Telt med scene, kaffevogn, pop-up Pegani, åbent tryllebord og infovogn.", "noter": "", "heleDagen": true },
    { "id": "tor-closeup", "dag": "tor", "start": "12:00", "slut": "16:00", "titel": "Close-up i MirakelTeatret og IllusionsVognen", "artist": "", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Close-up-magi tæt på i MirakelTeatret og IllusionsVognen.", "noter": "", "heleDagen": true },
    { "id": "tor-tryllestav", "dag": "tor", "start": "10:00", "slut": "14:00", "titel": "Lav din egen tryllestav", "artist": "", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "børn", "beskrivelse": "Værksted for børn: lav din egen tryllestav.", "noter": "", "heleDagen": true },

    { "id": "tor-store-hovedgaard", "dag": "tor", "start": "11:00", "slut": "11:45", "titel": "Den Store Tryllekunstner", "artist": "", "sted": "hovedgaard", "adgang": "G", "maalgruppe": "børn", "beskrivelse": "Trylleshow for børn på biblioteket.", "noter": "Ligger uden for centrum." },
    { "id": "tor-trylleskolen", "dag": "tor", "start": "11:00", "slut": "12:00", "titel": "Trylleskolen", "artist": "", "sted": "kuben", "adgang": "B", "maalgruppe": "børn", "beskrivelse": "Tryllekursus for børn.", "noter": "For børn 8–14 år. Kræver billet." },
    { "id": "tor-barti", "dag": "tor", "start": "12:00", "slut": "12:20", "titel": "Mr. Barti", "artist": "Mr. Barti", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gratis show på scenen på IllusionsPladsen.", "noter": "" },
    { "id": "tor-flip-bytorv", "dag": "tor", "start": "12:30", "slut": "13:00", "titel": "Flip", "artist": "Mattia \"Flip\" Bidoli", "sted": "bytorv", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gratis show med Flip.", "noter": "" },
    { "id": "tor-store-gedved", "dag": "tor", "start": "14:00", "slut": "14:45", "titel": "Den Store Tryllekunstner", "artist": "", "sted": "gedved", "adgang": "G", "maalgruppe": "børn", "beskrivelse": "Trylleshow for børn på biblioteket.", "noter": "Ligger uden for centrum." },
    { "id": "tor-indtjekning", "dag": "tor", "start": "14:00", "slut": "18:00", "titel": "Indtjekning og Tryllecafé", "artist": "", "sted": "hnt", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Hent dit armbånd samt det offentlige og det interne program. Tryllecaféen har åbent samtidig.", "noter": "Medbring billet på print eller telefon. Hent også billet til En forræder på Hotellet, hvis du har en.", "aabent": true },
    { "id": "tor-flip-kuben", "dag": "tor", "start": "14:30", "slut": "15:00", "titel": "Flip", "artist": "Mattia \"Flip\" Bidoli", "sted": "kuben", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gratis show med Flip.", "noter": "" },
    { "id": "tor-anders", "dag": "tor", "start": "15:00", "slut": "15:20", "titel": "Anders Andresen", "artist": "Anders Andresen", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gratis show på scenen på IllusionsPladsen.", "noter": "" },
    { "id": "tor-rogvi", "dag": "tor", "start": "15:30", "slut": "16:00", "titel": "Rógvi", "artist": "Rógvi", "sted": "bytorv", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gratis show på Bytorv.", "noter": "" },
    { "id": "tor-hokus", "dag": "tor", "start": "15:30", "slut": "16:30", "titel": "Hokus Pokus Horsens", "artist": "", "sted": "hnt", "adgang": "B", "maalgruppe": "børn", "beskrivelse": "Familieshow for børn og voksne.", "noter": "Kræver offentlig billet." },
    { "id": "tor-hustler", "dag": "tor", "start": "16:00", "slut": "17:00", "titel": "Hustlerhjørnet", "artist": "Thomas Christensen", "sted": "kuben", "adgang": "G", "maalgruppe": "voksne", "beskrivelse": "Hustlerhjørnet med Thomas Christensen.", "noter": "" },
    { "id": "tor-smag", "dag": "tor", "start": "18:30", "slut": "19:30", "titel": "Smag på Magien", "artist": "", "sted": "platformk", "adgang": "?", "maalgruppe": "alle", "beskrivelse": "Smag på Magien på Platform K.", "noter": "Adgang er ikke afklaret. Spørg ved indtjekning." },
    { "id": "tor-magic-science", "dag": "tor", "start": "19:00", "slut": "20:00", "titel": "Magic & Science", "artist": "Matt Pritchard", "sted": "via", "lokale": "Folkeuniversitetet", "adgang": "?", "maalgruppe": "alle", "beskrivelse": "Magi og videnskab med Matt Pritchard, arrangeret af Folkeuniversitetet.", "noter": "Adgang er ikke afklaret. Spørg ved indtjekning." },
    { "id": "tor-faeroske", "dag": "tor", "start": "19:00", "slut": "20:00", "titel": "Det Færøske Trylleshow", "artist": "", "sted": "hnt", "adgang": "?", "maalgruppe": "alle", "beskrivelse": "Det Færøske Trylleshow på Horsens Ny Teater.", "noter": "Adgang er ikke afklaret. Spørg ved indtjekning." },

    { "id": "fre-wonders", "dag": "fre", "start": "08:00", "slut": "17:00", "titel": "Wonders in the Shadows", "artist": "Mattia \"Flip\" Bidoli", "sted": "via", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Fotoudstilling af Mattia \"Flip\" Bidoli.", "noter": "", "heleDagen": true },
    { "id": "fre-poxycat", "dag": "fre", "start": "10:00", "slut": "19:00", "titel": "Poxycat Bio", "artist": "", "sted": "bytorv", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Poxycat Bio på Bytorv. Kig forbi i åbningstiden.", "noter": "", "heleDagen": true },
    { "id": "fre-maerk", "dag": "fre", "start": "11:00", "slut": "17:00", "titel": "Mærk Magien", "artist": "", "sted": "bytorv", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Prøv illusionerne selv, og tag fotos.", "noter": "", "heleDagen": true },
    { "id": "fre-pladsen", "dag": "fre", "start": "12:00", "slut": "16:00", "titel": "IllusionsPladsen er åben", "artist": "", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Telt med scene, kaffevogn, pop-up Pegani, åbent tryllebord og infovogn.", "noter": "", "heleDagen": true },
    { "id": "fre-closeup", "dag": "fre", "start": "12:00", "slut": "16:00", "titel": "Close-up i MirakelTeatret og IllusionsVognen", "artist": "", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Close-up-magi tæt på i MirakelTeatret og IllusionsVognen.", "noter": "", "heleDagen": true },
    { "id": "fre-lastrada", "dag": "fre", "start": "14:00", "slut": "16:00", "titel": "La strada de illusione", "artist": "Komediehuset", "sted": "midtbyen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gadeteater med Komediehuset rundt i midtbyen.", "noter": "", "heleDagen": true },

    { "id": "fre-trylleskolen", "dag": "fre", "start": "11:00", "slut": "12:00", "titel": "Trylleskolen", "artist": "", "sted": "kuben", "adgang": "B", "maalgruppe": "børn", "beskrivelse": "Tryllekursus for børn.", "noter": "For børn 8–14 år. Kræver billet." },
    { "id": "fre-jesper-bytorv", "dag": "fre", "start": "12:00", "slut": "12:20", "titel": "Jesper Grønkjær", "artist": "Jesper Grønkjær", "sted": "bytorv", "adgang": "G", "maalgruppe": "børn", "beskrivelse": "Gratis show for børn.", "noter": "" },
    { "id": "fre-indregistrering", "dag": "fre", "start": "12:30", "slut": "17:00", "titel": "Indregistrering", "artist": "", "sted": "hnt", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Indtjekning for INSIDE. Armbånd samt det offentlige og det interne program udleveres.", "noter": "Medbring billet på print eller telefon.", "aabent": true },
    { "id": "fre-tryllecafe", "dag": "fre", "start": "13:00", "slut": "17:00", "titel": "Tryllecafé", "artist": "", "sted": "hnt", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Tryllecaféen på Horsens Ny Teater.", "noter": "", "aabent": true },
    { "id": "fre-hector-1300", "dag": "fre", "start": "13:00", "slut": "13:45", "titel": "Hector Mancha (tidlig forestilling)", "artist": "Hector Mancha", "sted": "hnt", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Tidlig forestilling med Hector Mancha.", "noter": "Kun et begrænset antal INSIDE-deltagere kommer ind på armbåndet. Kom i god tid." },
    { "id": "fre-andreas-pladsen", "dag": "fre", "start": "13:00", "slut": "13:30", "titel": "Andreas Brunsborg", "artist": "Andreas Brunsborg", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gratis show på scenen på IllusionsPladsen.", "noter": "" },
    { "id": "fre-jesper-kuben", "dag": "fre", "start": "14:00", "slut": "14:20", "titel": "Jesper Grønkjær", "artist": "Jesper Grønkjær", "sted": "kuben", "adgang": "G", "maalgruppe": "børn", "beskrivelse": "Gratis show for børn.", "noter": "" },
    { "id": "fre-workshop-matt", "dag": "fre", "start": "14:00", "slut": "15:00", "titel": "Workshop med Matt Pritchard", "artist": "Matt Pritchard", "sted": "hnt", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Workshop med Matt Pritchard.", "noter": "" },
    { "id": "fre-andreas-bytorv", "dag": "fre", "start": "15:00", "slut": "15:30", "titel": "Andreas Brunsborg", "artist": "Andreas Brunsborg", "sted": "bytorv", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gratis show på Bytorv.", "noter": "" },
    { "id": "fre-hector-1500", "dag": "fre", "start": "15:00", "slut": "15:45", "titel": "Hector Mancha", "artist": "Hector Mancha", "sted": "hnt", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Forestilling med Hector Mancha.", "noter": "" },
    { "id": "fre-fyraftenstryl", "dag": "fre", "start": "15:30", "slut": "17:30", "titel": "Fyraftenstryl med R. Paul Wilson", "artist": "R. Paul Wilson", "sted": "gran", "adgang": "G", "maalgruppe": "voksne", "beskrivelse": "Fyraftenstryl med R. Paul Wilson på Gran Social.", "noter": "" },
    { "id": "fre-hustler", "dag": "fre", "start": "16:00", "slut": "17:00", "titel": "Hustlerhjørnet", "artist": "Thomas Christensen", "sted": "kuben", "adgang": "G", "maalgruppe": "voksne", "beskrivelse": "Hustlerhjørnet med Thomas Christensen.", "noter": "" },
    { "id": "fre-jesper-pladsen", "dag": "fre", "start": "16:00", "slut": "16:20", "titel": "Jesper Grønkjær", "artist": "Jesper Grønkjær", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "børn", "beskrivelse": "Gratis show for børn på IllusionsPladsen.", "noter": "" },
    { "id": "fre-middag", "dag": "fre", "start": "18:00", "slut": "20:00", "titel": "Middag og indslag", "artist": "", "sted": "jorgensens", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Dampet langefilet med spæde grøntsager, surdejsbrød og tilbehør. Se hele menuen under Info.", "noter": "Ét glas vin, øl eller vand er inkluderet. Skriv til arrangørerne om allergier." },
    { "id": "fre-forraeder", "dag": "fre", "start": "19:30", "slut": "20:30", "titel": "En forræder på Hotellet", "artist": "Kim Oechsle", "sted": "jorgensens", "adgang": "+", "maalgruppe": "voksne", "beskrivelse": "En forræder på Hotellet med Kim Oechsle.", "noter": "Ikke en del af INSIDE. Begrænset antal. Hent billet ved indtjekning." },
    { "id": "fre-black-magic", "dag": "fre", "start": "20:15", "slut": "20:35", "titel": "Black Magic", "artist": "Kalle Nio og Luis Sartori do Vale", "sted": "hnt", "adgang": "A", "maalgruppe": "voksne", "beskrivelse": "Black Magic med Kalle Nio og Luis Sartori do Vale.", "noter": "Overlapper En forræder på Hotellet. Alternativ: lørdag kl. 10.30 eller 12.00." },
    { "id": "fre-alexandra", "dag": "fre", "start": "21:00", "slut": "22:00", "titel": "Alexandra Duvivier", "artist": "Alexandra Duvivier", "sted": "hnt", "adgang": "A", "maalgruppe": "voksne", "beskrivelse": "Forestilling med Alexandra Duvivier.", "noter": "" },
    { "id": "fre-lounge", "dag": "fre", "start": "22:00", "slut": "01:00", "titel": "iLLUS!ONS Lounge", "artist": "", "sted": "hnt", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Lounge for INSIDE-deltagere.", "noter": "", "aabent": true },
    { "id": "fre-late-night", "dag": "fre", "start": "23:00", "slut": "23:30", "titel": "Late-Night Show", "artist": "", "sted": "hnt", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Late-Night Show på Horsens Ny Teater.", "noter": "" },

    { "id": "lor-wonders", "dag": "lor", "start": "10:00", "slut": "14:00", "titel": "Wonders in the Shadows", "artist": "Mattia \"Flip\" Bidoli", "sted": "via", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Fotoudstilling af Mattia \"Flip\" Bidoli.", "noter": "", "heleDagen": true },
    { "id": "lor-poxycat", "dag": "lor", "start": "10:00", "slut": "16:00", "titel": "Poxycat Bio", "artist": "", "sted": "bytorv", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Poxycat Bio på Bytorv. Kig forbi i åbningstiden.", "noter": "", "heleDagen": true },
    { "id": "lor-maerk", "dag": "lor", "start": "10:00", "slut": "14:00", "titel": "Mærk Magien", "artist": "", "sted": "bytorv", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Prøv illusionerne selv, og tag fotos.", "noter": "", "heleDagen": true },
    { "id": "lor-pladsen", "dag": "lor", "start": "10:00", "slut": "14:00", "titel": "IllusionsPladsen er åben", "artist": "", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Telt med scene, kaffevogn, pop-up Pegani, åbent tryllebord og infovogn.", "noter": "", "heleDagen": true },
    { "id": "lor-closeup", "dag": "lor", "start": "11:00", "slut": "13:00", "titel": "Close-up i MirakelTeatret og IllusionsVognen", "artist": "", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Close-up-magi tæt på i MirakelTeatret og IllusionsVognen.", "noter": "", "heleDagen": true },
    { "id": "lor-lastrada", "dag": "lor", "start": "11:00", "slut": "14:00", "titel": "La strada de illusione", "artist": "Komediehuset", "sted": "midtbyen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gadeteater med Komediehuset rundt i midtbyen.", "noter": "", "heleDagen": true },

    { "id": "lor-black-magic-1030", "dag": "lor", "start": "10:30", "slut": "10:50", "titel": "Black Magic", "artist": "Kalle Nio og Luis Sartori do Vale", "sted": "hnt", "adgang": "A", "maalgruppe": "voksne", "beskrivelse": "Black Magic med Kalle Nio og Luis Sartori do Vale.", "noter": "Alternativ til fredagens forestilling kl. 20.15." },
    { "id": "lor-flip-pladsen", "dag": "lor", "start": "10:30", "slut": "11:00", "titel": "Flip", "artist": "Mattia \"Flip\" Bidoli", "sted": "illusionspladsen", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gratis show med Flip.", "noter": "" },
    { "id": "lor-talentholdet", "dag": "lor", "start": "11:00", "slut": "11:40", "titel": "Talentholdet", "artist": "", "sted": "kuben", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Talentholdet optræder.", "noter": "" },
    { "id": "lor-rogvi", "dag": "lor", "start": "11:30", "slut": "12:00", "titel": "Rógvi", "artist": "Rógvi", "sted": "bytorv", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gratis show på Bytorv.", "noter": "" },
    { "id": "lor-black-magic-1200", "dag": "lor", "start": "12:00", "slut": "12:20", "titel": "Black Magic", "artist": "Kalle Nio og Luis Sartori do Vale", "sted": "hnt", "lokale": "Sal 3", "adgang": "A", "maalgruppe": "voksne", "beskrivelse": "Black Magic med Kalle Nio og Luis Sartori do Vale.", "noter": "Alternativ til fredagens forestilling kl. 20.15." },
    { "id": "lor-tryllestafetten", "dag": "lor", "start": "12:00", "slut": "12:40", "titel": "Tryllestafetten", "artist": "", "sted": "kuben", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Tryllestafetten i Kuben.", "noter": "" },
    { "id": "lor-frokost", "dag": "lor", "start": "12:00", "slut": "13:15", "titel": "Frokost", "artist": "", "sted": "hnt", "lokale": "Foyer", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Lunchpose med sandwich og vand. Kan tages med.", "noter": "Skriv til arrangørerne om allergier.", "aabent": true },
    { "id": "lor-flip-kuben", "dag": "lor", "start": "13:00", "slut": "13:30", "titel": "Flip", "artist": "Mattia \"Flip\" Bidoli", "sted": "kuben", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gratis show med Flip.", "noter": "" },
    { "id": "lor-anders", "dag": "lor", "start": "13:30", "slut": "14:00", "titel": "Anders Andresen", "artist": "Anders Andresen", "sted": "bytorv", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Gratis show på Bytorv.", "noter": "" },
    { "id": "lor-seminar1", "dag": "lor", "start": "13:30", "slut": "14:45", "titel": "Seminar 1: Alexandra Duvivier", "artist": "Alexandra Duvivier", "sted": "hnt", "adgang": "A", "maalgruppe": "voksne", "beskrivelse": "Seminar med Alexandra Duvivier.", "noter": "" },
    { "id": "lor-seminar2", "dag": "lor", "start": "15:45", "slut": "17:00", "titel": "Seminar 2: R. Paul Wilson", "artist": "R. Paul Wilson", "sted": "hnt", "adgang": "A", "maalgruppe": "voksne", "beskrivelse": "Seminar med R. Paul Wilson.", "noter": "" },
    { "id": "lor-middag", "dag": "lor", "start": "18:00", "slut": "19:30", "titel": "Middag", "artist": "", "sted": "jorgensens", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Vælg mellem koldrøget laks eller farseret kyllingebryst. Se hele menuen under Info.", "noter": "Ét glas vin, øl eller vand er inkluderet. Skriv til arrangørerne om allergier." },
    { "id": "lor-gallashow", "dag": "lor", "start": "20:00", "slut": "21:30", "titel": "iLLUS!ONS Gallashow", "artist": "", "sted": "hnt", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Festivalens gallashow.", "noter": "" },
    { "id": "lor-lounge", "dag": "lor", "start": "21:30", "slut": "01:00", "titel": "iLLUS!ONS Lounge", "artist": "", "sted": "hnt", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Lounge for INSIDE-deltagere.", "noter": "", "aabent": true },

    { "id": "son-seminar3", "dag": "son", "start": "10:00", "slut": "11:00", "titel": "Seminar 3: Kalle Nio", "artist": "Kalle Nio", "sted": "hnt", "adgang": "A", "maalgruppe": "voksne", "beskrivelse": "Seminar med Kalle Nio.", "noter": "" },
    { "id": "son-talk-flip", "dag": "son", "start": "11:30", "slut": "12:30", "titel": "Talk med Flip", "artist": "Mattia \"Flip\" Bidoli", "sted": "hnt", "lokale": "Teatersalen", "adgang": "A", "maalgruppe": "voksne", "beskrivelse": "Samtale med Flip.", "noter": "" },
    { "id": "son-frokost", "dag": "son", "start": "12:30", "slut": "13:30", "titel": "Frokostbuffet", "artist": "", "sted": "hnt", "lokale": "Kvium Salen", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Frokostbuffet med lun tærte, salater, kartofler og surdejsbrød. Se hele menuen under Info.", "noter": "Skriv til arrangørerne om allergier." },
    { "id": "son-seminar4", "dag": "son", "start": "13:30", "slut": "14:30", "titel": "Seminar 4: Matt Pritchard", "artist": "Matt Pritchard", "sted": "hnt", "adgang": "A", "maalgruppe": "voksne", "beskrivelse": "Seminar med Matt Pritchard.", "noter": "" },
    { "id": "son-transport", "dag": "son", "start": "14:45", "slut": "15:00", "titel": "Transport til Pegani", "artist": "", "sted": "hnt", "adgang": "A", "maalgruppe": "alle", "beskrivelse": "Transport fra Horsens Ny Teater til Pegani på Østerhåbsvej 85A.", "noter": "Afgang fra Horsens Ny Teater." },
    { "id": "son-aabent-hus", "dag": "son", "start": "15:00", "slut": "18:00", "titel": "Åbent hus og tryllebutik", "artist": "", "sted": "pegani", "adgang": "G", "maalgruppe": "alle", "beskrivelse": "Åbent hus i Peganis tryllebutik.", "noter": "Kilderne er uenige om, hvorvidt der åbnes kl. 15.00 eller 15.30.", "aabent": true, "visTid": "ca. 15.00/15.30–18.00" },
    { "id": "son-seminar5", "dag": "son", "start": "16:00", "slut": "17:00", "titel": "Seminar 5: Hector Mancha", "artist": "Hector Mancha", "sted": "pegani", "adgang": "A", "maalgruppe": "voksne", "beskrivelse": "Seminar med Hector Mancha hos Pegani.", "noter": "" }
  ],
  "menuer": [
    {
      "titel": "Fredag aften",
      "aktivitet": "fre-middag",
      "retter": [
        "Dampet langefilet med spæde grøntsager (gulerødder, fennikel, persillerod)",
        "Stegt grønkål",
        "Hjemmebagt surdejsbrød med pisket smør",
        "Salat med syltede rødløg og kerner",
        "Kartofler med gremolata",
        "Hvidvins-/fiskesauce"
      ]
    },
    {
      "titel": "Lørdag frokost",
      "aktivitet": "lor-frokost",
      "retter": ["Lunchpose med sandwich og vand – kan tages med"]
    },
    {
      "titel": "Lørdag aften",
      "aktivitet": "lor-middag",
      "intro": "Vælg mellem:",
      "retter": [
        "Koldrøget laks med agurkesalsa, puffet boghvede, rygeostcreme og urter",
        "Farseret kyllingebryst med grov mos, coq au blanc-sauce, gulerødder, perleløg, champignon og gremolata"
      ]
    },
    {
      "titel": "Søndag frokostbuffet",
      "aktivitet": "son-frokost",
      "retter": [
        "Lun tærte med laks og spinat",
        "Stracciatellacreme med rødbede",
        "Lyonnaisesalat",
        "Cæsarsalat med kylling",
        "Ristede Skovkilde-kartofler med aioli",
        "Surdejsbrød og pesto"
      ]
    }
  ],
  "madNoter": [
    "Aftenmåltiderne inkluderer ét glas vin, øl eller vand.",
    "Allergier eller andre hensyn? Skriv til arrangørerne på tryl@pegani.dk."
  ],
  "info": [
    {
      "id": "indtjekning",
      "titel": "Indtjekning og armbånd",
      "punkter": [
        "Indtjekning foregår på Horsens Ny Teater: torsdag kl. 14.00–18.00 og fredag kl. 12.30–17.00.",
        "Medbring din billet på print eller telefon.",
        "Du får armbånd samt det offentlige og det interne program.",
        "Armbåndet giver adgang til INSIDE-shows, seminarer og måltider fra fredag eftermiddag til søndag.",
        "Tryllecaféen på Horsens Ny Teater har samme åbningstid som indtjekningen.",
        "Hector Mancha fredag kl. 13.00: kun et begrænset antal INSIDE-deltagere kommer ind på armbåndet.",
        "En forræder på Hotellet er ikke en del af INSIDE. Billetten hentes ved indtjekning (begrænset antal)."
      ]
    },
    {
      "id": "butik",
      "titel": "Tryllebutik og Pegani",
      "punkter": [
        "Tryllebutikken på Østerhåbsvej 85A er lukket torsdag og fredag.",
        "Pop-up Pegani i teltet på IllusionsPladsen.",
        "Åbent hus i butikken søndag eftermiddag, ca. kl. 15.00–18.00.",
        "Onlinebestilling med afhentning skal være lagt inden fredag kl. 14.00."
      ]
    },
    {
      "id": "kaffe",
      "titel": "Kaffe og tryllebord",
      "punkter": [
        "Gratis kaffe på Café Gran i Grønnegade ved et måltid torsdag og fredag.",
        "Åbent tryllebord i teltet på IllusionsPladsen til dine egne close-up-tryllerier."
      ]
    },
    {
      "id": "del",
      "titel": "Del magien",
      "punkter": [
        "Brug #illusionshorsens og #illusions2026 på Facebook og Instagram."
      ]
    }
  ],
  "kontakt": [
    { "navn": "Arrangørerne (Pegani)", "email": "tryl@pegani.dk", "tlf": "7562 0217" },
    { "navn": "Horsens Ny Teater", "tlf": "7560 2344" }
  ]
} /* DATA_SLUT */;
