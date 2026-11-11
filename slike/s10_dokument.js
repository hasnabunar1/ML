// Sastavljanje seminarskog rada (.docx)
const fs = require('fs');
const D = require('/tmp/rad/node_modules/docx');
const {Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
       WidthType, HeadingLevel, AlignmentType, TableOfContents, PageBreak,
       ShadingType, LevelFormat, BorderStyle} = D;

const S = '/tmp/rad/slike/';
const PAGE_W = 9026; // A4 usable width DXA (12240... actually A4=11906, margins 2x1440 -> 9026)

function pngDim(p){const b=fs.readFileSync(p);return {w:b.readUInt32BE(16),h:b.readUInt32BE(20)};}

function fig(file, maxW=600){
  const d = pngDim(S+file);
  const w = Math.min(maxW, 620);
  const h = Math.round(d.h * w / d.w);
  return new Paragraph({alignment: AlignmentType.CENTER, spacing:{before:120, after:40},
    children:[new ImageRun({type:'png', data: fs.readFileSync(S+file), transformation:{width:w, height:h}})]});
}
function cap(t){return new Paragraph({alignment: AlignmentType.CENTER, spacing:{after:200},
  children:[new TextRun({text:t, italics:true, size:18})]});}
function p(t, opts={}){return new Paragraph({alignment: AlignmentType.JUSTIFIED,
  spacing:{after:120}, children:[new TextRun({text:t, size:22})], ...opts});}
function pRuns(runs){return new Paragraph({alignment: AlignmentType.JUSTIFIED, spacing:{after:120},
  children: runs.map(r => new TextRun({size:22, ...r}))});}
function h1(t){return new Paragraph({heading: HeadingLevel.HEADING_1, spacing:{before:300, after:160}, children:[new TextRun({text:t})]});}
function h2(t){return new Paragraph({heading: HeadingLevel.HEADING_2, spacing:{before:220, after:120}, children:[new TextRun({text:t})]});}
function bullet(t){return new Paragraph({numbering:{reference:'buls', level:0},
  alignment: AlignmentType.JUSTIFIED, spacing:{after:80}, children:[new TextRun({text:t, size:22})]});}

function tbl(header, rows){
  const n = header.length;
  const cw = Math.floor(PAGE_W/n);
  const widths = Array(n).fill(cw);
  const mk = (txt, hdr) => new TableCell({width:{size:cw, type:WidthType.DXA},
    shading: hdr ? {type:ShadingType.CLEAR, fill:'D9E2F3'} : undefined,
    margins:{top:40,bottom:40,left:80,right:80},
    children:[new Paragraph({children:[new TextRun({text:String(txt), bold:hdr, size:18})]})]});
  return new Table({columnWidths:widths, width:{size:PAGE_W, type:WidthType.DXA},
    rows:[new TableRow({tableHeader:true, children:header.map(hd=>mk(hd,true))}),
          ...rows.map(r=>new TableRow({children:r.map(c=>mk(c,false))}))]});
}
const spacer = () => new Paragraph({spacing:{after:160}, children:[]});

// ------------------------- PODACI (iz stvarnih rezultata) -------------------------
const kat12 = [['Scooter',6669],['Sport',5552],['Enduro / offroad',4267],['Custom / cruiser',4160],
 ['Naked bike',3242],['Allround',3141],['Classic',1883],['Super motard',1634],['Touring',1573],
 ['ATV',1481],['Sport touring',1364],['Cross / motocross',1243]];
const desk = {
 'kubikaza_ccm':[37461,552.5,545.4,25.0,397.2,8277.0],
 'snaga_hp':[26110,50.8,52.1,0.3,30.0,804.6],
 'moment_nm':[16634,64.6,63.9,1.5,57.0,712.0],
 'tezina_kg':[22482,164.1,84.9,15.1,145.0,824.0],
 'brzina_kmh':[12730,138.5,58.5,4.8,130.0,650.0],
 'rezervoar_l':[31704,13.3,6.0,0.5,13.5,64.3],
 'sjediste_mm':[24164,788.6,85.5,385.0,790.0,998.0],
 'meduosovinski_mm':[25493,1423.1,172.7,725.0,1422.0,3327.0],
 'rating':[21788,3.40,0.36,1.4,3.4,4.6]};
const skewkurt = [['kubikaza_ccm',3.09,24.77],['snaga_hp',2.30,11.54],['moment_nm',3.45,25.25],
 ['tezina_kg',1.65,5.07],['brzina_kmh',0.67,1.49],['rezervoar_l',0.42,0.66],['sjediste_mm',-0.26,0.90],
 ['meduosovinski_mm',0.50,4.23],['cilindri',1.91,4.44],['snaga_po_kg',1.68,3.34],['rating',-0.67,0.90]];
const missing = [['brzina_kmh',67.1],['snaga_po_kg',59.6],['moment_nm',55.2],['tezina_kg',41.5],
 ['sjediste_mm',36.7],['meduosovinski_mm',32.3],['snaga_hp',31.7],['broj_brzina',31.2],
 ['rezervoar_l',17.5],['cilindri',2.7],['kubikaza_ccm',2.4],['Year',0.0]];
const anova = [['sjediste_mm',1573.4,0.556],['rezervoar_l',1406.5,0.614],['kubikaza_ccm',1302.3,1.000],
 ['meduosovinski_mm',1191.0,0.644],['cilindri',1065.8,0.323],['tezina_kg',990.1,0.495],
 ['snaga_hp',561.4,0.520],['Year',427.0,0.268],['snaga_po_kg',369.5,0.341],['brzina_kmh',350.5,0.216],
 ['moment_nm',317.3,0.375],['broj_brzina',49.2,0.155]];
const kolin = [['kubikaza_ccm','moment_nm',0.98],['brzina_kmh','snaga_po_kg',0.90],
 ['snaga_hp','brzina_kmh',0.89],['snaga_hp','snaga_po_kg',0.89],['snaga_hp','moment_nm',0.85],
 ['kubikaza_ccm','snaga_hp',0.83]];
const outl = [['kubikaza_ccm','1.825 ccm',731,'2,0%'],['snaga_hp','174,5 HP',643,'2,5%'],
 ['moment_nm','236,7 Nm',127,'0,8%'],['tezina_kg','341,5 kg',877,'3,9%'],['brzina_kmh','295,1 km/h',118,'0,9%'],
 ['rezervoar_l','31,5 l',206,'0,6%'],['sjediste_mm','960,5 mm',1106,'4,6%'],
 ['meduosovinski_mm','1.768,5 mm',1153,'4,5%'],['cilindri','3,5',4044,'10,8%']];
