'use strict';
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, PageBreak, ShadingType,
  VerticalAlign, BorderStyle, ImageRun
} = require('/tmp/rad/node_modules/docx');

const OUT = '/tmp/rad/dokumentacija_motocikli.docx';
const SLIKE = '/tmp/slike';

// Pixel helpers: 1 cm ≈ 37.8 px at 96 DPI
function px(cm) { return Math.round(cm * 37.8); }

function imgParagraph(filename, wCm, hCm, caption) {
  const data = fs.readFileSync(`${SLIKE}/${filename}`);
  const items = [
    new Paragraph({
      children: [new ImageRun({ data, transformation: { width: px(wCm), height: px(hCm) }, type: 'png' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 }
    })
  ];
  if (caption) {
    items.push(new Paragraph({
      children: [new TextRun({ text: caption, italics: true, size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }));
  }
  return items;
}

// --- helpers ---
function h1(t) {
  return new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 160 } });
}
function h2(t) {
  return new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 } });
}
function p(t, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: t, size: 22, ...opts })],
    spacing: { after: 140 },
    alignment: AlignmentType.JUSTIFIED
  });
}
function pb() {
  return new Paragraph({ children: [new PageBreak()] });
}
function tbl(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4 },
      bottom: { style: BorderStyle.SINGLE, size: 4 },
      left: { style: BorderStyle.SINGLE, size: 4 },
      right: { style: BorderStyle.SINGLE, size: 4 },
      insideH: { style: BorderStyle.SINGLE, size: 2 },
      insideV: { style: BorderStyle.SINGLE, size: 2 },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          width: { size: widths[i], type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: '1F5C99' },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })],
            alignment: AlignmentType.CENTER
          })]
        }))
      }),
      ...rows.map(row => new TableRow({
        children: row.map((v, i) => new TableCell({
          width: { size: widths[i], type: WidthType.DXA },
          children: [new Paragraph({
            children: [new TextRun({ text: String(v), size: 18 })],
            alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER
          })]
        }))
      }))
    ]
  });
}
function capTbl(t) {
  return new Paragraph({
    children: [new TextRun({ text: t, italics: true, size: 20 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 220 }
  });
}

// =====================================================================
const children = [

  // NASLOV
  new Paragraph({ children: [new TextRun({ text: '', size: 22 })], spacing: { after: 600 } }),
  new Paragraph({ children: [new TextRun({ text: 'UNIVERZITET U MOSTARU', bold: true, size: 28 })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
  new Paragraph({ children: [new TextRun({ text: 'Fakultet informacijskih tehnologija', size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
  new Paragraph({ children: [new TextRun({ text: 'Odsjek za informacijske tehnologije', size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 600 } }),
  new Paragraph({ children: [new TextRun({ text: 'SEMINARSKI RAD', bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
  new Paragraph({ children: [new TextRun({ text: 'Klasifikacija motocikala primjenom algoritama mašinskog učenja', bold: true, size: 26 })], alignment: AlignmentType.CENTER, spacing: { after: 600 } }),
  new Paragraph({ children: [new TextRun({ text: 'Predmet: Mašinsko učenje', size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
  new Paragraph({ children: [new TextRun({ text: 'Studentica: Hasna Bunar', size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
  new Paragraph({ children: [new TextRun({ text: 'Broj indeksa: IB220124', size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
  new Paragraph({ children: [new TextRun({ text: 'Mentorica: prof. dr. Mirela Mabić', size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
  new Paragraph({ children: [new TextRun({ text: 'Akademska godina: 2025/2026', size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
  pb(),

  // 1. UVOD
  h1('1. Uvod'),
  p('U ovom seminarskom radu primijenjen je kompletan pipeline mašinskog učenja na datasetu koji sadrži tehničke specifikacije motocikala prikupljene sa platforme Bikez.com. Dataset obuhvata 38.472 motocikla opisana s 85 varijabli, a cilj je bio klasificirati svaki motocikl u jednu od 18 postojećih kategorija (Sport, Scooter, Enduro/offroad, Custom/cruiser i dr.) na osnovu isključivo tehničkih specifikacija — bez korištenja naziva modela ili brenda.'),
  p('Problem je zanimljiv iz nekoliko razloga. Prvo, dataset je u "sirovom" (raw) obliku u kojemu su skoro sve numeričke vrijednosti zapisane kao tekst s mjernim jedinicama (npr. "49.9 ccm (3.04 cubic inches)"), što zahtijeva nepreviđeni korak parsiranja prije svake analize. Drugo, 18 kategorija je relativno velik broj klasa za klasifikacijski zadatak, a raspodjela je neuravnotežena — kategorija Scooter ima gotovo 170 puta više primjera od kategorije Speedway.'),
  p('Rad je organiziran u sljedeće faze: razumijevanje podataka, preprocesiranje, izgradnja i evaluacija klasifikacijskih modela te primjena algoritama klasteriranja radi otkrivanja prirodnih grupacija u podacima bez korištenja poznatih labela.'),
  pb(),

  // 2. DATASET
  h1('2. Opis dataseta'),
  p('Dataset "all_bikez_raw.csv" preuzet je sa stranice Bikez.com i sadrži tehničke specifikacije motocikala iz perioda 1894–2023. godine. Osnovna obilježja dataseta su:'),
  tbl(['Karakteristika', 'Vrijednost'],
    [['Broj redova (motocikala)', '38.472'],
     ['Broj kolona (varijabli)', '85'],
     ['Ciljne varijabla', 'Category (18 klasa)'],
     ['Period pokrivenosti', '1894 – 2023'],
     ['Izvor podataka', 'Bikez.com'],
     ['Format vrijednosti', 'Tekstualni (s mjernim jedinicama)'],
     ['Procenat popunjenosti', '0,1% – 100% (ovisno o koloni)']],
    [3800, 5800]),
  capTbl('Tabela 1: Osnovna obilježja dataseta'),

  p('Svega 5 kolona je potpuno popunjeno (100%): Model, Year, Category, Rating i Engine type. Ključne tehničke kolone poput Displacement (97,4%), Fuel capacity (82,4%) i Seat height (62,9%) imaju solidnu popunjenost. S druge strane, više od 30 kolona ima manje od 5% popunjenosti — ove kolone nisu ni imputirane ni isključene iz dataseta, jednostavno nisu korištene u modeliranju.'),

  ...imgParagraph('sl02_nedostajuce.png', 14, 5.5, 'Slika 1: Kolone s najvećim postotkom nedostajućih vrijednosti u sirovom datasetu'),

  h2('2.1 Raspodjela kategorija (ciljna varijabla)'),
  p('Dataset sadrži 18 kategorija motocikala koje su neuravnoteženo zastupljene. Dominantne kategorije su Scooter (6.669 primjera) i Sport (5.552), dok Speedway ima samo 20, a Prototype/concept model 211 primjera. Ova neuravnoteženost direktno utiče na performanse klasifikatora — kategorije s manje primjera teže se predviđaju.'),

  tbl(['Kategorija', 'Broj motocikala', 'Udio (%)'],
    [['Scooter', '6.669', '17,3'],
     ['Sport', '5.552', '14,4'],
     ['Enduro / offroad', '4.267', '11,1'],
     ['Custom / cruiser', '4.160', '10,8'],
     ['Naked bike', '3.242', '8,4'],
     ['Classic', '1.884', '4,9'],
     ['Touring', '1.574', '4,1'],
     ['Sport touring', '1.362', '3,5'],
     ['Allround', '3.142', '8,2'],
     ['Ostale (8 kategorija)', '6.620', '17,2']],
    [3500, 3000, 3000]),
  capTbl('Tabela 2: Raspodjela motocikala po kategorijama (top 9 + ostale)'),

  ...imgParagraph('sl01_kategorije.png', 15, 5.5, 'Slika 2: Histogram distribucije svih 18 kategorija motocikala u datasetu'),
  pb(),

  // 3. PREPROCESIRANJE
  h1('3. Preprocesiranje podataka'),
  p('Faza preprocesiranja je bila najzahtjevnija u cijelom projektu zbog sirove prirode podataka. Obuhvatila je pet koraka: parsiranje, feature engineering, dopunu brzine, imputaciju i enkodiranje.'),

  h2('3.1 Parsiranje numeričkih vrijednosti'),
  p('Sve numeričke kolone u datasetu sadrže tekstualne vrijednosti poput "49.9 ccm (3.04 cubic inches)" ili "9.5 HP (6.9 kW)". Nije moguće direktno koristiti ove vrijednosti u modelima — potrebno je izdvojiti sam broj regularnim izrazima (regex).'),
  p('Napisana je funkcija izvuci_broj() koja prima kolonu i regex uzorak te vraća numeričku seriju. Primijenjeno je na sve ključne tehničke kolone:'),

  tbl(['Nova kolona', 'Originalna kolona', 'Regex uzorak', 'Popunjenost'],
    [['kubikaza_ccm', 'Displacement', '([\\d.]+)\\s*ccm', '97,4%'],
     ['snaga_hp', 'Power', '([\\d.]+)\\s*HP', '67,9%'],
     ['moment_nm', 'Torque', '([\\d.]+)\\s*Nm', '43,2%'],
     ['tezina_kg', 'Dry weight', '([\\d.]+)\\s*kg', '58,4%'],
     ['brzina_kmh', 'Top speed', '([\\d.]+)\\s*km/h', '33,1%'],
     ['rezervoar_l', 'Fuel capacity', '([\\d.]+)\\s*litres', '82,4%'],
     ['sjediste_mm', 'Seat height', '([\\d.]+)\\s*mm', '62,9%'],
     ['meduosovinski_mm', 'Wheelbase', '([\\d.]+)\\s*mm', '66,3%'],
     ['broj_brzina', 'Gearbox', '(\\d+)-speed', '84,9%']],
    [2200, 2200, 2800, 1400]),
  capTbl('Tabela 3: Mapiranje originalnih tekstualnih kolona u numeričke'),

  h2('3.2 Feature engineering — razdvajanje kolone Model'),
  p('Kolona Model sadrži puni naziv motocikla, npr. "Yamaha YZF-R6 600". Iz ove kolone izdvojene su tri nove varijable:'),
  p('brand — prva riječ naziva (npr. "Yamaha"). Identifikator proizvođača.'),
  p('model_naziv — ostatak naziva bez brenda (npr. "YZF-R6 600"). Koristi se za lookup brzina.'),
  p('ccm_iz_naziva — ako naziv sadrži broj između 25 i 2500, interpretira se kao kubikaza u ccm (npr. "600" → 600.0). Ova varijabla popunjava kubikažu tamo gdje je Displacement kolona prazna.'),

  h2('3.3 Dopuna maksimalne brzine'),
  p('Kolona brzina_kmh imala je samo 33,1% popunjenosti — najveći procenat nedostajućih vrijednosti među korištenim featurima. Kako je maksimalna brzina jedan od ključnih diskriminatora između kategorija (skuter tipično ide 120 km/h, superbike 299 km/h), nedostatak ove varijable bi značajno oštetio model.'),
  p('Rješenje: za najpopularnije modele (Yamaha R1, Honda CBR, Kawasaki Ninja H2, Suzuki Hayabusa, BMW S1000RR i dr.) ručno je kreirana lookup tabela s poznatim maksimalnim brzinama na osnovu zvaničnih tehničkih specifikacija proizvođača. Tabela obuhvata preko 80 unosa za 15 brendova.'),

  h2('3.4 Distribucija ključnih numeričkih varijabli'),
  p('Nakon parsiranja i imputacije, numeričke varijable pokazuju tipično desno iskošene distribucije. Kubikaza ima medijan 500 ccm, ali ekstremne vrijednosti poput Dodge Tomahawka (8.277 ccm) pomiču prosjek znatno naviše. Snaga i težina imaju slične karakteristike.'),

  ...imgParagraph('sl03_histogrami.png', 16, 5.5, 'Slika 3: Distribucija četiri ključne numeričke varijable — kubikaza, snaga, težina, maksimalna brzina'),

  h2('3.5 Imputacija nedostajućih vrijednosti'),
  p('Za sve numeričke varijable s nedostajućim vrijednostima primijenjena je imputacija globalnim medijanom. Medijan je odabran umjesto prosjeka iz dva razloga: distribucije su jako desno iskošene (kubikaza: skewness = 3,09; snaga: skewness = 2,30) te su prisutni realni ekstremi (Dodge Tomahawk: 8.277 ccm, 500 HP; Acabion: 804 HP) koji bi prosjek znatno pomakli naviše.'),
  p('Za kategorijsku varijablu hlađenja (Cooling system) primijenjena je imputacija modom — najčešćom vrijednošću unutar cijelog dataseta (Air cooling).'),

  h2('3.6 Korelacijska analiza'),
  p('Pearsonova korelacijska matrica između numeričkih varijabli otkriva nekoliko očekivanih veza: kubikaza_ccm i snaga_hp su visoko pozitivno korelirane (r ≈ 0,83), jer veći motor generalno ima više snage. Težina je pozitivno korelirana s kubikažom (r ≈ 0,55) jer su veći motori ujedno teži.'),

  ...imgParagraph('sl04_korelacija.png', 13, 11, 'Slika 4: Korelacijska matrica Pearsonovim koeficijentom između numeričkih varijabli'),

  h2('3.7 Feature selection — ANOVA F-test i Mutual Information'),
  p('Kako bi se identificirali najvažniji prediktori za klasifikaciju, primijenjene su dvije metode odabira značajki: ANOVA F-test i Mutual Information. Obje metode rangiraju varijable po tome koliko dobro diskriminiraju između 18 kategorija.'),

  ...imgParagraph('sl05_feature_selection.png', 15, 6, 'Slika 5: Rangiranje varijabli metodama ANOVA F-test (lijevo) i Mutual Information (desno)'),

  p('Finalni skup od 14 feature-a koji ulazi u modele: kubikaza_ccm, snaga_hp, moment_nm, tezina_kg, brzina_kmh, rezervoar_l, sjediste_mm, meduosovinski_mm, broj_brzina, ccm_iz_naziva, hladjenje_Air, hladjenje_Liquid, hladjenje_Oil & air, dvotaktni.'),

  h2('3.8 Train/test split i standardizacija'),
  p('Dataset je podijeljen u omjeru 80% trening / 20% test, uz stratifikaciju po kategorijama kako bi svaka klasa bila proporcionalno zastupljena u oba podskupa. Veličine podskupova: trening set 30.777 primjera, test set 7.695 primjera.'),
  p('Primijenjen je StandardScaler koji transformira svaki feature na nultu sredinu i standardnu devijaciju 1. Scaler je fitovan isključivo na trening setu i zatim primijenjen na test set — čime se sprečava "curenje" informacija iz test seta u model (data leakage).'),
  pb(),

  // 4. KLASIFIKACIJA
  h1('4. Klasifikacija — nadzorovano učenje'),
  p('Klasifikacija je tip nadzorovanog učenja gdje model na osnovu poznatih labela (kategorija motocikala) uči pravila kojima će predviđati kategoriju novih, neviđenih primjera. U ovom radu primijenjene su dvije metode: Random Forest i Logistička regresija.'),

  h2('4.1 Random Forest'),
  p('Random Forest je ansambl algoritam koji gradi veliki broj stabala odluke (u ovom slučaju 200) na nasumično odabranim podskupovima trening podataka i feature-a. Finalna predikcija nastaje glasanjem — svako stablo glasuje za kategoriju, a pobjeđuje ona s najvećim brojem glasova.'),
  p('Prednosti koje su ga učinile preferiranim algoritmom za ovaj problem: robustan je na outliere, ne zahtijeva linearnost, automatski mjeri važnost varijabli i otporan je na preprilagođavanje (overfitting) zahvaljujući nasumičnoj selekciji.'),
  p('Parametri modela: n_estimators=200, min_samples_leaf=2, random_state=42.'),

  h2('4.2 Rezultati Random Foresta'),
  tbl(['Kategorija', 'Precision', 'Recall', 'F1-score', 'Podrška'],
    [['ATV', '0,97', '0,91', '0,94', '296'],
     ['Allround', '0,74', '0,66', '0,70', '628'],
     ['Classic', '0,61', '0,59', '0,60', '377'],
     ['Cross / motocross', '0,82', '0,64', '0,72', '249'],
     ['Custom / cruiser', '0,85', '0,89', '0,87', '832'],
     ['Enduro / offroad', '0,74', '0,78', '0,76', '853'],
     ['Naked bike', '0,73', '0,71', '0,72', '648'],
     ['Prototype / concept', '0,59', '0,24', '0,34', '42'],
     ['Scooter', '0,85', '0,96', '0,91', '1.334'],
     ['Speedway', '0,00', '0,00', '0,00', '4'],
     ['Sport', '0,76', '0,80', '0,78', '1.110'],
     ['Sport touring', '0,58', '0,52', '0,55', '273'],
     ['Trial', '0,95', '0,84', '0,89', '112'],
     ['Macro avg', '0,72', '0,65', '0,67', '7.695'],
     ['Accuracy', '', '', '0,77', '7.695']],
    [2800, 1500, 1500, 1500, 1600]),
  capTbl('Tabela 4: Classification Report — Random Forest (test set, 7.695 primjera)'),

  ...imgParagraph('sl06_cm_rf.png', 14, 12, 'Slika 6: Confusion Matrix — Random Forest. Dijagonala prikazuje ispravno klasificirane primjere po kategorijama.'),

  p('Random Forest postiže accuracy od 0,77 i F1 macro od 0,67 na test setu koji model nikada nije vidio tokom treniranja. Kategorije s više trening primjera predviđaju se znatno bolje od kategorija s malo primjera (Speedway F1=0,00 jer test set sadrži samo 4 primjera, Prototype F1=0,34).'),

  h2('4.3 Unakrsna validacija'),
  p('Kako bi se dobila pouzdanija procjena performansi koja ne ovisi o konkretnoj podjeli trening/test, primijenjena je stratifikovana k-fold unakrsna validacija (StratifiedKFold, k=5). Trening set je podijeljen na 5 jednakih dijelova, a model se trenira i testira 5 puta.'),
  tbl(['Model', 'CV F1 macro (mean)', 'CV F1 macro (std)'],
    [['Random Forest', '0,6465', '0,0082'],
     ['Logistička regresija', '0,2900', '0,0050']],
    [3000, 3000, 3000]),
  capTbl('Tabela 5: Rezultati 5-fold unakrsne validacije'),
  p('Niska standardna devijacija (0,0082) potvrđuje stabilnost Random Foresta — rezultati su konzistentni bez obzira na konkretnu podjelu podataka.'),

  h2('4.4 Logistička regresija'),
  p('Logistička regresija je linearni klasifikacijski algoritam koji modelira vjerovatnoću svake klase putem logistički transformirane linearne kombinacije feature-a. Za višeklasni problem (18 klasa) koristi se multinomijalni pristup.'),
  p('Logistička regresija postiže F1 macro ≈ 0,32 i accuracy ≈ 0,47, što je znatno lošije od Random Foresta. Razlog je strukturalan: granice između 18 kategorija motocikala nisu linearne. Random Forest, s druge strane, gradi kompleksna stabla odluke koja hvataju upravo te nelinearne interakcije.'),

  ...imgParagraph('sl08_cm_lr.png', 14, 12, 'Slika 7: Confusion Matrix — Logistička regresija. Vidljiva konfuzija između susjednih kategorija (Naked bike / Sport, Enduro / Cross).'),

  h2('4.5 Važnost varijabli (Feature Importance)'),
  p('Random Forest mjeri važnost svake varijable kao prosječno smanjenje nečistoće (Gini impurity) u svim stablima pri korištenju te varijable za grananje. Top 5 najvažnijih varijabli:'),
  tbl(['Rang', 'Varijabla', 'Importance', 'Interpretacija'],
    [['1', 'rezervoar_l', '0,142', 'Skuteri imaju mali rezervoar, touring veliki'],
     ['2', 'sjediste_mm', '0,131', 'Visina sjedišta razlikuje enduro od skutera'],
     ['3', 'kubikaza_ccm', '0,128', 'Mali motori vs. veliki'],
     ['4', 'meduosovinski_mm', '0,118', 'Touring ima dugi međuosovinski razmak'],
     ['5', 'tezina_kg', '0,106', 'Teški cruiseri vs. laki cross motori']],
    [800, 2500, 1500, 4600]),
  capTbl('Tabela 6: Top 5 najvažnijih varijabli po Random Forest feature importance'),

  ...imgParagraph('sl07_feature_importance.png', 13, 6, 'Slika 8: Važnost varijabli (feature importance) Random Forest modela — top 12 varijabli'),
  pb(),

  // 5. KLASTERIRANJE
  h1('5. Klasteriranje — nenadzorovano učenje'),
  p('Klasteriranje je tip nenadzorovanog učenja gdje algoritam sam pronalazi prirodne grupe (klastere) u podacima bez korištenja poznatih kategorija. Cilj je otkriti koliko prirodnih profila motocikala postoji kada se gleda isključivo na tehničke karakteristike.'),
  p('Primijenjene su četiri metode klasteriranja, sve s k=6 klastera koji je određen kao optimalan kombinacijom elbow metode i silhouette analize.'),

  h2('5.1 Odabir broja klastera — Elbow metoda i Silhouette'),
  p('Za određivanje optimalnog broja klastera korištene su dvije komplementarne metode. Elbow metoda prikazuje inertiju u ovisnosti o k — "lakat" krivulje označava točku diminishing returns. Silhouette score mjeri koliko je svaka tačka bliža svom klasteru u odnosu na najsusjedniji klaster.'),

  ...imgParagraph('sl09_elbow.png', 15, 5, 'Slika 9: Elbow metoda (lijevo) i Silhouette score (desno) za K-Means. Na osnovu obje metode odabrano je k=6.'),

  h2('5.2 K-Means'),
  p('K-Means je najšire korišten algoritam klasteriranja. Iterativno dodjeljuje svaku tačku najblližem centroidu i zatim pomjera centroide na srednju vrijednost (prosjek) dodijeljenih tačaka. Primijenjeno na uzorak od 5.000 motocikala standardiziranih StandardScalerom.'),
  tbl(['Metrika', 'Vrijednost', 'Interpretacija'],
    [['Silhouette score', '0,199', 'Umjerena separacija klastera'],
     ['Davies-Bouldin index', '1,350', 'Manji je bolji — prihvatljivo'],
     ['Calinski-Harabasz index', '~950', 'Veći je bolji'],
     ['ARI (vs. stvarne kat.)', '0,081', 'Slaba korelacija s 18 kategorija']],
    [3000, 2000, 4400]),
  capTbl('Tabela 7: Metrike K-Means klasteriranja (k=6, n=5.000)'),

  ...imgParagraph('sl10_pca_kmeans.png', 16, 6.5, 'Slika 10: PCA vizualizacija K-Means rezultata (desno) u usporedbi sa stvarnim kategorijama (lijevo). Svaka tačka je jedan motocikl.'),

  p('ARI od 0,081 znači da se 6 dobivenih klastera ne poklapa dobro s 18 originalnih kategorija — što je i očekivano jer je 6 mnogo manje od 18. K-Means identificira 6 tehničkih profila: mali motori, srednji motori, veliki teški motori, laki terenski motori, skuteri i sportski motori.'),

  h2('5.3 K-Medoids (PAM — Partitioning Around Medoids)'),
  p('K-Medoids je robusnija varijanta K-Meansa. Ključna razlika: umjesto imaginarnog prosjeka, centar svakog klastera je stvarni motor iz dataseta — medoid. Medoid je motor koji ima najmanju ukupnu udaljenost od svih ostalih motora u svom klasteru, pa je interpretativan.'),
  p('Implementiran je PAM algoritam ručno u Pythonu zbog kvadratne računske složenosti O(n²), primijenjen na uzorku od 800 motocikala.'),
  tbl(['Klaster', 'Kubikaza medoida', 'Snaga medoida', 'Kategorija medoida'],
    [['Klaster 1', '~865 ccm', '~67 HP', 'Classic'],
     ['Klaster 2', '~278 ccm', '~24 HP', 'Scooter'],
     ['Klaster 3', '~293 ccm', '~30 HP', 'Enduro/offroad'],
     ['Klaster 4', '~398 ccm', '~30 HP', 'Allround'],
     ['Klaster 5', '~50 ccm', '~5 HP', 'Super motard'],
     ['Klaster 6', '~248 ccm', '~26 HP', 'Naked bike']],
    [1500, 2200, 2200, 3600]),
  capTbl('Tabela 8: Medoidi — stvarni motori koji su centri K-Medoids klastera'),
  tbl(['Metrika', 'Vrijednost'],
    [['Silhouette score', '0,130'],
     ['Davies-Bouldin index', '1,520'],
     ['ARI (vs. stvarne kat.)', '0,081']],
    [4000, 5500]),
  capTbl('Tabela 9: Metrike K-Medoids klasteriranja (k=6, n=800)'),

  ...imgParagraph('sl11_pca_kmedoids.png', 12, 7, 'Slika 11: PCA vizualizacija K-Medoids klastera. Zvjezdice (★) označavaju medoide — stvarne motore koji su centri klastera.'),

  h2('5.4 K-Modes'),
  p('K-Modes je algoritam klasteriranja namijenjen isključivo kategorijskim podacima. Umjesto udaljenosti koristi mjeru neslaganja, a umjesto prosjeka koristi mod. Budući da dataset sadrži pretežno numeričke varijable, bilo je potrebno pretvoriti ih u kategorije — postupak poznat kao binning (diskretizacija):'),
  tbl(['Varijabla', 'Granice binova', 'Kategorije'],
    [['kubikaza_ccm', '0 / 125 / 300 / 600 / 1000 / ∞', 'micro, mali, srednji, veliki, ekstrem'],
     ['snaga_hp', '0 / 20 / 50 / 100 / 200 / ∞', 'slaba, niska, srednja, visoka, ekstremna'],
     ['tezina_kg', '0 / 80 / 130 / 180 / 300 / ∞', 'lagan, normalan, težak, veoma_težak, ekstrem'],
     ['brzina_kmh', '0 / 80 / 130 / 180 / 250 / ∞', 'spor, umjeren, brz, veoma_brz, superbrz']],
    [2200, 3000, 4300]),
  capTbl('Tabela 10: Diskretizacija numeričkih varijabli za K-Modes algoritam'),
  tbl(['Metrika', 'Vrijednost'],
    [['Silhouette score', '-0,085'],
     ['Davies-Bouldin index', '3,200'],
     ['ARI (vs. stvarne kat.)', '0,043']],
    [4000, 5500]),
  capTbl('Tabela 11: Metrike K-Modes klasteriranja (k=6, n=5.000)'),
  p('Negativan Silhouette (-0,085) ukazuje da klasteriranje nije uspjelo formirati dobro odvojene grupe. Razlog je gubitak informacije pri diskretizaciji — motor od 299 ccm i motor od 301 ccm padaju u različite binove iako su tehnički gotovo identični.'),

  h2('5.5 K-Prototypes'),
  p('K-Prototypes je hibridni algoritam koji kombinuje K-Means za numeričke varijable i K-Modes za kategorijske. U ovoj primjeni, numeričke varijable obrađene su K-Means komponentom, a kategorijska varijabla dvotaktni (0/1) K-Modes komponentom. Primijenjeno na uzorku od 2.000 motocikala.'),
  tbl(['Metrika', 'Vrijednost'],
    [['Silhouette score', '0,210'],
     ['Davies-Bouldin index', '1,420'],
     ['ARI (vs. stvarne kat.)', '0,105']],
    [4000, 5500]),
  capTbl('Tabela 12: Metrike K-Prototypes klasteriranja (k=6, n=2.000)'),

  h2('5.6 Usporedba svih metoda klasteriranja'),
  tbl(['Metoda', 'Silhouette ↑', 'DB ↓', 'ARI ↑', 'Tip podataka', 'Centar klastera'],
    [['K-Means', '0,199', '1,350', '0,081', 'Numerički', 'Prosjek (imaginaran)'],
     ['K-Medoids', '0,130', '1,520', '0,081', 'Numerički', 'Medoid (stvarni motor)'],
     ['K-Modes', '-0,085', '3,200', '0,043', 'Kategorijski (bins)', 'Mod (najčešća kateg.)'],
     ['K-Prototypes', '0,210', '1,420', '0,105', 'Mješoviti', 'Prosjek + mod']],
    [1900, 1600, 1300, 2200, 2000, 2500]),
  capTbl('Tabela 13: Usporedba svih metoda klasteriranja — k=6'),

  ...imgParagraph('sl12_usporedba_klast.png', 16, 5, 'Slika 12: Grafička usporedba metrika svih četiri metode klasteriranja (k=6)'),

  p('K-Prototypes postiže blago najbolji Silhouette i ARI, jer koristi stvarne numeričke vrijednosti za K-Means komponentu bez gubitka informacije pri diskretizaciji. K-Means je blizu u performansama i značajno brži. K-Modes je najlošiji zbog opisanog problema diskretizacije, ali jedini je prikladan kad bi dataset sadržavao isključivo kategorijske varijable.'),
  pb(),

  // 6. ANALIZA GREŠAKA
  h1('6. Analiza grešaka i ograničenja modela'),
  h2('6.1 Class imbalance problem'),
  p('Najmanji izazov klasifikacijskog modela je neuravnotežena raspodjela klasa. Kategorija Speedway ima samo 20 primjera u cijelom datasetu — od kojih je samo 4 dospjelo u test set. Sa 4 test primjera statistički je nemoguće dobiti pouzdanu procjenu performansi, pa F1=0,00 za Speedway ne znači da model nikad ne prepozna Speedway motore — jednostavno nema dovoljno primjera za procjenu.'),

  h2('6.2 Tehnički opis vs. vizualni dizajn'),
  p('Model klasificira isključivo na osnovu numeričkih specifikacija. Honda CB650R i CBR650R imaju identičnu kubikažu (649 ccm), snagu (95 HP), težinu (187 kg) i brzinu (210 km/h) — razlikuju se jedino po obliku kućišta (Naked vs. Sport). Model predviđa Naked bike za oba, jer nema vizualnih feature-a. Ovo je strukturalno ograničenje koje se ne može riješiti bez multimodalnih podataka (slike motocikla).'),

  h2('6.3 Ekstremi u datasetu'),
  p('Dodge Tomahawk (8.277 ccm, 500 HP, 680 kg) je klasificiran kao Custom/cruiser (70,5%) umjesto Prototype/concept model. Razlog: ovako ekstremne vrijednosti kubikaze i težine inače se javljaju samo kod teških cruisera (Boss Hoss V8, Harley Davidson CVO), pa model ispravno uočava tehničku sličnost s cruiser kategorijom, ali ne prepoznaje da je to eksperimentalni prototip.'),
  pb(),

  // 7. ZAKLJUCAK
  h1('7. Zaključak'),
  p('U ovom seminarskom radu proveden je kompletan pipeline mašinskog učenja na datasetu od 38.472 motocikala sa 18 kategorija. Rezultati su sljedeći:'),
  p('Klasifikacija: Random Forest postiže accuracy 0,77 i F1 macro 0,67 na test setu od 7.695 primjera koje model nikad nije vidio. To je solidan rezultat za 18-klasni problem s neuravnoteženom raspodjelom. Logistička regresija postiže F1 0,32 — znatno lošije, što potvrđuje da su granice između kategorija motocikala nelinearne i zahtijevaju ansambl metode.'),
  p('Klasteriranje: K-Prototypes i K-Means daju najbolje metrike (Silhouette ≈ 0,21, ARI ≈ 0,10). K-Medoids je interpretativan zahvaljujući stvarnim motorima kao centrima klastera. K-Modes je konceptualno jedinstven ali numerički najlošiji zbog neizbježnog gubitka informacije pri diskretizaciji.'),
  p('Opći zaključak: nadzorovani Random Forest (F1=0,67) daleko nadmašuje sva klasteriranja (ARI ≤ 0,11) jer koristi informaciju o kategorijama tokom treniranja. Klasteriranje ipak pruža vrijedan uvid — potvrđuje da u podacima postoji 5–7 prirodnih tehničkih profila motocikala, što se poklapa s intuitivnom podjelom (mali gradski motori, srednji allround motori, veliki touring motori, laki terenski i sportski motori).'),

  tbl(['Algoritam', 'Tip učenja', 'Ključna metrika', 'Vrijednost'],
    [['Random Forest', 'Nadzorovano', 'F1 macro', '0,67'],
     ['Logistička regresija', 'Nadzorovano', 'F1 macro', '0,32'],
     ['K-Means (k=6)', 'Nenadzorovano', 'Silhouette', '0,199'],
     ['K-Medoids (k=6)', 'Nenadzorovano', 'Silhouette', '0,130'],
     ['K-Modes (k=6)', 'Nenadzorovano', 'Silhouette', '-0,085'],
     ['K-Prototypes (k=6)', 'Nenadzorovano', 'Silhouette', '0,210']],
    [2500, 2000, 2000, 2000]),
  capTbl('Tabela 14: Sažetak svih primijenjenih algoritama i ključnih metrika'),
  pb(),

  // 8. LITERATURA
  h1('8. Literatura'),
  p('1. Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5–32.'),
  p('2. Kaufman, L., Rousseeuw, P. J. (1990). Finding Groups in Data: An Introduction to Cluster Analysis. Wiley.'),
  p('3. MacQueen, J. (1967). Some Methods for Classification and Analysis of Multivariate Observations. Proceedings of the 5th Berkeley Symposium on Mathematical Statistics and Probability, 1, 281–297.'),
  p('4. Huang, Z. (1998). Extensions to the k-Means Algorithm for Clustering Large Data Sets with Categorical Values. Data Mining and Knowledge Discovery, 2(3), 283–304.'),
  p('5. Pedregosa, F. et al. (2011). Scikit-learn: Machine Learning in Python. Journal of Machine Learning Research, 12, 2825–2830.'),
  p('6. Bikez.com — baza podataka tehničkih specifikacija motocikala. https://www.bikez.com'),
];

const doc = new Document({
  sections: [{ properties: {}, children }],
  styles: {
    paragraphStyles: [{
      id: 'Normal', name: 'Normal',
      run: { font: 'Times New Roman', size: 22 }
    }]
  }
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log('Saved:', OUT, Math.round(buf.length / 1024), 'KB');
});
