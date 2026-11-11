'use strict';
const path = require('path');
const fs   = require('fs');
const docxPath = path.join(process.env.HOME || '/root', 'node_modules', 'docx');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ImageRun, PageBreak,
  BorderStyle, ShadingType, VerticalAlign
} = require(fs.existsSync('/tmp/rad/node_modules/docx') ? '/tmp/rad/node_modules/docx' : docxPath);

const OUT  = '/tmp/rad';
const S    = OUT + '/slike/';

// --- helpers ---
function heading1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 120 } });
}
function heading2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 } });
}
function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, ...opts })],
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
  });
}
function bold(text) {
  return new TextRun({ text, bold: true, size: 22 });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function slika(file, w, h, caption) {
  const buf = fs.readFileSync(S + file);
  return [
    new Paragraph({
      children: [new ImageRun({ data: buf, transformation: { width: w, height: h }, type: 'png' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: caption, italics: true, size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    }),
  ];
}

// Tablica zaglavlje + redovi
function tablica(zaglavlje, redovi, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: zaglavlje.map((t, i) =>
      new TableCell({
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: '1F5C99' },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          children: [new TextRun({ text: t, bold: true, color: 'FFFFFF', size: 18 })],
          alignment: AlignmentType.CENTER,
        })],
      })
    ),
  });
  const dataRows = redovi.map(red =>
    new TableRow({
      children: red.map((val, i) =>
        new TableCell({
          width: { size: colWidths[i], type: WidthType.DXA },
          children: [new Paragraph({
            children: [new TextRun({ text: String(val), size: 18 })],
            alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
          })],
        })
      ),
    })
  );
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}

// --- PODACI ---
// Prosjecne vrijednosti po kategorijama (iz python outputa)
const prosjeci = [
  ['Touring',              1229.6,  76.2, 127.2, 321.1, 166.9, 20.3,  727, 1630],
  ['Custom / cruiser',     1165.0,  67.5, 105.2, 263.3, 148.2, 16.2,  685, 1653],
  ['Sport touring',         878.6,  89.3,  97.8, 216.5, 196.9, 19.7,  808, 1486],
  ['Naked bike',            716.8,  78.5,  77.8, 177.3, 178.4, 16.0,  796, 1430],
  ['Classic',               624.5,  45.9,  59.7, 202.6, 146.0, 15.8,  783, 1438],
  ['Sport',                 554.7,  71.1,  72.2, 156.2, 159.4, 15.5,  800, 1396],
  ['Allround',              474.8,  36.3,  46.8, 156.5, 123.2, 14.4,  786, 1394],
  ['ATV',                   446.2,  32.5,  34.1, 268.5,  79.1, 14.2,  816, 1248],
  ['Super motard',          411.5,  49.7,  57.0, 127.7, 136.7, 11.4,  863, 1452],
  ['Enduro / offroad',      336.7,  36.6,  48.2, 119.7, 132.5, 10.3,  876, 1411],
  ['Cross / motocross',     256.1,  28.6,  30.1,  91.8, 138.5,  7.2,  903, 1387],
  ['Scooter',               147.6,  11.7,  18.2, 117.4,  80.3,  7.9,  774, 1346],
  ['Minibike, sport',        85.9,   9.0,   9.1,  52.6,  82.7,  4.2,  641, 1114],
  ['Minibike, cross',        68.9,   5.9,   6.5,  48.2,  65.3,  3.6,  664, 1029],
];

const klasteriK6 = [
  ['Klaster 0 – Mali motori',    131, 16,  38, 111, 112,  7.9, 764, 1290, 'Skuteri, minibike (46% scooter)'],
  ['Klaster 1 – Srednji motori', 378, 29,  51, 146, 130, 12.9, 817, 1430, 'Enduro, allround, sport (raznolik)'],
  ['Klaster 2 – Snazni motori',  973,101,  86, 174, 163, 18.5, 803, 1456, 'Sport, naked, sport touring'],
  ['Klaster 3 – ATV',            668, 30,  57, 154, 130, 17.4, 886, 1280, '100% ATV (posebna geometrija)'],
  ['Klaster 4 – Ekstremi',      4846,385, 531, 459, 184, 28.8, 740, 1949, 'Kruzeri, custom (Boss Hoss, Tomahawk)'],
  ['Klaster 5 – Teski kruzeri', 1344, 52,  93, 269, 132, 17.5, 699, 1638, 'Custom/cruiser (65%), Touring (18%)'],
];