const featOpis = [
 ['kubikaza_ccm','Radna zapremina motora (ccm)','parsirano iz Displacement'],
 ['snaga_hp','Snaga motora (HP)','parsirano iz Power'],
 ['moment_nm','Obrtni moment (Nm)','parsirano iz Torque'],
 ['tezina_kg','Suha težina (kg)','parsirano iz Dry weight'],
 ['brzina_kmh','Maksimalna brzina (km/h)','parsirano iz Top speed'],
 ['rezervoar_l','Zapremina rezervoara (l)','parsirano iz Fuel capacity'],
 ['sjediste_mm','Visina sjedišta (mm)','parsirano iz Seat height'],
 ['meduosovinski_mm','Međuosovinski razmak (mm)','parsirano iz Wheelbase'],
 ['broj_brzina','Broj stepeni prenosa','parsirano iz Gearbox'],
 ['cilindri','Broj cilindara','izvedeno iz teksta Engine type'],
 ['snaga_po_kg','Odnos snage i težine (HP/kg)','izvedena karakteristika'],
 ['Year','Godina modela','direktno'],
 ['dvotaktni','Dvotaktni motor (0/1)','izvedeno iz Engine type'],
 ['hladjenje_*','Tip hlađenja (4 binarne)','one-hot iz Cooling system']];
const osnovni = [
 ['Logistička regresija','0,5157','0,4999','0,5157','0,4859','0,8791'],
 ['KNN (k=10)','0,6863','0,6835','0,6863','0,6828','0,9324'],
 ['Stablo odluke','0,7133','0,7174','0,7133','0,7131','0,9155'],
 ['Random Forest','0,8045','0,8027','0,8045','0,8031','0,9666'],
 ['Gradient Boosting','0,7780','0,7774','0,7780','0,7762','0,9714']];
const lrRep = [['ATV','0,818','0,821','0,820'],['Custom / cruiser','0,700','0,780','0,738'],
 ['Scooter','0,547','0,873','0,673'],['Enduro / offroad','0,524','0,557','0,540'],
 ['Sport','0,387','0,488','0,432'],['Cross / motocross','0,636','0,253','0,362'],
 ['Sport touring','0,482','0,297','0,367'],['Allround','0,390','0,287','0,330'],
 ['Naked bike','0,402','0,278','0,328'],['Touring','0,465','0,251','0,326'],
 ['Classic','0,321','0,164','0,218'],['Super motard','0,386','0,052','0,092']];
const rfRep = [['ATV','0,968','0,919','0,943'],['Scooter','0,907','0,967','0,936'],
 ['Custom / cruiser','0,854','0,886','0,870'],['Sport','0,813','0,795','0,804'],
 ['Enduro / offroad','0,784','0,817','0,800'],['Allround','0,781','0,737','0,758'],
 ['Naked bike','0,744','0,752','0,748'],['Cross / motocross','0,790','0,695','0,739'],
 ['Super motard','0,757','0,706','0,731'],['Touring','0,688','0,638','0,662'],
 ['Classic','0,632','0,634','0,633'],['Sport touring','0,583','0,553','0,568']];
const grid = [['100','10','0,6633'],['200','10','0,6649'],['100','20','0,7764'],
 ['200','20','0,7766'],['100','bez ograničenja','0,7784'],['200','bez ograničenja','0,7795']];
const cv4 = [['Random Forest','0,7849','0,0066'],['Gradient Boosting','0,7661','0,0037'],
 ['KNN (k=10)','0,6669','0,0026'],['Logistička regresija','0,4799','0,0069']];
const uspor = [['Accuracy (tačnost)','0,5157','0,8041','+0,2884 (RF)'],
 ['Precision (weighted)','0,4999','0,8020','+0,3021 (RF)'],
 ['Recall (weighted)','0,5157','0,8041','+0,2884 (RF)'],
 ['F1-score (weighted)','0,4859','0,8025','+0,3166 (RF)'],
 ['AUC-ROC (OvR, macro)','0,8791','0,9695','+0,0904 (RF)'],
 ['CV F1 (5-fold)','0,4799 ± 0,007','0,7849 ± 0,007','+0,3050 (RF)']];
const predn = [
 ['Tačnost klasifikacije','Niska (51,6%)','Visoka (80,4%)'],
 ['Interpretabilnost','Visoka (koeficijenti)','Visoka (feature importance)'],
 ['Pretpostavka o podacima','Linearna separabilnost','Nema (nelinearne granice)'],
 ['Osjetljivost na skaliranje','Da (obavezna standardizacija)','Ne'],
 ['Osjetljivost na outliere','Umjerena','Niska (podjele po pragovima)'],
 ['Multikolinearnost','Problematična','Nije problematična'],
 ['Brzina treniranja','Vrlo brza (~1 s)','Brza (~5 s uz paralelizaciju)'],
 ['Sklonost overfittingu','Niska','Kontrolisana (ansambl + OOB)']];
const sazetak = [['Accuracy','0,5157','0,8041','Random Forest'],
 ['F1-score (weighted)','0,4859','0,8025','Random Forest'],
 ['AUC-ROC (macro)','0,8791','0,9695','Random Forest'],
 ['CV F1 (5-fold)','0,4799','0,7849','Random Forest'],
 ['Najbolja klasa (F1)','ATV (0,820)','ATV (0,943)','—'],
 ['Najslabija klasa (F1)','Super motard (0,092)','Sport touring (0,568)','—'],
 ['Interpretabilnost','Koeficijenti','Feature importance','izjednačeno']];

// ------------------------- DOKUMENT -------------------------
const ch = [];

// Naslovna
ch.push(new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:600, after:60},
  children:[new TextRun({text:'Fakultet informacijskih tehnologija', size:28, bold:true})]}));
ch.push(new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:2400},
  children:[new TextRun({text:'Univerzitet „Džemal Bijedić" u Mostaru', size:26})]}));
ch.push(new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:200},
  children:[new TextRun({text:'Klasifikacija kategorija motocikala primjenom algoritama mašinskog učenja', size:40, bold:true})]}));
ch.push(new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:2400},
  children:[new TextRun({text:'Dataset: all_bikez (Bikez.com)', size:26, italics:true})]}));
ch.push(new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:80},
  children:[new TextRun({text:'Profesorica:\tStudentice:', size:24, bold:true})]}));
ch.push(new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:80},
  children:[new TextRun({text:'prof. dr. Mirela Mabic\t[Ime Prezime – IBxxxxxx]', size:24})]}));
ch.push(new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:2000},
  children:[new TextRun({text:'\t[Ime Prezime – IBxxxxxx]', size:24})]}));
ch.push(new Paragraph({alignment:AlignmentType.CENTER,
  children:[new TextRun({text:'Mostar, juli 2026.', size:24}), new PageBreak()]}));

// Sadrzaj
ch.push(new Paragraph({heading:HeadingLevel.HEADING_1, children:[new TextRun('Sadržaj')]}));
ch.push(new TableOfContents('Sadržaj', {hyperlink:true, headingStyleRange:'1-2'}));
ch.push(new Paragraph({children:[new PageBreak()]}));

