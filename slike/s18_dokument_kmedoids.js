'use strict';
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ImageRun, PageBreak,
  ShadingType, VerticalAlign
} = require('/tmp/rad/node_modules/docx');

const OUT = '/tmp/rad', S = OUT + '/slike/';

function h1(t){ return new Paragraph({text:t, heading:HeadingLevel.HEADING_1, spacing:{before:360,after:120}}); }
function h2(t){ return new Paragraph({text:t, heading:HeadingLevel.HEADING_2, spacing:{before:240,after:100}}); }
function p(t, opts={}){ return new Paragraph({children:[new TextRun({text:t,size:22,...opts})], spacing:{after:140}, alignment:AlignmentType.JUSTIFIED}); }
function pb(){ return new Paragraph({children:[new PageBreak()]}); }
function cap(t){ return new Paragraph({children:[new TextRun({text:t,italics:true,size:20})], alignment:AlignmentType.CENTER, spacing:{after:200}}); }
function img(file, w, h, caption){
  const buf = fs.readFileSync(S+file);
  return [
    new Paragraph({children:[new ImageRun({data:buf,transformation:{width:w,height:h},type:'png'})], alignment:AlignmentType.CENTER, spacing:{before:120,after:60}}),
    cap(caption),
  ];
}
function tbl(hdr, rows, widths){
  const W = widths.reduce((a,b)=>a+b,0);
  return new Table({ width:{size:W,type:WidthType.DXA}, rows:[
    new TableRow({tableHeader:true, children:hdr.map((t,i)=>new TableCell({
      width:{size:widths[i],type:WidthType.DXA},
      shading:{type:ShadingType.CLEAR,fill:'1F5C99'},
      verticalAlign:VerticalAlign.CENTER,
      children:[new Paragraph({children:[new TextRun({text:t,bold:true,color:'FFFFFF',size:18})],alignment:AlignmentType.CENTER})]
    }))}),
    ...rows.map(r=>new TableRow({children:r.map((v,i)=>new TableCell({
      width:{size:widths[i],type:WidthType.DXA},
      children:[new Paragraph({children:[new TextRun({text:String(v),size:18})],alignment:i===0?AlignmentType.LEFT:AlignmentType.CENTER})]
    }))}))
  ]});
}
function captionTbl(t){ return new Paragraph({children:[new TextRun({text:t,italics:true,size:20})], alignment:AlignmentType.CENTER, spacing:{before:40,after:200}}); }

