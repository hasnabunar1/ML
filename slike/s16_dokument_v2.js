'use strict';
const fs = require('fs'), path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ImageRun, PageBreak,
  ShadingType, VerticalAlign, BorderStyle
} = require('/tmp/rad/node_modules/docx');

const OUT = '/tmp/rad', S = OUT + '/slike/';

function h1(text) { return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing:{before:360,after:120}}); }
function h2(text) { return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing:{before:240,after:100}}); }
function p(text, extra={}) {
  return new Paragraph({ children:[new TextRun({text, size:22, ...extra})], spacing:{after:140}, alignment:AlignmentType.JUSTIFIED });
}
function pb() { return new Paragraph({ children:[new PageBreak()] }); }
function italic(text) { return new Paragraph({ children:[new TextRun({text, italics:true, size:20})], alignment:AlignmentType.CENTER, spacing:{after:180}}); }
function img(file, w, h, caption) {
  const buf = fs.readFileSync(S+file);
  return [
    new Paragraph({ children:[new ImageRun({data:buf, transformation:{width:w,height:h}, type:'png'})], alignment:AlignmentType.CENTER, spacing:{before:120,after:60} }),
    italic(caption),
  ];
}
function tbl(hdr, rows, widths) {
  const W = widths.reduce((a,b)=>a+b,0);
  return new Table({ width:{size:W,type:WidthType.DXA}, rows:[
    new TableRow({ tableHeader:true, children: hdr.map((t,i)=>new TableCell({
      width:{size:widths[i],type:WidthType.DXA},
      shading:{type:ShadingType.CLEAR,fill:'1F5C99'},
      verticalAlign:VerticalAlign.CENTER,
      children:[new Paragraph({children:[new TextRun({text:t,bold:true,color:'FFFFFF',size:18})],alignment:AlignmentType.CENTER})]
    }))}),
    ...rows.map(row=>new TableRow({ children: row.map((val,i)=>new TableCell({
      width:{size:widths[i],type:WidthType.DXA},
      children:[new Paragraph({children:[new TextRun({text:String(val),size:18})], alignment:i===0?AlignmentType.LEFT:AlignmentType.CENTER})]
    }))}))
  ]});
}
function caption(text) {
  return new Paragraph({ children:[new TextRun({text, italics:true, size:20})], alignment:AlignmentType.CENTER, spacing:{before:40,after:200} });
}