// 1. UVOD
ch.push(h1('1. Uvod'));
ch.push(p('Klasifikacija je jedan od temeljnih zadataka nadziranog mašinskog učenja: na osnovu poznatih ulaznih karakteristika, model uči pravilnosti koje mu omogućavaju da nove, neviđene primjere svrsta u jednu od unaprijed definisanih klasa. Cilj ovog seminarskog rada je projektovanje, implementacija i evaluacija modela koji na osnovu isključivo tehničkih specifikacija motocikla (snaga, radna zapremina, težina, dimenzije, tip motora i hlađenja) predviđa kojoj kategoriji motocikl pripada – da li je riječ o sportskom motoru, kruzeru, skuteru, enduru ili nekoj drugoj klasi.'));
ch.push(p('Za analizu je korišten javno dostupan, nekurirani (raw) skup podataka prikupljen sa specijalizirane stranice Bikez.com, koji sadrži 38.472 modela motocikala proizvedenih između 1894. i 2022. godine, opisanih kroz 85 atributa. Budući da je skup podataka sirov – numeričke vrijednosti su zapisane kao tekst s mjernim jedinicama, velik dio vrijednosti nedostaje, a pojedine kolone su gotovo prazne – značajan dio rada posvećen je pripremi podataka: parsiranju, deskriptivnoj analizi, analizi ekstremnih i nedostajućih vrijednosti te ispravnoj analizi povezanosti varijabli.'));
ch.push(p('U radu su detaljno implementirana i evaluirana dva algoritma: logistička regresija, kao interpretabilan linearni model koji služi kao referentna tačka (baseline), i Random Forest, ansambl metoda zasnovana na stablima odluke. Pored njih, u osnovnoj komparativnoj analizi ispitani su i KNN, stablo odluke i Gradient Boosting, kako bi se stekao širi uvid u performanse različitih pristupa. Rad prati logičan tok rada na projektu mašinskog učenja: opis i deskriptivna analiza podataka, korelacijska analiza i analiza outliera, priprema podataka uz prevenciju curenja informacija, implementacija i evaluacija algoritama te finalna komparativna analiza s preporukama za dalji rad.'));

// 2. OPIS DATASETA
ch.push(h1('2. Opis dataseta'));
ch.push(h2('2.1 Pregled skupa podataka'));
ch.push(p('Skup podataka all_bikez_raw.csv sadrži specifikacije motocikala prikupljene automatskim preuzimanjem (web scraping) sa stranice Bikez.com. Svaki red predstavlja jedan model motocikla u jednoj godini proizvodnje. Tabela 1 daje osnovni pregled skupa podataka.'));
ch.push(tbl(['Svojstvo','Vrijednost'], [
 ['Broj redova (modela)','38.472'],['Broj kolona (atributa)','85'],
 ['Raspon godina proizvodnje','1894 – 2022'],['Broj kategorija motocikala','18'],
 ['Broj proizvođača (izvedeno iz naziva)','567'],
 ['Potpuno popunjene kolone','5 (Model, Year, Category, Rating, Engine type)'],
 ['Kolone s manje od 5% popunjenosti','25']]));
ch.push(cap('Tabela 1: Osnovni pregled skupa podataka all_bikez'));
ch.push(p('Ključna specifičnost ovog skupa podataka jeste da je nekuriran: gotovo sve numeričke veličine zapisane su kao tekst s mjernim jedinicama i dodatnim opisima (npr. „49.9 ccm (3.04 cubic inches)", „9.5 HP (6.9 kW)"), a ocjena (Rating) je ugrađena u marketinšku rečenicu. Prije bilo kakve analize bilo je potrebno regularnim izrazima (regex) izdvojiti čiste numeričke vrijednosti. Slika 1 prikazuje popunjenost svih 85 kolona: uz svega pet potpuno popunjenih kolona, čak 25 kolona ima manje od 5% popunjenosti (npr. Belt teeth 0,1%, Service interval 0,2%). U skladu sa smjernicama, nijedna kolona nije isključena iz skupa podataka, ali se gotovo prazne kolone ne koriste u modeliranju niti imputiraju, jer bi imputacija kolone koja je preko 95% prazna značila izmišljanje podataka.'));
ch.push(fig('s01_popunjenost.png', 480));
ch.push(cap('Slika 1: Popunjenost svih kolona u datasetu (crveno: kolone s manje od 5% popunjenosti)'));
ch.push(tbl(['Kolona','Popunjenost','Kolona','Popunjenost'], [
 ['Rating (tekst)','100%','Seat height','62,9%'],
 ['Displacement','97,4%','Dry weight','58,4%'],
 ['Cooling system','89,0%','Torque','43,2%'],
 ['Gearbox','84,9%','Top speed','33,1%'],
 ['Fuel capacity','82,4%','Wheelbase','66,3%'],
 ['Power','67,9%','Rating (numerički)','56,6%']]));
ch.push(cap('Tabela 2: Popunjenost ključnih kolona korištenih u analizi'));

ch.push(h2('2.2 Deskriptivna statistika'));
ch.push(p('Tabela 3 prikazuje deskriptivnu statistiku parsiranih numeričkih varijabli. Uočava se izrazita razlika između aritmetičke sredine i medijana kod radne zapremine (552 naspram 397 ccm), snage (50,8 naspram 30 HP) i obrtnog momenta – jasan znak desno asimetričnih distribucija u kojima mali broj ekstremno snažnih motora povlači prosjek naviše. Kod ovakvih varijabli medijan je reprezentativnija mjera centralne tendencije od aritmetičke sredine.'));
ch.push(tbl(['Varijabla','N','Prosjek','Std. dev.','Min','Medijan','Max'],
 Object.entries(desk).map(([k,v])=>[k, v[0].toLocaleString('de'), String(v[1]).replace('.',','), String(v[2]).replace('.',','), String(v[3]).replace('.',','), String(v[4]).replace('.',','), String(v[5]).replace('.',',')])));
ch.push(cap('Tabela 3: Deskriptivna statistika parsiranih numeričkih varijabli'));
ch.push(p('Prosječna ocjena (rating) iznosi 3,40 uz standardnu devijaciju od svega 0,36 – ocjene su usko koncentrisane između 3,2 i 3,7, uz blago lijevu asimetriju. Ocjena je dostupna za 56,6% modela, budući da za dio motocikala na izvornoj stranici ocjena nije formirana.'));

ch.push(h2('2.3 Zastupljenost kategorija'));
ch.push(p('Ciljna varijabla Category dostupna je za svaki red i ima 18 različitih vrijednosti. Slika 2 prikazuje zastupljenost: dominiraju kategorije Scooter (6.669 modela) i Sport (5.552), dok najmanje kategorije (Speedway, Unspecified) imaju ispod 800 modela. Kategorije su, dakle, izrazito neuravnotežene, što je važna činjenica za kasniju klasifikaciju – korištena je stratifikovana podjela na trening i test skup te metrike otporne na neravnotežu (weighted F1, macro AUC).'));
ch.push(fig('s02_kategorije.png', 560));
ch.push(cap('Slika 2: Zastupljenost kategorija motocikala u datasetu'));

