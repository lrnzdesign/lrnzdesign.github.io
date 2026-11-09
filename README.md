# LRNZ — sito portfolio

Sito statico (HTML, CSS, JavaScript), senza installazioni.

## Stato

- [x] Home
- [x] Works
- [ ] Pagine progetto (tutte e 8 fatte)

## Struttura

```
index.html            Home
works.html            Elenco progetti con anteprima al passaggio del mouse
assets/css/style.css  Stili (colori e misure presi da Figma)
assets/js/main.js     Caroselli, scritta che trema, menu mobile
works/                Pagine dei singoli progetti
images/home/          Foto dei caroselli (carousel-01…12) e ritratto
images/works/         Anteprime della pagina Works (una per progetto, anche .mp4)
images/impresso/      Foto e video della pagina Impresso
images/love-to-do.svg Scritta "I love to do." (è anche dentro index.html)
fonts/                Qui vanno i file del font Ronzino
```

## Font

- **Ronzino** di Nunzio Mazzaferro / Collletttivo, per i testi.
- **Nunito Bold**, per i titoli e il menu mobile.

Sono entrambi gratuiti con licenza SIL Open Font License. I file delle
licenze (`Ronzino-LICENSE.txt`, `Nunito-LICENSE.txt`) sono nella cartella
`fonts/` e devono restare lì. Il credito a Ronzino è nel footer di ogni pagina.

## Modificare la home

- **Foto dei caroselli**: sostituisci i file in `images/home/` mantenendo lo
  stesso nome. Le foto sono state esportate a 1x: per avere immagini nitide
  sugli schermi Retina, esportale da Figma a 2x con lo stesso nome.
- **Velocità dei caroselli**: in `style.css` cerca `--speed` (desktop, 48s) e
  `--speed-mobile` (30s). Più secondi corrispondono a uno scorrimento più lento.
- **Tremolio della scritta**: in `main.js` puoi regolare `MAX_Y` (quanto si
  sposta), `MAX_ROT` (quanto ruota) e `DECAY` (quanto ci mette a calmarsi).
- **Link Instagram e Behance**: in `index.html` cerca `data-social` e
  sostituisci `href="#"` con l'indirizzo vero.

## Vedere il sito sul computer

Apri `index.html` con il browser.

## Pubblicare su Netlify

1. Vai su https://app.netlify.com/drop (serve un account gratuito).
2. Trascina l'intera cartella `portfolio-site` nella pagina.
3. Netlify ti assegna un indirizzo `….netlify.app`. Dalle impostazioni del sito
   puoi cambiarne il nome o collegare un tuo dominio.

Per aggiornare il sito, trascina di nuovo la cartella nella sezione *Deploys*
del sito.