// --- SEKCIJA ---
const children = [
  pageBreak(),
  heading1('10. Analiza razlika između kategorija i klasteriranje'),

  heading2('10.1 Prosječne vrijednosti tehničkih karakteristika po kategorijama'),

  para('Kako bi se empirijski potvrdilo da se 18 kategorija motocikala stvarno razlikuju po tehničkim specifikacijama, izračunate su prosječne vrijednosti ključnih varijabli po svakoj kategoriji. Rezultati su prikazani u Tabeli 16 i na Slici 22.'),

  new Paragraph({ spacing: { after: 120 } }),

  tablica(
    ['Kategorija', 'Kub. (ccm)', 'Snaga (HP)', 'Moment (Nm)', 'Težina (kg)', 'Brzina (km/h)', 'Rezervoar (l)', 'Sjedište (mm)', 'Međuosov. (mm)'],
    prosjeci.map(r => [r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8]]),
    [2200, 900, 900, 1000, 900, 1000, 900, 1000, 1100]
  ),

  new Paragraph({ children: [new TextRun({ text: 'Tabela 16: Prosječne vrijednosti tehničkih karakteristika po kategorijama motocikala', italics: true, size: 20 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 } }),

  para('Tabela jasno pokazuje da kategorije nisu proizvoljne – između njih postoje suštinske tehničke razlike. Touring motocikli imaju daleko najveću prosječnu kubikažu (1.230 ccm) i težinu (321 kg), uz visok obrtni moment prilagođen udobnoj dugoprugaštnoj vožnji. Na suprotnom kraju, minibike modeli imaju prosječno 69–86 ccm i svega 48–53 kg. Scooteri dominiraju brojem (6.669 modela), ali su tehnički skromni – 148 ccm i 11,7 HP prosječno. Sport motocikli kombinuju relativno malu kubikažu (555 ccm) s visokim omjerom snage i težine, dok su kruzeri teži i snažniji, ali sporiji u omjeru snaga/kg.'),

  para('Posebno upada u oči razlika u visini sjedišta: Cross/motocross motori imaju prosječno 903 mm, Super motard 863 mm, a enduro 876 mm – visoko sjedište je funkcionalno za terenska vozila. Kruzeri (685 mm) i touring (727 mm) imaju nisko sjedište jer je udobnost prioritet. Ove razlike potvrđuju da su kategorije definisane smislenim tehničkim granicama, što je dobar argument za klasifikacijski zadatak.'),

  ...slika('k01_heatmapa_kategorije.png', 650, 430, 'Slika 22: Heatmapa prosječnih vrijednosti karakteristika po kategorijama (zeleno = visoko, crveno = nisko u odnosu na prosjek; broj = stvarna vrijednost)'),

  ...slika('k02_kubikaza_kategorije.png', 580, 240, 'Slika 23: Prosječna radna zapremina (ccm) po kategorijama – sortiran silazno'),

  heading2('10.2 Klasteriranje K-Means algoritmom'),

  para('Klasteriranje je metoda nenadziranog mašinskog učenja koja grupira podatke bez unaprijed poznatih oznaka klasa. Za razliku od klasifikacije (gdje model uči iz poznatih kategorija), klasteriranje samo traži prirodne grupe u podacima. Cilj ove analize je ispitati da li K-Means algoritam, baziran isključivo na tehničkim specifikacijama, pronalazi grupacije koje odgovaraju stvarnim kategorijama motocikala.'),

  heading2('10.3 Elbow metoda – odabir broja klastera'),

  para('Elbow metoda mjeri ukupnu sumu kvadratnih grešaka (SSE) za različite vrijednosti k. Kako k raste, SSE opada – pitanje je gdje se opada "lakat" (nagli pad postaje blag), jer to ukazuje na prirodan broj klastera u podacima. Slika 24 prikazuje elbow dijagram.'),

  ...slika('k04_elbow.png', 560, 280, 'Slika 24: Elbow metoda – SSE po broju klastera; crvena linija: k=18 (broj stvarnih kategorija), narančasta: k=6 (lakat)'),

  para('Krivulja pokazuje "lakat" otprilike na k=6, što znači da podaci prirodno gravitiraju prema 6 tehničkih profila. To je logično – u realnosti postoje grubo: mali motori (skuteri, minibike), srednji motori (enduro, allround), snažni sportski, kruzeri, ATV i ekstremi. Broj 18 – koliko ima stvarnih kategorija – ne pojavljuje se kao prirodna granica jer su neke kategorije tehnički slične, a razlikuju se više po dizajnu, tradiciji i namjeni nego po izmjerljivim specifikacijama.'),

  heading2('10.4 Rezultati klasteriranja i usporedba sa stvarnim kategorijama'),

  para('Provedeno je klasteriranje s k=18 (jer toliko ima stvarnih kategorija) i k=6 (prirodan broj klastera prema elbow metodi). Za ocjenu podudarnosti klastera i stvarnih kategorija korišten je Adjusted Rand Index (ARI): vrijednost 0 znači nasumična podudarnost, vrijednost 1 savršeno podudaranje.'),

  new Paragraph({ spacing: { after: 120 } }),

  tablica(
    ['Konfiguracija', 'ARI', 'NMI', 'Interpretacija'],
    [
      ['K-Means, k=18', '0,123', '0,267', 'Slaba do umjerena podudarnost'],
      ['K-Means, k=6',  '0,094', '0,203', 'Slaba podudarnost, ali interpretabilni klasteri'],
    ],
    [2200, 900, 900, 4000]
  ),

  new Paragraph({ children: [new TextRun({ text: 'Tabela 17: Mjere podudarnosti K-Means klastera i stvarnih kategorija', italics: true, size: 20 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 } }),

  para('ARI od 0,123 (k=18) i 0,094 (k=6) su niski, ali su očekivani i ne znače da su kategorije beskorisne. Oni govore da tehnički podaci sami po sebi ne mogu savršeno rekonstruirati 18 ljudski definisanih kategorija – što je zapravo ključan nalaz: kategorije kao što su "Allround", "Classic" i "Naked bike" tehnički se preklapaju, ali se razlikuju po tradiciji, stilu i tržišnom pozicioniranju. Upravo zbog ovog preklapanja nadzireni model (Random Forest) koji uči iz oznaka postiže F1=0,80, što je daleko bolje od nenadziranog K-Means.'),

  ...slika('k05_pca_scatter.png', 650, 300, 'Slika 25: PCA vizualizacija – stvarne kategorije (lijevo) nasuprot K-Means klasteri k=18 (desno); PC1 i PC2 objašnjavaju 55,5% varijanse'),

  heading2('10.5 Interpretacija klastera (k=6)'),

  para('Iako ARI nije visok, klasteri k=6 su tehnički interpretabilni i svaki odgovara prepoznatljivom profilu motocikla. Tabela 18 prikazuje prosjeke po klasterima i dominantne kategorije.'),

  new Paragraph({ spacing: { after: 120 } }),

  tablica(
    ['Klaster', 'Kub.', 'Snaga', 'Nm', 'Tež.', 'Brzina', 'Rez.', 'Sjedište', 'Međuosov.', 'Dominantne kategorije'],
    klasteriK6.map(r => [r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9]]),
    [2100, 700, 700, 600, 700, 700, 700, 900, 1100, 2000]
  ),

  new Paragraph({ children: [new TextRun({ text: 'Tabela 18: K-Means klasteri (k=6) – prosječne vrijednosti i dominantne kategorije', italics: true, size: 20 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 } }),

  para('Posebno interesantan je Klaster 3 koji je 100% ATV – četverotočkaši imaju toliko specifičnu geometriju (kratak međuosovinski razmak, visoko sjedište, heavy težina za kubikažu) da ih K-Means odmah izoluje u posebnu grupu. Klaster 4 obuhvata ekstreme (Boss Hoss, Dodge Tomahawk) s prosječnom kubikažom 4.847 ccm – ti outlieri, koje smo odlučili zadržati u datasetu, formiraju vlastiti klaster. Klaster 0 je dominantno skuterski (46% scootera), Klaster 5 je mješavina teških kruzera i touring motora.'),

  ...slika('k06_pca_k6.png', 650, 300, 'Slika 26: PCA vizualizacija – stvarne kategorije (lijevo) nasuprot K-Means klasteri k=6 (desno)'),

  heading2('10.6 Zaključak analize razlika i klasteriranja'),

  para('Analiza prosječnih vrijednosti po kategorijama potvrđuje da su 18 kategorija motocikala tehnički jasno diferencirane – razlike u kubikazi, snazi, visini sjedišta i međuosovinskom razmaku između npr. Touringa i Crossera iznose višestruke standardne devijacije. Ovo opravdava klasifikacijski zadatak: ako ne bi bilo suštinskih razlika, ni algoritmi ne bi mogli učiti.'),

  para('Klasteriranje K-Means s k=18 postiže ARI=0,123, što je nisko, ali razumljivo: nenadzireno učenje bez oznaka klasa ne može rekonstruirati kategorije koje su dijelom definirane kulturnim, stilskim i marketinškim kriterijima, a ne samo tehničkim mjerama. Nadzireni Random Forest (F1=0,80) pokazuje da uz dostupnost oznaka klasa tehnički podaci nose dovoljno informacija za pouzdanu klasifikaciju. Klasteriranje s k=6 otkriva šest prirodnih tehničkih profila koji su interpretabilni i mogu poslužiti kao osnova za grupisanje kategorija ili hijerarhijsku klasifikaciju kao prijedlog za buduće poboljšanje modela.'),
];

const doc = new Document({
  sections: [{ properties: {}, children }],
  styles: {
    paragraphStyles: [{
      id: 'Normal', name: 'Normal',
      run: { font: 'Times New Roman', size: 22 },
    }],
  },
});

Packer.toBuffer(doc).then(buf => {
  const outPath = OUT + '/dodatak_sekcija10.docx';
  fs.writeFileSync(outPath, buf);
  console.log('Sacuvano:', outPath, Math.round(buf.length / 1024), 'KB');
});