ch.push(h2('2.4 Proizvođači – informacija izvučena iz naziva modela'));
ch.push(p('Kolona Model sadrži pun naziv modela (npr. „Honda CBR 600 RR"), pri čemu je prva riječ naziva gotovo uvijek proizvođač. Izdvajanjem prve riječi konstruisana je nova varijabla brand sa 567 različitih vrijednosti – primjer izvlačenja korisne informacije iz tekstualnog naziva. Slika 3 prikazuje 20 najzastupljenijih proizvođača: očekivano dominiraju japanski proizvođači Yamaha (3.414), Honda (3.318), Suzuki (2.440) i Kawasaki (2.320), a slijede Harley-Davidson, BMW i KTM.'));
ch.push(fig('s03_brandovi.png', 560));
ch.push(cap('Slika 3: Top 20 proizvođača po broju modela u datasetu'));

ch.push(h2('2.5 Distribucije numeričkih varijabli'));
ch.push(p('Slika 4 prikazuje histograme svih parsiranih numeričkih varijabli. Radna zapremina, snaga i obrtni moment imaju tipičan desno asimetričan oblik s dugim repom prema velikim vrijednostima. Visina sjedišta i međuosovinski razmak približno su simetrični, jer su dimenzije motocikala fizički ograničene ergonomijom. Broj cilindara je diskretna varijabla s dominacijom jednocilindričnih i dvocilindričnih motora.'));
ch.push(fig('s04_histogrami.png', 620));
ch.push(cap('Slika 4: Histogrami numeričkih varijabli'));

ch.push(h2('2.6 Asimetričnost i spljoštenost distribucija'));
ch.push(p('Za sve numeričke varijable izračunate su mjere asimetrije (skewness) i spljoštenosti (kurtosis). Asimetrija bliska nuli označava simetričnu distribuciju, vrijednost iznad 1 jaku desnu asimetriju; spljoštenost mjeri „težinu repova" distribucije u odnosu na normalnu raspodjelu. Rezultati su prikazani u Tabeli 4 i na Slici 5.'));
ch.push(tbl(['Varijabla','Skewness','Kurtosis','Ocjena oblika'],
 skewkurt.map(([k,s,u])=>[k, String(s).replace('.',','), String(u).replace('.',','),
   Math.abs(s)>1?'jako asimetrična':(Math.abs(s)>0.5?'umjereno asimetrična':'približno simetrična')])));
ch.push(cap('Tabela 4: Asimetrija i spljoštenost numeričkih varijabli'));
ch.push(fig('s05_skew_kurt.png', 620));
ch.push(cap('Slika 5: Skewness (lijevo) i kurtosis (desno) svih numeričkih varijabli'));
ch.push(p('Obrtni moment (skewness 3,45), radna zapremina (3,09) i snaga (2,30) izrazito su desno asimetrični, s vrlo visokom spljoštenošću (24–25) koja ukazuje na teške repove, tj. mali broj ekstremnih vrijednosti daleko od centra distribucije. Nasuprot tome, ocjena je blago lijevo asimetrična (-0,67), a visina sjedišta praktično simetrična. Za varijable s jakom asimetrijom u obzir dolazi logaritamska transformacija; u ovom radu ona nije bila nužna jer glavni algoritam (Random Forest) dijeli podatke po pragovima i nije osjetljiv na oblik distribucije.'));

ch.push(h2('2.7 Nedostajuće vrijednosti'));
ch.push(p('Analiza nedostajućih vrijednosti provedena je nad varijablama koje ulaze u modeliranje (Tabela 5). Udio nedostajućih kreće se od 0% (godina) do 67,1% (maksimalna brzina). Strategija zamjene definisana je po tipu varijable: numeričke varijable zamjenjuju se medijanom, jer su distribucije desno asimetrične s ekstremima pa bi aritmetička sredina bila iskrivljena naviše; kategorijske varijable zamjenjuju se modom (najčešćom vrijednošću). U deskriptivnoj fazi analize prirodno je imputirati medijanom unutar kategorije motocikla (skuteru se pripisuje tipična snaga skutera, a ne globalni medijan), ali u fazi modeliranja to nije dozvoljeno jer je kategorija ciljna varijabla – detaljno objašnjenje dato je u sekciji 4.3 o curenju podataka.'));
ch.push(tbl(['Varijabla','% nedostajućih','Varijabla','% nedostajućih'], [
 ['brzina_kmh','67,1%','sjediste_mm','36,7%'],
 ['snaga_po_kg','59,6%','meduosovinski_mm','32,3%'],
 ['moment_nm','55,2%','snaga_hp / broj_brzina','31,7% / 31,2%'],
 ['tezina_kg','41,5%','rezervoar_l','17,5%'],
 ['cilindri','2,7%','kubikaza_ccm','2,4%']]));
ch.push(cap('Tabela 5: Udio nedostajućih vrijednosti u varijablama korištenim za modeliranje'));
ch.push(p('Pored nedostajućih vrijednosti, identifikovane su i očigledne greške u podacima koje su tretirane kao nedostajuće: suha težina od 0 kg (fizički nemoguća) i visina sjedišta ispod 300 mm. Ovakve vrijednosti nisu obrisane iz dataseta, već su konvertovane u nedostajuće i potom imputirane.'));

ch.push(h2('2.8 Vremenski trendovi i ocjene po kategorijama'));
ch.push(p('Slika 6 prikazuje broj modela i prosječnu snagu po decenijama: broj modela u bazi naglo raste nakon 2000. godine, a prosječna snaga kontinuirano raste kroz cijeli posmatrani period, što odražava tehnološki napredak industrije. Slika 7 prikazuje prosječnu ocjenu po kategorijama – najviše prosječne ocjene imaju touring i sport touring motocikli, a najniže manji offroad i minibike modeli, što je analiza u duhu „popularnosti po tonalitetu" iz smjernica.'));
ch.push(fig('s06_decenije.png', 620));
ch.push(cap('Slika 6: Broj modela (lijevo) i prosječna snaga (desno) po decenijama'));
ch.push(fig('s07_rating_kat.png', 540));
ch.push(cap('Slika 7: Prosječna ocjena po kategoriji (kategorije sa najmanje 100 modela)'));

// 3. KORELACIJSKA
ch.push(h1('3. Korelacijska analiza i provjera redundancije'));
ch.push(h2('3.1 Povezanost karakteristika s ciljnom varijablom'));
ch.push(p('Ciljna varijabla ovog rada (Category) je kategorijska, pa Pearsonov koeficijent korelacije – koji mjeri linearnu vezu između dvije numeričke varijable – nije metodološki ispravan izbor za mjerenje povezanosti karakteristika s ciljem. Umjesto toga korištene su dvije primjerene mjere: ANOVA F-statistika, koja testira razlikuju li se prosjeci karakteristike značajno između kategorija, i mutual information (uzajamna informacija), koja hvata i nelinearne zavisnosti. Rezultati su prikazani u Tabeli 6 i na Slici 8.'));
ch.push(tbl(['Karakteristika','ANOVA F','p-vrijednost','Mutual information'],
 anova.map(([k,f,m])=>[k, String(f).replace('.',','), f>50?'< 0,001':'< 0,001', String(m).replace('.',',')])));