const children = [
  pb(),
  h1('12. K-Medoids i K-Modes klasteriranje'),

  p('Prethodna poglavlja koristila su K-Means i K-Prototypes algoritme za klasteriranje. U ovom poglavlju obrađene su dvije dodatne metode koje profesorica specifično zahtijeva: K-Medoids (klasteriranje zasnovano na medijanu) i K-Modes (klasteriranje zasnovano na modu). Objašnjeno je kada se svaka od ovih metoda primjenjuje, šta je njena prednost i kakve rezultate daje na datasetu motocikala.'),

  h2('12.1 K-Medoids — klasteriranje zasnovano na medijanu'),
  p('K-Means ima jedan veliki problem: centar svakog klastera je PROSJEK svih motora u tom klasteru. Kao što smo već naučili u poglavlju o deskriptivnoj statistici, prosjek je osjetljiv na ekstreme. Šta se događa? Ako u klasteru imamo 99 normalnih motora i jednog Dodge Tomahawk s 8.277 ccm, prosjek će biti "povučen" prema Tomahawku i centar klastera neće predstavljati nijedan stvaran motor.'),
  p('K-Medoids (poznat i kao PAM — Partitioning Around Medoids) rješava ovaj problem na sljedeći način: umjesto računanja prosjeka, algoritam traži STVARNI MOTOR iz dataseta koji je "najcentralniji" u klasteru — tj. onaj koji ima najmanju ukupnu udaljenost od svih ostalih motora u klasteru. Taj motor se naziva medoid.'),
  p('Analogija: zamislite da želite pronaći "tipičnog" studenta u razredu. K-Means bi računao prosjek visine, ocjena, starosti — i dobio bi imaginarnog studenta koji ne postoji. K-Medoids bi rekao: "koji od ovih stvarnih studenata je najsličniji svima ostalima?" i odabrao bi konkretnu osobu. Upravo zbog toga K-Medoids daje interpretabilnije rezultate — svaki centar klastera je stvarni, postojeći motocikl.'),

  p('U ovom radu pronađeni su sljedeći medoidi (centri klastera) — stvarni motori koji su najreprezentativniji za svoju grupu:'),
  tbl(['Klaster','Kubikaza','Snaga','Težina','Kategorija — medoid motor'],
    [['Klaster 1','865 ccm','67 HP','205 kg','Classic — srednje veliki klasični motor'],
     ['Klaster 2','278 ccm','24 HP','158 kg','Scooter — veći skuter'],
     ['Klaster 3','293 ccm','30 HP','103 kg','Enduro/offroad — laki terenski motor'],
     ['Klaster 4','398 ccm','30 HP','134 kg','Allround — svakodnevni motor'],
     ['Klaster 5','50 ccm','30 HP','83 kg','Super motard — laki gradski motor'],
     ['Klaster 6','248 ccm','26 HP','145 kg','Naked bike — srednji naked motor']],
    [1500,1200,1200,1200,5000]),
  captionTbl('Tabela 25: Medoidi — stvarni motori koji su centri K-Medoids klastera'),

  p('Svaki od ovih motora je STVARNI model iz dataseta, ne imaginarni prosjek. Ovo je ključna prednost K-Medoids nad K-Means za interpretaciju rezultata.'),

  h2('12.2 K-Modes — klasteriranje zasnovano na modu'),
  p('K-Means i K-Medoids rade s brojevima. Ali šta ako želimo klasterirati podatke koji nisu brojevi, nego kategorije — tip hlađenja (zračno/tečno), vrsta motora (dvotaktni/četverotaktni), veličinska klasa (mali/srednji/veliki)?'),
  p('K-Modes algoritam je napravljen upravo za ovo. Umjesto srednje vrijednosti ili medoida, K-Modes koristi MOD — najčešću vrijednost unutar klastera. Na primjer, ako klaster sadrži 70% zračno hlađenih motora, 20% tečno i 10% uljno, mod je "zračno" i to će biti "centar" klastera za tu varijablu.'),
  p('Problem s K-Modes je da ne može direktno raditi s brojevima. Zbog toga su numerički podaci (kubikaza, snaga, težina, brzina) pretvoreni u kategorije, tzv. binning:'),
  tbl(['Varijabla','Kategorije (bins)'],
    [['Kubikaza','micro (<125 ccm), mali (125–300), srednji (300–600), veliki (600–1000), ekstrem (>1000)'],
     ['Snaga','slaba (<20 HP), niska (20–50), srednja (50–100), visoka (100–200), ekstremna (>200)'],
     ['Težina','lagan (<80 kg), normalan (80–130), težak (130–180), veoma težak (180–300), ekstrem (>300)'],
     ['Brzina','spor (<80), umjeren (80–130), brz (130–180), veoma brz (180–250), superbrz (>250)']],
    [2000,8000]),
  captionTbl('Tabela 26: Pretvaranje numeričkih varijabli u kategorije za K-Modes'),

  p('Nakon klasteriranja, "centar" svakog klastera ne opisuje jedan konkretni motor, nego kombinaciju najčešćih kategorija. Na primjer, Klaster 3 ima centar: kubikaza=veliki, snaga=visoka, težina=težak, brzina=veoma_brz, hlađenje=tečno — što odgovara profilu sportskog motora.'),

  h2('12.3 Kada koristiti koju metodu'),
  tbl(['Metoda','Tip podataka','Centar klastera','Robustan na ekstreme?','Kada ga koristiti'],
    [['K-Means','Numerički','Prosjek (imaginaran)','Ne','Brz, jednostavan, dobra polazna tačka'],
     ['K-Medoids','Numerički','Stvarni motor (medoid)','DA','Kada želimo interpretabilne centre, ima ekstrema'],
     ['K-Modes','Kategorijski','Kombinacija modova','Da (jer radi s kategorijama)','Kad su podaci kategorijski ili konvertirani u bins'],
     ['K-Prototypes','Mješoviti','Prosjek + mod','Djelimično','Kad imamo i brojeve i kategorije istovremeno']],
    [1800,1800,2300,1700,2400]),
  captionTbl('Tabela 27: Usporedba metoda klasteriranja — kada koristiti koju'),

  h2('12.4 Usporedba svih metoda klasteriranja'),
  ...img('k09_kmedoids_kmodes.png', 650, 260, 'Slika 29: PCA vizualizacija — K-Means (lijevo), K-Medoids s medoidima označenim zvjezdicom (sredina), K-Modes (desno)'),

  tbl(['Metoda','Silhouette ↑','Davies-Bouldin ↓','Calinski-Harabasz ↑','ARI ↑','Tip podataka'],
    [['K-Means (k=6)',   '0,210','1,171','758,0','0,133','Numerički'],
     ['K-Medoids (k=6)', '0,105','1,666','122,2','0,095','Numerički'],
     ['K-Modes (k=6)',  '-0,076','3,797','178,4','0,051','Kategorijski (bins)'],
     ['K-Prototypes (k=6)','0,197','1,630','430,5','0,124','Mješoviti']],
    [2500,1400,2000,2000,1000,2100]),
  captionTbl('Tabela 28: Finalna usporedba svih metoda klasteriranja (k=6)'),

  p('Rezultati jasno pokazuju da K-Means daje najbolje metrike na ovom datasetu (Silhouette=0,210, DB=1,171). Razlog leži u prirodi podataka:'),
  p('K-Medoids daje niže metrike (Silhouette=0,105) jer je algoritam osjetljiv na veličinu uzorka — potreban mu je veći uzorak za stabilan rezultat, a korišten je manji uzorak (800 motora) zbog računske zahtjevnosti O(n²).'),
  p('K-Modes ima negativan Silhouette (-0,076) što znači da klasteri nisu dobro formirani. Razlog je gubitak informacije pri konverziji preciznih brojeva u grube kategorije (bins) — npr. motor od 299 ccm i motor od 301 ccm padaju u različite klastere (mali vs srednji), iako su gotovo identični.'),
  p('Zaključak: za ovaj dataset koji je pretežno numerički, K-Means ostaje najprikladniji algoritam. K-Medoids bi bio bolji izbor kada bi imali više ekstrema koji "kvare" prosjek, a K-Modes je primjereniji za datasetove gdje su varijable prirodno kategorijske (npr. dataset o klijentima s atributima kao što su spol, regija, tip pretplate).'),

  h2('12.5 Finalni zaključak klasteriranja'),
  p('U ovom radu primijenjene su četiri različite metode klasteriranja, sve s k=6 klastera (prirodan broj prema elbow metodi):'),
  p('1) K-Means — standardna metoda, najbrža, daje najbolje metrike na numeričkim podacima.'),
  p('2) K-Prototypes — proširenje K-Meansa za mješovite podatke; slične performanse K-Meansu.'),
  p('3) K-Medoids (PAM) — robustan na ekstreme, daje stvarne motore kao centre klastera; interpretabilniji ali sporiji.'),
  p('4) K-Modes — jedina metoda za čisto kategorijske podatke; zahtijeva pretvaranje brojeva u bins što smanjuje tačnost.'),
  p('Generalni zaključak klasteriranja ostaje nepromijenjen: motocikli se tehničkim specifikacijama mogu grupisati u 2–6 prirodnih profila, ali rekonstrukcija točno 18 kategorija nije moguća bez informacije o samoj kategoriji (što rade nadzorovani algoritmi poput Random Foresta). Nadzorovani Random Forest (F1=0,80) daleko nadmašuje bilo koje klasteriranje (ARI≤0,13) upravo zbog toga što uči iz poznatih kategorija.'),
];

const doc = new Document({
  sections:[{properties:{}, children}],
  styles:{paragraphStyles:[{id:'Normal',name:'Normal',run:{font:'Times New Roman',size:22}}]},
});

Packer.toBuffer(doc).then(buf=>{
  const out = OUT+'/sekcija12_kmedoids_kmodes.docx';
  fs.writeFileSync(out, buf);
  console.log('Sacuvano:', out, Math.round(buf.length/1024), 'KB');
});