const children = [
  pb(),
  h1('11. Poboljšanje dataseta i napredna klasteriranja'),
  p('U ovom poglavlju obradjeni su zadaci koje je definisala profesorica nakon pregleda prethodne verzije rada: uklanjanje varijabli koje uzrokuju multikolinearnost, napredna obrada kolone Model, dopunjavanje podataka o maksimalnoj brzini iz sekundarnih izvora te primjena naprednih metoda klasteriranja s potpunom evaluacijom kvaliteta klastera.'),

  // -------------------------------------------------------
  h2('11.1 Uklanjanje multikolinearnosti — snaga_po_kg'),
  p('Multikolinearnost nastaje kada su dvije ili više ulaznih varijabli međusobno jako povezane — kada jedna gotovo u potpunosti "govori istu stvar" kao i druga. Problem je što model tada dobiva istu informaciju više puta, što može dovesti do nestabilnih koeficijenata (posebno kod logističke regresije) ili do situacije u kojoj model ne zna kojoj varijabli da "vjeruje" više.'),
  p('U ovom datasetu varijabla snaga_po_kg izračunata je formulom:'),
  new Paragraph({ children:[new TextRun({text:'         snaga_po_kg = snaga_hp ÷ tezina_kg', bold:true, size:22})], spacing:{after:120} }),
  p('Budući da se snaga_hp i tezina_kg već nalaze u datasetu kao zasebne kolone, uključivanjem snaga_po_kg model prima istu informaciju tri puta. To je potvrđeno korelacijskom analizom:'),
  tbl(['Varijabla 1','Varijabla 2','Pearson r','Ocjena'],
    [['snaga_po_kg','snaga_hp','0,893','Jako visoka korelacija — problematično'],
     ['snaga_po_kg','tezina_kg','0,291','Umjerena korelacija'],
     ['kubikaza_ccm','moment_nm','0,980','Fizički zakon: veći motor = veći moment']],
    [2500,2500,1200,3000]),
  caption('Tabela 19: Korelacijske veze koje upućuju na multikolinearnost'),
  p('Odluka: snaga_po_kg je isključena iz skupa karakteristika za modeliranje. Varijable snaga_hp i tezina_kg ostaju — svaka nosi zasebnu informaciju. Na Random Forest ova promjena minimalno utječe, ali čini model metodološki ispravnijim i bolje pripremljenim za logističku regresiju.'),
  p('Analogija za razumijevanje: zamislite da na testu imate isto pitanje postavljeno na tri različita načina. Dajete isti odgovor tri puta, ali to ne poboljšava vaš rezultat — samo gubi vrijedan prostor za nova pitanja.'),

  // -------------------------------------------------------
  h2('11.2 Razdvajanje kolone Model'),
  p('Originalna kolona Model sadrži sve u jednoj ćeliji: ime proizvođača, oznaku modela, a ponekad i kubikažu. Primjeri iz dataseta: "AJP GALP 50 Enduro", "Yamaha YZF-R6", "Honda CBR 600 RR". Takav format nije koristan za machine learning — model ne može "razumjeti" tekst kao cjelinu. Potrebno je razdvojiti kolonu na smislene dijelove.'),
  p('Primijenjeno je sljedeće razdvajanje regularnim izrazima (regex):'),
  tbl(['Nova kolona','Šta sadrži','Primjer (iz "Yamaha YZF-R6")','Pokrivenost'],
    [['brand','Ime proizvođača (prva riječ)','Yamaha','100% (567 brandova)'],
     ['model_naziv','Naziv modela bez branda i kubikaže','YZF-R6','~95%'],
     ['ccm_iz_naziva','Kubikaza ako je zapisana u imenu','(nije zapisana)','56,5%']],
    [2200,2800,2500,1700]),
  caption('Tabela 20: Razdvajanje kolone Model na sastavne dijelove'),
  p('Posebno korisna je nova kolona ccm_iz_naziva: pronašla je kubikažu u nazivu za 56,5% modela, i u 93,7% slučajeva podudara se s kubikažom parsiranom iz tehničkih specifikacija (±50 ccm tolerancija). Ovo znači da se u budućim verzijama modela ccm_iz_naziva može koristiti za popunjavanje nedostajućih vrijednosti kubikaze — što je napredna tehnika imputacije iz sekundarnog izvora unutar samog dataseta.'),
  p('Varijabla brand (ime proizvođača) sada može biti uključena u model klasifikacije kao kategorijska varijabla. Primjer zašto je to korisno: Harley-Davidson gotovo uvijek pravi kruzere, Vespa gotovo uvijek skutere — brand nosi jak signal o kategoriji koji do sada nije korišten.'),

  // -------------------------------------------------------
  h2('11.3 Dopunjavanje podataka o maksimalnoj brzini'),
  p('Maksimalna brzina je jedna od najvažnijih varijabli za klasifikaciju kategorija motocikala — skuter s 80 km/h i super sport s 299 km/h su dijametralno različiti. Međutim, u originalnom datasetu (preuzetom s Bikez.com) brzina je dostupna za svega 33,1% modela (12.730 od 38.472).'),
  p('Razlog za visoki udio nedostajućih vrijednosti je jednostavan: Bikez.com nema podatak o maksimalnoj brzini za starije i rjeđe modele — a dataset pokriva modele od 1894. do 2022. godine.'),
  p('Strategija dopunjavanja: sastavljena je lookup tabela (tabela pretraživanja) od 200+ popularnih modela s poznatim brzinama, na osnovu tehničkih specifikacija proizvođača (Yamaha, Honda, Kawasaki, Suzuki, BMW, Ducati, KTM, Aprilia, Triumph, Harley-Davidson i drugi) te Wikipedia izvora. Matchiranje se vrši po imenu branda i ključnim riječima naziva modela.'),
  tbl(['Izvor podataka','Broj dodanih zapisa'],
    [['Bikez.com (original)','12.730'],
     ['Yamaha specifikacije','543'],
     ['Harley-Davidson spec.','706'],
     ['Honda specifikacije','373'],
     ['Kawasaki specifikacije','373'],
     ['Suzuki specifikacije','394'],
     ['Triumph specifikacije','279'],
     ['Wikipedia i ostali','954'],
     ['UKUPNO (nova pokrivenost)','16.352 (42,5%)']],
    [4500,4500]),
  caption('Tabela 21: Pokrivenost podataka o maksimalnoj brzini po izvoru'),
  p('Pokrivenost je povećana s 33,1% na 42,5% — povećanje od 9,4 procentnih poena, tj. dodano je 3.622 novih zapisa. Ciljna vrijednost od 50% nije dostignuta jer su popularni modeli (koji imaju javno dostupne spec-sheet podatke) manjina u datasetu prepunom rijetkih, starih ili regionalnih modela za koje brzina nije javno dokumentovana. Ovo je važna metodološka napomena: podaci koji nisu dostupni ni na internetu ne mogu se dodati bez izmišljanja — a izmišljanje podataka nije prihvatljivo u naučnom radu.'),
  p('Napomena o metodologiji: lookup tabela je validna tehnika enrichmenta podataka i koristi se u industriji. Ona nije imputacija (ne izmišljamo vrijednosti) — bilježimo stvarne specifikacije iz pouzdanih izvora, uz navođenje izvora za svaki zapis.'),

  // -------------------------------------------------------
  h2('11.4 K-Prototypes klasteriranje — mješoviti podaci'),
  p('K-Means algoritam, koji smo primjenjivali u prethodnom poglavlju, radi isključivo s numeričkim podacima i koristi srednju vrijednost (mean) kao centar klastera. U našem datasetu postoje i kategorijske varijable (dvotaktni/četverotaktni motor, tip hlađenja) koje K-Means ne može direktno obraditi.'),
  p('K-Prototypes algoritam je nadogradnja K-Meansa za mješovite podatke. Umjesto jedne mjere udaljenosti, kombinuje dvije:'),
  p('• Za numeričke varijable: euklidska udaljenost (ista kao K-Means) — mjeri koliko se brojevi razlikuju'),
  p('• Za kategorijske varijable: Hamming udaljenost — jednostavno broji koliko se kategorija ne podudara (0 = isto, 1 = različito)'),
  p('U ovom radu K-Prototypes je primijenjen na uzorak od 2.000 motocikala uz numeričke varijable i binarnu varijablu dvotaktni (0=četverotaktni, 1=dvotaktni). Rezultati su uspoređeni s K-Means algoritmom.'),

  // -------------------------------------------------------
  h2('11.5 Evaluacija kvaliteta klastera'),
  p('Kako znati je li klasteriranje dobro? Postoje dvije grupe mjera:'),
  p('INTERNE MJERE (ne trebaju prave oznake kategorija — mjere matematičku kvalitetu klastera):'),
  tbl(['Mjera','Raspon','Šta mjeri','Kada je klasteriranje dobro?'],
    [['Silhouette score','-1 do +1','Koliko je svaki motor bliži svom klasteru nego susjednom','Što bliže 1'],
     ['Davies-Bouldin','0 do ∞','Koliko se klasteri međusobno miješaju','Što bliže 0'],
     ['Calinski-Harabasz','0 do ∞','Omjer varijanse između i unutar klastera','Što veći']],
    [2500,1500,3500,2500]),
  caption('Tabela 22: Interne mjere kvaliteta klastera'),
  p('EKSTERNE MJERE (porede rezultate klasteriranja s poznatim kategorijama):'),
  tbl(['Mjera','Raspon','Šta mjeri'],
    [['ARI (Adjusted Rand Index)','0 do 1','Podudarnost klastera i stvarnih kategorija; 0=slučajno, 1=savršeno'],
     ['NMI (Norm. Mutual Information)','0 do 1','Koliko klasteri "znaju" o pravim kategorijama']],
    [3000,1500,5500]),
  caption('Tabela 23: Eksterne mjere kvaliteta klastera'),

  // -------------------------------------------------------
  h2('11.6 Rezultati klasteriranja i evaluacija'),
  ...img('k07_metrike_kvaliteta.png', 650, 220, 'Slika 27: Silhouette, Davies-Bouldin i Calinski-Harabasz za k=2..11; crvena linija = optimum prema svakoj metrici'),
  p('Silhouette score je najveći za k=2 i k=3 (vrijednost ~0,345), što znači da podaci prirodno gravitiraju prema 2-3 grupe, a ne 18 kategorija. Ovo je važan nalaz: motocikli se mogu grubo podijeliti na "male" (skuteri, minibike) i "velike" (sve ostalo), a unutar te podjele granice postaju zamućene. Porast Silhouette-a na k=8+ ukazuje na potencijalnu finu strukturu koja se ne vidi s manjim k.'),
  tbl(['Metoda','Silhouette ↑','Davies-Bouldin ↓','Calinski-Harabasz ↑','ARI ↑','NMI ↑'],
    [['K-Means (k=6)','0,205','1,193','1171,4','0,129','(N/A)'],
     ['K-Prototypes (k=6)','0,197','1,630','430,5','0,124','(N/A)']],
    [2500,1500,2000,2200,1000,1000]),
  caption('Tabela 24: Usporedba K-Means i K-Prototypes (k=6)'),
  p('K-Means postiže bolji Silhouette (0,205 vs 0,197) i bolji Davies-Bouldin (1,193 vs 1,630) od K-Prototypesa. Razlog je tehnički: naš dataset ima samo jednu kategorijsku varijablu (dvotaktni), a numeričkih varijabli je 10 — pa K-Prototypes nema značajnog prostora da pokaže prednost nad K-Meansom. K-Prototypes bi se jasno iskazao u datasetu s puno kategorijskih kolona (npr. boja, zemlja porijekla, tip ovjesa, tip kočnica).'),
  p('ARI od 0,124–0,129 je nizak, ali to ne znači da je klasteriranje loše — znači da 18 kategorija motocikala nije jedino ili "prirodno" grupiranje koje postoji u podacima. Kategorije su dijelom definirane kulturom i marketingom (klasični motor i naked bike se tehnički preklapaju), a ne samo izmjerljivim specifikacijama.'),
  ...img('k08_pca_usporedba.png', 650, 300, 'Slika 28: PCA vizualizacija — stvarne kategorije (lijevo) naspram K-Means k=6 (desno); uzorak 5.000 motocikala'),

  // -------------------------------------------------------
  h2('11.7 Zaključak i preporuke za buduće poboljšanje'),
  p('Ovim poglavljem su riješeni svi zadaci zadani od strane profesorice:'),
  p('1) Multikolinearnost: snaga_po_kg je izbačena iz skupa karakteristika. Ova varijabla je izvedena iz snage i težine koje već postoje, pa njeno uključivanje daje iste informacije modelu tri puta.'),
  p('2) Razdvajanje Model kolone: kolona je razdvojena na brand, model_naziv i ccm_iz_naziva, što otvara mogućnost uključivanja branda u model klasifikacije.'),
  p('3) Dopunjavanje brzine: pokrivenost povećana s 33,1% na 42,5% dodavanjem 3.622 zapisa iz tehničkih specifikacija proizvođača. Cilj od 50% nije dostižan jer podaci za stare i rijetke modele nisu javno dostupni ni na internetu.'),
  p('4) K-Prototypes klasteriranje: primijenjeno i uspoređeno s K-Meansom. K-Means daje nešto bolje interne metrike jer dataset ima pretežno numeričke varijable.'),
  p('5) Evaluacija klastera: prikazane su sve relevantne interne metrike (Silhouette, Davies-Bouldin, Calinski-Harabasz) i externe mjere (ARI). Optimalni broj klastera po Silhouette je k=2 ili k=3, što potvrđuje da se motocikli prirodno dijele na "male" i "velike" — unutar tih gruba postoje smislene podgrupe koje K-Means identificira.'),
  p('Za buduće poboljšanje preporučuje se: (a) uključiti brand kao feature engineering varijablu korištenjem target encoding metode, (b) ispitati hijerarhijsko klasteriranje (dendrogram) koje prikazuje kako se kategorije postepeno grupišu od pojedinačnih motora prema sve širim grupama, i (c) aplicirati DBSCAN koji automatski detektuje outliere (kao Dodge Tomahawk i Boss Hoss) bez ručnog tretmana.'),
];

const doc = new Document({
  sections:[{properties:{}, children}],
  styles:{paragraphStyles:[{id:'Normal',name:'Normal',run:{font:'Times New Roman',size:22}}]},
});

Packer.toBuffer(doc).then(buf => {
  const out = OUT+'/sekcija11_poboljsanja.docx';
  fs.writeFileSync(out, buf);
  console.log('Sacuvano:', out, Math.round(buf.length/1024), 'KB');
});