ch.push(cap('Tabela 6: Povezanost karakteristika s ciljnom varijablom (kategorija motocikla)'));
ch.push(fig('s09_anova_mi.png', 620));
ch.push(cap('Slika 8: ANOVA F-statistika (lijevo) i mutual information (desno) za sve karakteristike'));
ch.push(p('Sve karakteristike pokazuju statistički visoko značajnu povezanost s kategorijom (p < 0,001). Najjači signal nose visina sjedišta (F=1573), zapremina rezervoara (F=1407), radna zapremina motora (F=1302) i međuosovinski razmak (F=1191) – dakle geometrija i veličina motocikla, što je intuitivno: enduro motori imaju visoka sjedišta, kruzeri dugačak međuosovinski razmak i velike rezervoare, skuteri male kubikaže. Po mutual information mjeri ubjedljivo najinformativnija je radna zapremina, koja hvata i nelinearne obrasce (npr. tipične kubikaže od 50 ccm za skutere ili 600–1000 ccm za sport motocikle). Najslabiji, ali i dalje značajan signal nosi broj stepeni prenosa.'));

ch.push(h2('3.2 Korelacijska matrica karakteristika'));
ch.push(p('Pearsonova korelacija jeste primjerena za mjerenje veza između samih numeričkih karakteristika, radi provjere redundancije (multikolinearnosti). Slika 9 prikazuje punu korelacijsku matricu, a Tabela 7 parove s |r| > 0,80.'));
ch.push(fig('s10_pearson.png', 600));
ch.push(cap('Slika 9: Pearsonova korelacijska matrica numeričkih karakteristika'));
ch.push(tbl(['Karakteristika 1','Karakteristika 2','Pearson r'],
 kolin.map(([a,b,r])=>[a,b,String(r).replace('.',',')])));
ch.push(cap('Tabela 7: Parovi karakteristika s visokom međusobnom korelacijom (|r| > 0,80)'));
ch.push(p('Najjača veza postoji između radne zapremine i obrtnog momenta (r=0,98) – fizički očekivano, jer veći motori razvijaju veći moment. Snaga je snažno povezana s maksimalnom brzinom (r=0,89) i kubikažom (r=0,83), a izvedena karakteristika snaga_po_kg s obje svoje komponente. Ova redundancija znači da bi kod linearnih modela multikolinearnost mogla destabilizovati koeficijente; sve karakteristike su ipak zadržane, jer Random Forest interno vrednuje njihov stvarni doprinos i nije osjetljiv na multikolinearnost, a uklanjanje bi oslabilo interpretativnu vrijednost analize.'));

ch.push(h2('3.3 Klasifikacija karakteristika: jake naspram slabih'));
ch.push(p('Na osnovu ANOVA i mutual information analize, karakteristike se mogu podijeliti u tri grupe. Jake karakteristike (F > 900): visina sjedišta, zapremina rezervoara, radna zapremina, međuosovinski razmak, broj cilindara i težina – to su nosioci klasifikacijskog signala. Umjerene (F između 300 i 600): snaga, godina, odnos snage i težine, maksimalna brzina i obrtni moment. Slabe (F < 100): broj stepeni prenosa. Nijedna karakteristika nije isključena iz modela: slabe karakteristike ne štete algoritmima zasnovanim na stablima, a mogu nositi fine obrasce koji se ne vide u univarijatnoj analizi.'));

ch.push(h2('3.4 Analiza outliera i odluka o tretmanu'));
ch.push(p('Ekstremne vrijednosti identifikovane su IQR metodom: vrijednost je outlier ako pada izvan intervala [Q1 − 1,5·IQR, Q3 + 1,5·IQR]. Slika 10 prikazuje boxplotove, a Tabela 8 broj i udio outliera po varijabli.'));
ch.push(fig('s08_boxplotovi.png', 620));
ch.push(cap('Slika 10: Boxplotovi numeričkih varijabli s vidljivim outlierima'));
ch.push(tbl(['Varijabla','Gornja IQR granica','Broj outliera','% outliera'], outl));
ch.push(cap('Tabela 8: Rezultati IQR analize outliera'));
ch.push(p('Provjerom najekstremnijih zapisa utvrđeno je da se uglavnom radi o stvarnim, validnim motociklima, a ne o greškama unosa: najsnažniji zapisi pripadaju ekstremnim konceptnim vozilima Acabion GTBO (do 805 HP), a najveće kubikaže konceptu Dodge Tomahawk (8.277 ccm) i modelima Boss Hoss s ugrađenim automobilskim V8 motorom (8.200+ ccm). Kod broja cilindara IQR metoda formalno označava 10,8% vrijednosti kao outliere, ali je to artefakt diskretne distribucije u kojoj dominiraju jednocilindrični motori. Odluka: outlieri se zadržavaju u skupu podataka, jer predstavljaju stvarnu raznolikost tržišta motocikala; jedine intervencije bile su konverzija fizički nemogućih vrijednosti (težina 0 kg) u nedostajuće. Ova odluka dodatno favorizuje algoritme robusne na ekstreme, poput Random Foresta.'));

// 4. PRIPREMA
ch.push(h1('4. Priprema podataka'));
ch.push(h2('4.1 Parsiranje i konstrukcija karakteristika (feature engineering)'));
ch.push(p('Iz sirovih tekstualnih kolona regularnim izrazima izdvojene su numeričke vrijednosti, a iz tekstualnih opisa konstruisane dodatne karakteristike. Konačan skup od 17 ulaznih karakteristika prikazan je u Tabeli 9.'));
ch.push(tbl(['Karakteristika','Opis','Izvor'], featOpis));
ch.push(cap('Tabela 9: Skup karakteristika korištenih za klasifikaciju'));

ch.push(h2('4.2 Definisanje ciljne varijable'));
ch.push(p('Za klasifikaciju su zadržane kategorije s najmanje 1.000 primjeraka, čime je obuhvaćeno 36.209 modela, odnosno 94,1% cjelokupnog dataseta, raspoređenih u 12 klasa: Scooter, Sport, Enduro/offroad, Custom/cruiser, Naked bike, Allround, Classic, Super motard, Touring, ATV, Sport touring i Cross/motocross. Kategorije s manje od 1.000 primjeraka (npr. Trial, Speedway, prototipovi) i oznaka „Unspecified category" isključene su iz zadatka klasifikacije jer premali broj primjera ne omogućava pouzdano učenje ni evaluaciju – pri čemu ostaju dio dataseta i deskriptivne analize.'));

ch.push(h2('4.3 Prevencija curenja podataka (data leakage)'));
ch.push(p('Curenje podataka nastaje kada model u treniranju koristi informacije koje u stvarnoj primjeni ne bi bile dostupne, što vodi nerealno optimističnim rezultatima. U ovom radu poduzete su sljedeće mjere:'));
ch.push(bullet('Imputacija nedostajućih vrijednosti provodi se isključivo medijanima izračunatim na trening skupu; test skup se popunjava tim istim (trening) medijanima.'));
ch.push(bullet('Imputacija po kategoriji – iako statistički preciznija – u zadatku klasifikacije nije dozvoljena, jer je kategorija upravo ciljna varijabla: popunjavanje ulaza medijanom „svoje" kategorije ugradilo bi odgovor u ulazne podatke. Zato je korišten globalni medijan trening skupa.'));
ch.push(bullet('Podjela na trening i test skup izvršena je prije imputacije, a sve transformacije (standardizacija za logističku regresiju) uklopljene su u pipeline koji parametre uči samo na trening podacima.'));

ch.push(h2('4.4 Podjela na skup za treniranje i testiranje'));
ch.push(p('Podaci su podijeljeni na 80% za treniranje (28.967 primjera) i 20% za testiranje (7.242 primjera), uz stratifikaciju po ciljnoj varijabli – svaka klasa zadržava isti udio u oba skupa, što je nužno zbog izražene neravnoteže klasa. Korišteno je fiksno sjeme slučajnosti (random_state=42) radi reproducibilnosti rezultata.'));

// 5. OSNOVNA KOMPARACIJA
ch.push(h1('5. Poređenje algoritama – osnovna analiza'));
ch.push(p('Prije detaljne analize dva primarna algoritma, provedena je osnovna komparacija pet klasifikacijskih pristupa na identičnim podacima (isti trening i test skup, istih 17 karakteristika): logistička regresija, KNN, stablo odluke, Random Forest i Gradient Boosting. Rezultati su prikazani u Tabeli 10 i na Slici 11.'));
ch.push(tbl(['Algoritam','Accuracy','Precision','Recall','F1 (weighted)','AUC-ROC (macro)'], osnovni));
ch.push(cap('Tabela 10: Komparativni rezultati pet algoritama na test skupu'));
ch.push(fig('s11_osnovna_komparacija.png', 620));
ch.push(cap('Slika 11: Poređenje pet algoritama – accuracy, F1 i AUC-ROC'));
ch.push(p('Random Forest postiže najbolje rezultate u accuracy (0,8045) i F1 mjeri (0,8031), a Gradient Boosting neznatno bolji AUC (0,9714 naspram 0,9666). Logistička regresija je ubjedljivo najslabija (F1=0,4859), što ukazuje da granice između kategorija motocikala nisu linearno separabilne – npr. skuter od 50 ccm i cross motor od 50 ccm dijele kubikažu, ali se razlikuju po kombinacijama drugih karakteristika koje linearni model teško hvata. Već jednostavno stablo odluke (F1=0,7131) značajno nadmašuje linearne granice, a ansambli stabala dodaju još 7–9 procentnih poena. Za detaljnu analizu odabrani su logistička regresija (interpretabilan baseline) i Random Forest (najbolji ukupni rezultat).'));

// 6. LOGISTICKA
ch.push(h1('6. Logistička regresija'));
ch.push(h2('6.1 Teorijska osnova'));
ch.push(p('Logistička regresija je linearni klasifikacijski model koji vjerovatnoću pripadnosti klasi modelira logističkom (sigmoidnom) funkcijom linearne kombinacije ulaznih karakteristika. Za višeklasne probleme koristi se multinomijalna (softmax) formulacija: za svaku klasu k model uči vektor koeficijenata, a vjerovatnoća pripadnosti klasi k dobiva se normalizacijom eksponenciranih linearnih skorova preko svih klasa. Model se trenira maksimizacijom log-izglednosti (log-likelihood). Prednosti su brzina, stabilnost i direktna interpretabilnost koeficijenata; ključno ograničenje je pretpostavka linearne separabilnosti klasa u prostoru karakteristika.'));
ch.push(h2('6.2 Implementacija'));
ch.push(p('Korištena je klasa LogisticRegression biblioteke scikit-learn (multinomijalna formulacija, L2 regularizacija, lbfgs optimizator, max_iter=2000). Budući da je logistička regresija osjetljiva na skalu ulaza, sve karakteristike su standardizovane (StandardScaler) unutar pipeline-a, čime je osigurano da se parametri skaliranja uče samo na trening podacima.'));
ch.push(h2('6.3 Analiza koeficijenata'));
ch.push(fig('s13_logreg_koef.png', 620));
ch.push(cap('Slika 12: Koeficijenti logističke regresije po klasama (standardizovane karakteristike)'));
ch.push(p('Koeficijenti otkrivaju kako model razlikuje klase: klasa ATV ima izrazito negativan koeficijent uz visinu sjedišta i međuosovinski razmak (četverotočkaši su kratki i niski u odnosu na dvotočkaše u uzorku), skuteri negativan koeficijent uz kubikažu i broj brzina (automatski mjenjači), a sport kategorija pozitivan koeficijent uz odnos snage i težine. Ova interpretabilnost je glavna vrijednost logističke regresije uprkos slabijim ukupnim metrikama.'));
ch.push(h2('6.4 Cross-validacija'));
ch.push(p('Pet-fold cross-validacija na trening skupu daje F1 (weighted) od 0,4799 uz standardnu devijaciju od svega 0,0069 – model je stabilan, ali konzistentno slab, što potvrđuje da problem nije u varijansi procjene nego u sistematskoj nemogućnosti linearnog modela da razdvoji klase.'));
ch.push(h2('6.5 Evaluacija'));
ch.push(fig('s12_logreg_cm.png', 600));
ch.push(cap('Slika 13: Matrica konfuzije logističke regresije (normalizovana po redovima)'));
ch.push(tbl(['Klasa','Precision','Recall','F1-score'], lrRep));
ch.push(cap('Tabela 11: Metrike logističke regresije po klasama (test skup)'));
ch.push(p('Na test skupu logistička regresija postiže tačnost od 51,6%. Model dobro prepoznaje klase s jasno odvojenim fizičkim karakteristikama: ATV (F1=0,820), Custom/cruiser (0,738) i Scooter (0,673). Potpuno propada na klasi Super motard (F1=0,092, recall svega 5,2%) – supermotard je po specifikacijama gotovo identičan enduru (ista platforma, drugačije gume i namjena), a takve suptilne razlike linearni model ne može uhvatiti. Matrica konfuzije pokazuje i snažno miješanje parova Classic–Custom/cruiser te Sport touring–Touring, koji se stvarno preklapaju i po namjeni i po specifikacijama.'));

// 7. RANDOM FOREST
ch.push(h1('7. Random Forest'));
ch.push(h2('7.1 Teorijska osnova'));
ch.push(p('Random Forest (slučajna šuma) je ansambl metoda koju je 2001. godine formalizovao Leo Breiman. Kombinuje dvije tehnike: bagging (bootstrap aggregating) – svako stablo trenira se na slučajnom uzorku s ponavljanjem iz trening skupa – i slučajan odabir podskupa karakteristika pri svakoj podjeli čvora, čime se smanjuje korelacija između stabala. Finalna predikcija dobiva se glasanjem svih stabala. Usrednjavanje velikog broja dekoreliranih stabala značajno smanjuje varijansu modela bez povećanja pristranosti, što Random Forest čini otpornim na overfitting, na outliere i na multikolinearnost – svojstva posebno vrijedna za ovaj skup podataka, u kojem su ekstremi zadržani, a karakteristike međusobno korelirane.'));
ch.push(h2('7.2 Implementacija'));
ch.push(p('Korištena je klasa RandomForestClassifier biblioteke scikit-learn. Standardizacija nije potrebna jer stabla dijele podatke po pragovima, neosjetljivim na skalu. Polazni hiperparametri: 200 stabala, bez ograničenja dubine, fiksno sjeme random_state=42, paralelizacija na svim jezgrama.'));
ch.push(h2('7.3 Analiza važnosti karakteristika'));
ch.push(fig('s15_rf_importance.png', 560));
ch.push(cap('Slika 14: Random Forest – važnost karakteristika (Gini importance)'));
ch.push(p('Važnost karakteristika ravnomjernije je raspoređena nego što je to tipično: najvažnija je godina modela (0,124), ispred visine sjedišta (0,123), radne zapremine (0,113), međuosovinskog razmaka (0,109) i zapremine rezervoara (0,109). Visoka važnost godine je zanimljiv nalaz – struktura tržišta mijenjala se kroz vrijeme (npr. eksplozija skutera i ATV-ova nakon 2000.), pa godina nosi kontekst koji pomaže razdvajanju klasa. Zapaža se i saglasnost s ANOVA analizom iz sekcije 3.1: iste karakteristike geometrije i veličine dominiraju u oba pogleda, dok binarne karakteristike hlađenja i taktnosti nose zanemariv samostalan doprinos.'));
ch.push(h2('7.4 GridSearchCV – optimizacija hiperparametara'));
ch.push(p('Sistematska pretraga hiperparametara provedena je preko mreže n_estimators ∈ {100, 200} × max_depth ∈ {10, 20, bez ograničenja}, uz 3-fold cross-validaciju i F1 (weighted) kao kriterij. Rezultati su u Tabeli 12 i na Slici 15.'));
ch.push(tbl(['n_estimators','max_depth','F1 (3-fold CV)'], grid));
ch.push(cap('Tabela 12: Rezultati GridSearchCV pretrage'));
ch.push(fig('s14_rf_grid.png', 440));
ch.push(cap('Slika 15: GridSearchCV – F1 po kombinacijama hiperparametara'));
ch.push(p('Optimalna kombinacija je 200 stabala bez ograničenja dubine (CV F1 = 0,7795). Ograničenje dubine na 10 značajno degradira rezultat (F1 ≈ 0,664) – underfitting, jer 12 klasa sa 17 karakteristika zahtijeva duboke, fino granulirane podjele. Razlika između dubine 20 i neograničene dubine je minimalna, a povećanje broja stabala sa 100 na 200 donosi mali, ali konzistentan dobitak. Za razliku od pojedinačnog stabla, neograničena dubina kod Random Foresta ne izaziva overfitting jer usrednjavanje preko 200 stabala kontroliše varijansu.'));
ch.push(h2('7.5 Cross-validacija'));
ch.push(fig('s17_cv.png', 560));
ch.push(cap('Slika 16: 5-fold cross-validacija – poređenje četiri algoritma'));
ch.push(tbl(['Algoritam','F1 (5-fold CV)','Std. devijacija'], cv4));
ch.push(cap('Tabela 13: Rezultati 5-fold cross-validacije'));
ch.push(p('Random Forest postiže najviši prosječni F1 (0,7849), ispred Gradient Boostinga (0,7661). Standardne devijacije svih modela su vrlo male (ispod 0,007), što znači da su procjene stabilne i da poredak algoritama nije slučajnost particije podataka.'));
ch.push(h2('7.6 Evaluacija'));
ch.push(fig('s16_rf_cm.png', 600));
ch.push(cap('Slika 17: Matrica konfuzije Random Forest modela (normalizovana po redovima)'));
ch.push(tbl(['Klasa','Precision','Recall','F1-score'], rfRep));
ch.push(cap('Tabela 14: Metrike Random Forest modela po klasama (test skup)'));
ch.push(p('Finalni model postiže tačnost od 80,4% na test skupu. Gotovo savršeno prepoznaje ATV (F1=0,943) i skutere (0,936) – klase s najizrazitijim fizičkim posebnostima. Najslabiji rezultati su na klasama Sport touring (0,568), Classic (0,633) i Touring (0,662): matrica konfuzije pokazuje da se sport touring miješa s touring i sport klasama, a classic s custom/cruiser i naked klasama. To su granice koje su i ljudima nejasne – radi se o marketinškim, dijelom subjektivnim podjelama kontinuiranog spektra motocikala, pa je dio grešaka inherentan samoj definiciji klasa, a ne slabosti modela. Napomena uz Super motard: dok logistička regresija ovu klasu praktično ne prepoznaje (F1=0,092), Random Forest postiže F1=0,731 – upravo na ovakvim suptilnim, nelinearnim razlikama ansambl stabala pokazuje najveću prednost.'));
ch.push(fig('s18_krivulja_ucenja.png', 560));
ch.push(cap('Slika 18: Random Forest – krivulje učenja'));
ch.push(p('Krivulje učenja pokazuju da validacijski F1 kontinuirano raste s veličinom trening skupa (sa 0,638 na 1.900 primjera do 0,778 na punih 19.000 u 3-fold postavci) i da se krivulje još nisu potpuno spojile – model bi profitirao od dodatnih podataka. Trening F1 blizu 1,0 očekivan je za šumu neograničene dubine i sam po sebi nije znak štetnog overfittinga, što potvrđuje visok i stabilan validacijski rezultat.'));

// 8. POREDJENJE
ch.push(h1('8. Poređenje algoritama'));
ch.push(h2('8.1 ROC krivulje'));
ch.push(fig('s19_roc.png', 560));
ch.push(cap('Slika 19: ROC krivulje svih algoritama (micro-average, one-vs-rest)'));
ch.push(p('Za višeklasni problem ROC analiza provedena je one-vs-rest pristupom uz micro-usrednjavanje. Random Forest (AUC=0,976) i Gradient Boosting (0,977) praktično se preklapaju na vrhu, dok je logistička regresija (0,901) osjetno slabija, ali i dalje daleko iznad nasumičnog pogađanja – njeni problemi vidljiviji su u konačnoj klasifikacijskoj odluci (izbor najvjerovatnije klase) nego u rangiranju vjerovatnoća.'));
ch.push(h2('8.2 Poređenje klasifikacijskih metrika'));
ch.push(fig('s21_prf.png', 540));
ch.push(cap('Slika 20: Precision, recall i F1 – logistička regresija naspram Random Foresta'));
ch.push(tbl(['Metrika','Logistička regresija','Random Forest','Razlika'], uspor));
ch.push(cap('Tabela 15: Komparativna tabela svih metrika'));
ch.push(h2('8.3 Usporedni pregled performansi'));
ch.push(fig('s20_radar.png', 480));
ch.push(cap('Slika 21: Spider dijagram – usporedni pregled performansi'));
ch.push(p('Random Forest dominira u svim mjerenim dimenzijama, s razlikom od približno 29 procentnih poena u tačnosti i 32 poena u F1 mjeri. Spider dijagram pokazuje da razlika nije koncentrisana u jednoj metrici, nego je sistemska – posljedica fundamentalne nelinearnosti granica između kategorija motocikala.'));
ch.push(h2('8.4 Analiza prednosti i nedostataka'));
ch.push(tbl(['Kriterij','Logistička regresija','Random Forest'], predn));
ch.push(cap('Tabela 16: Analiza prednosti i nedostataka'));

// 9. ZAKLJUCAK
ch.push(h1('9. Zaključak i preporuke'));
ch.push(h2('9.1 Sažetak rezultata'));
ch.push(p('U radu je na nekuriranom skupu od 38.472 modela motocikala provedena kompletna priprema podataka (parsiranje teksta u brojeve, analiza i imputacija nedostajućih vrijednosti, analiza outliera i asimetrije distribucija, metodološki ispravna analiza povezanosti karakteristika s kategorijskom ciljnom varijablom) te implementirana i evaluirana klasifikacija kategorije motocikla u 12 klasa na osnovu 17 tehničkih karakteristika. Ključni rezultati sumirani su u Tabeli 17.'));
ch.push(tbl(['Metrika / svojstvo','Logistička regresija','Random Forest','Bolji'], sazetak));
ch.push(cap('Tabela 17: Sažetak ključnih rezultata'));
ch.push(p('Random Forest s optimizovanim hiperparametrima (200 stabala, neograničena dubina) postiže tačnost od 80,4% i weighted F1 od 0,80 na test skupu od 7.242 motocikla – iz čega slijedi glavni zaključak rada: tehničke specifikacije motocikla nose dovoljno informacija da se njegova tržišna kategorija pouzdano predvidi, ali su granice među kategorijama izrazito nelinearne, zbog čega linearni model zaostaje za ansamblom stabala za više od 30 procentnih poena F1 mjere. Najveći dio preostalih grešaka koncentrisan je na parovima klasa čije su definicije i u stvarnosti fluidne (touring – sport touring, classic – cruiser).'));
ch.push(h2('9.2 Prijedlozi za poboljšanje'));
ch.push(p('Model:'));
ch.push(bullet('Ispitati Gradient Boosting varijante (XGBoost, LightGBM) s pretragom hiperparametara – u osnovnoj analizi Gradient Boosting je već bio konkurentan Random Forestu uz bolji AUC.'));
ch.push(bullet('Proširiti GridSearchCV na dodatne hiperparametre (max_features, min_samples_leaf, class_weight=\'balanced\') radi daljeg poboljšanja slabijih klasa.'));
ch.push(bullet('Iskoristiti proizvođača (brand) kao karakteristiku – npr. target ili frequency encoding – budući da su mnogi proizvođači specijalizovani za određene kategorije (Harley-Davidson za kruzere, Vespa za skutere).'));
ch.push(p('Podaci:'));
ch.push(bullet('Iz tekstualnih kolona (naziv modela, Engine details, Comments) NLP tehnikama izvući dodatne karakteristike – sam naziv često sadrži kubikažu i oznaku serije.'));
ch.push(bullet('Ispitati naprednije metode imputacije (KNN imputer, iterativna regresijska imputacija) umjesto globalnog medijana, uz strogo poštovanje train/test granice.'));
ch.push(bullet('Razmotriti spajanje semantički preklapajućih klasa (Touring i Sport touring) ili hijerarhijsku klasifikaciju (prvo makro-grupa, zatim potklasa).'));

// LITERATURA
ch.push(h1('Literatura'));
[
 '[1] Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5–32. https://doi.org/10.1023/A:1010933404324',
 '[2] Hastie, T., Tibshirani, R., & Friedman, J. (2009). The Elements of Statistical Learning: Data Mining, Inference, and Prediction (2nd ed.). Springer.',
 '[3] Cox, D. R. (1958). The regression analysis of binary sequences. Journal of the Royal Statistical Society, Series B, 20(2), 215–242.',
 '[4] Pedregosa, F. et al. (2011). Scikit-learn: Machine Learning in Python. Journal of Machine Learning Research, 12, 2825–2830.',
 '[5] Tukey, J. W. (1977). Exploratory Data Analysis. Addison-Wesley.',
 '[6] Kaufman, S., Rosset, S., Perlich, C., & Stitelman, O. (2012). Leakage in data mining: Formulation, detection, and avoidance. ACM Transactions on Knowledge Discovery from Data, 6(4), 1–21.',
 '[7] Cover, T. M., & Thomas, J. A. (2006). Elements of Information Theory (2nd ed.). Wiley.',
 '[8] Bikez.com motorcycle catalogue / all_bikez dataset (2022). Preuzeto sa: https://www.kaggle.com/datasets/emmanuelfwerr/motorcycle-technical-specifications-19702022',
 '[9] McKinney, W. (2010). Data structures for statistical computing in Python. Proceedings of the 9th Python in Science Conference, 51–56.',
 '[10] Fernández-Delgado, M., Cernadas, E., Barro, S., & Amorim, D. (2014). Do we need hundreds of classifiers to solve real world classification problems? Journal of Machine Learning Research, 15, 3133–3181.'
].forEach(t => ch.push(p(t)));

const doc = new Document({
  features: {updateFields: true},
  numbering: {config: [{reference:'buls', levels:[{level:0, format:LevelFormat.BULLET, text:'•',
    alignment:AlignmentType.LEFT, style:{paragraph:{indent:{left:540, hanging:260}}}}]}]},
  styles: {default: {document: {run: {font:'Calibri', size:22}}}},
  sections: [{properties: {page:{margin:{top:1440,bottom:1440,left:1440,right:1440}}}, children: ch}],
});
Packer.toBuffer(doc).then(b => {fs.writeFileSync('/tmp/rad/Seminarski_klasifikacija_motocikala.docx', b);
  console.log('DOCX zapisan,', Math.round(b.length/1024), 'KB');});
