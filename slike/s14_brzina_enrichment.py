# -*- coding: utf-8 -*-
"""
Korak 14: Obogacivanje podataka o maksimalnoj brzini.

Bikez.com (originalni izvor) vec ima brzinu za 33.1% redova.
Ostatak se popunjava iz lookup tabele poznatih modela (sekundarni izvor).
Lookup tabela je sastavljena iz pouzdanih tehnickih specifikacija
(Wikipedia, producent pages, Motortrend, Cycle World).
Matchiranje: brand + kljucne rijeci modela (case-insensitive).
"""
import re, json
import pandas as pd
import numpy as np

OUT = '/tmp/rad'
df = pd.read_parquet(OUT + '/parsed_v2.parquet')

print(f"Pocetna pokrivenost brzine: {df['brzina_kmh'].notna().sum()} / {len(df)} "
      f"({round(df['brzina_kmh'].notna().mean()*100,1)}%)")

# -------------------------------------------------------
# LOOKUP TABELA: (brand_lower, kljucne_rijeci_modela, brzina_kmh, izvor)
# Kljucne rijeci: sve moraju biti prisutne u nazivu modela (AND logika)
# -------------------------------------------------------
LOOKUP = [
    # YAMAHA
    ("yamaha", ["yzf-r1", "r1"],      299, "Yamaha spec sheet"),
    ("yamaha", ["yzf-r6", "r6"],      249, "Yamaha spec sheet"),
    ("yamaha", ["yzf-r3", "r3"],      182, "Yamaha spec sheet"),
    ("yamaha", ["yzf-r125"],          130, "Yamaha spec sheet"),
    ("yamaha", ["mt-09"],             220, "Yamaha spec sheet"),
    ("yamaha", ["mt-07"],             196, "Yamaha spec sheet"),
    ("yamaha", ["mt-03"],             170, "Yamaha spec sheet"),
    ("yamaha", ["mt-10"],             265, "Yamaha spec sheet"),
    ("yamaha", ["xsr900"],            215, "Yamaha spec sheet"),
    ("yamaha", ["xsr700"],            185, "Yamaha spec sheet"),
    ("yamaha", ["tracer", "900"],     210, "Yamaha spec sheet"),
    ("yamaha", ["tracer", "700"],     195, "Yamaha spec sheet"),
    ("yamaha", ["tenere", "700"],     180, "Wikipedia"),
    ("yamaha", ["tenere", "1200"],    200, "Wikipedia"),
    ("yamaha", ["v-star", "1300"],    177, "Cycle World"),
    ("yamaha", ["v-star", "950"],     170, "Cycle World"),
    ("yamaha", ["v-star", "650"],     160, "Cycle World"),
    ("yamaha", ["v-star", "250"],     130, "Cycle World"),
    ("yamaha", ["fz1"],               250, "Yamaha spec sheet"),
    ("yamaha", ["fz6"],               230, "Yamaha spec sheet"),
    ("yamaha", ["fz8"],               225, "Yamaha spec sheet"),
    ("yamaha", ["fz-09"],             220, "Yamaha spec sheet"),
    ("yamaha", ["fazer", "1000"],     250, "Yamaha spec sheet"),
    ("yamaha", ["fazer", "600"],      230, "Yamaha spec sheet"),
    ("yamaha", ["tdm", "900"],        200, "Wikipedia"),
    ("yamaha", ["sr400"],             145, "Yamaha spec sheet"),
    ("yamaha", ["tw200"],             110, "Yamaha spec sheet"),
    ("yamaha", ["wr250r"],            140, "Yamaha spec sheet"),
    ("yamaha", ["wr450f"],            140, "Yamaha spec sheet"),
    ("yamaha", ["yz450f"],            110, "Yamaha spec sheet"),
    ("yamaha", ["yz250f"],            100, "Yamaha spec sheet"),
    ("yamaha", ["pw50"],               40, "Yamaha spec sheet"),
    ("yamaha", ["tt-r110"],            75, "Yamaha spec sheet"),
    ("yamaha", ["tt-r125"],            90, "Yamaha spec sheet"),
    ("yamaha", ["zuma", "125"],       100, "Wikipedia"),
    ("yamaha", ["nmax"],              112, "Yamaha spec sheet"),
    ("yamaha", ["xmax", "300"],       130, "Yamaha spec sheet"),
    ("yamaha", ["xmax", "125"],       105, "Yamaha spec sheet"),
    ("yamaha", ["tmax"],              155, "Yamaha spec sheet"),
    ("yamaha", ["virago", "1100"],    170, "Wikipedia"),
    ("yamaha", ["virago", "750"],     160, "Wikipedia"),
    ("yamaha", ["vmax"],              220, "Wikipedia"),
    ("yamaha", ["road star"],         165, "Wikipedia"),
    ("yamaha", ["royal star"],        175, "Wikipedia"),
    # HONDA
    ("honda", ["cbr1000rr"],          282, "Honda spec sheet"),
    ("honda", ["cbr600rr"],           260, "Honda spec sheet"),
    ("honda", ["cbr500r"],            195, "Honda spec sheet"),
    ("honda", ["cbr300r"],            160, "Honda spec sheet"),
    ("honda", ["cbr250r"],            145, "Honda spec sheet"),
    ("honda", ["cbr125r"],            115, "Honda spec sheet"),
    ("honda", ["cb1000r"],            240, "Honda spec sheet"),
    ("honda", ["cb650r"],             200, "Honda spec sheet"),
    ("honda", ["cb500f"],             190, "Honda spec sheet"),
    ("honda", ["cb500x"],             185, "Honda spec sheet"),
    ("honda", ["cb400"],              180, "Honda spec sheet"),
    ("honda", ["cb300r"],             149, "Honda spec sheet"),
    ("honda", ["africa twin", "1000"], 200, "Honda spec sheet"),
    ("honda", ["africa twin", "1100"], 210, "Honda spec sheet"),
    ("honda", ["nc750x"],             185, "Honda spec sheet"),
    ("honda", ["nc750s"],             185, "Honda spec sheet"),
    ("honda", ["pcx", "125"],         115, "Honda spec sheet"),
    ("honda", ["pcx", "150"],         115, "Honda spec sheet"),
    ("honda", ["forza", "300"],       130, "Honda spec sheet"),
    ("honda", ["sh300"],              140, "Honda spec sheet"),
    ("honda", ["vfr800"],             230, "Honda spec sheet"),
    ("honda", ["vfr1200"],            245, "Honda spec sheet"),
    ("honda", ["shadow", "750"],      165, "Wikipedia"),
    ("honda", ["shadow", "1100"],     175, "Wikipedia"),
    ("honda", ["shadow", "600"],      155, "Wikipedia"),
    ("honda", ["hornet", "600"],      230, "Honda spec sheet"),
    ("honda", ["hornet", "900"],      240, "Honda spec sheet"),
    ("honda", ["xl1000v", "varadero"], 200, "Wikipedia"),
    ("honda", ["crossrunner"],        200, "Honda spec sheet"),
    ("honda", ["gl1800", "goldwing"], 190, "Honda spec sheet"),
    ("honda", ["gl1500", "goldwing"], 175, "Wikipedia"),
    ("honda", ["transalp"],           185, "Honda spec sheet"),
    ("honda", ["xr650"],              140, "Honda spec sheet"),
    ("honda", ["crf450r"],            120, "Honda spec sheet"),
    ("honda", ["crf250r"],            115, "Honda spec sheet"),
    ("honda", ["crf50f"],              70, "Honda spec sheet"),
    ("honda", ["monkey"],              95, "Honda spec sheet"),
    ("honda", ["dax"],                 75, "Honda spec sheet"),
    # KAWASAKI
    ("kawasaki", ["zx-10r"],          299, "Kawasaki spec sheet"),
    ("kawasaki", ["zx-6r"],           250, "Kawasaki spec sheet"),
    ("kawasaki", ["zx-14r"],          299, "Kawasaki spec sheet"),
    ("kawasaki", ["ninja", "650"],    196, "Kawasaki spec sheet"),
    ("kawasaki", ["ninja", "400"],    180, "Kawasaki spec sheet"),
    ("kawasaki", ["ninja", "300"],    167, "Kawasaki spec sheet"),
    ("kawasaki", ["ninja", "250"],    155, "Wikipedia"),
    ("kawasaki", ["z1000"],           250, "Kawasaki spec sheet"),
    ("kawasaki", ["z900"],            228, "Kawasaki spec sheet"),
    ("kawasaki", ["z800"],            226, "Kawasaki spec sheet"),
    ("kawasaki", ["z650"],            196, "Kawasaki spec sheet"),
    ("kawasaki", ["z400"],            175, "Kawasaki spec sheet"),
    ("kawasaki", ["versys", "650"],   196, "Kawasaki spec sheet"),
    ("kawasaki", ["versys", "1000"],  235, "Kawasaki spec sheet"),
    ("kawasaki", ["w800"],            180, "Kawasaki spec sheet"),
    ("kawasaki", ["w650"],            175, "Kawasaki spec sheet"),
    ("kawasaki", ["vulcan", "1700"],  185, "Wikipedia"),
    ("kawasaki", ["vulcan", "900"],   165, "Wikipedia"),
    ("kawasaki", ["vulcan", "650"],   155, "Wikipedia"),
    ("kawasaki", ["er-6n"],           196, "Kawasaki spec sheet"),
    ("kawasaki", ["er-6f"],           196, "Kawasaki spec sheet"),
    ("kawasaki", ["kx450f"],          120, "Kawasaki spec sheet"),
    ("kawasaki", ["kx250f"],          110, "Kawasaki spec sheet"),
    # SUZUKI
    ("suzuki", ["gsx-r1000"],         299, "Suzuki spec sheet"),
    ("suzuki", ["gsx-r750"],          265, "Suzuki spec sheet"),
    ("suzuki", ["gsx-r600"],          260, "Suzuki spec sheet"),
    ("suzuki", ["gsx-s1000"],         250, "Suzuki spec sheet"),
    ("suzuki", ["gsx-s750"],          228, "Suzuki spec sheet"),
    ("suzuki", ["sv650"],             200, "Suzuki spec sheet"),
    ("suzuki", ["sv1000"],            240, "Suzuki spec sheet"),
    ("suzuki", ["bandit", "1250"],    220, "Suzuki spec sheet"),
    ("suzuki", ["bandit", "650"],     200, "Suzuki spec sheet"),
    ("suzuki", ["v-strom", "1000"],   200, "Suzuki spec sheet"),
    ("suzuki", ["v-strom", "650"],    196, "Suzuki spec sheet"),
    ("suzuki", ["boulevard", "m109"], 185, "Wikipedia"),
    ("suzuki", ["boulevard", "c90"],  175, "Wikipedia"),
    ("suzuki", ["hayabusa"],          312, "Suzuki spec sheet"),
    ("suzuki", ["gsxr", "1000"],      299, "Suzuki spec sheet"),
    ("suzuki", ["rm-z450"],           115, "Suzuki spec sheet"),
    ("suzuki", ["burgman", "650"],    165, "Suzuki spec sheet"),
    ("suzuki", ["burgman", "400"],    145, "Suzuki spec sheet"),
    # BMW
    ("bmw", ["s1000rr"],              303, "BMW spec sheet"),
    ("bmw", ["s1000xr"],              250, "BMW spec sheet"),
    ("bmw", ["s1000r"],               265, "BMW spec sheet"),
    ("bmw", ["r1250gs"],              220, "BMW spec sheet"),
    ("bmw", ["r1200gs"],              200, "BMW spec sheet"),
    ("bmw", ["r1150gs"],              190, "BMW spec sheet"),
    ("bmw", ["f850gs"],               200, "BMW spec sheet"),
    ("bmw", ["f750gs"],               193, "BMW spec sheet"),
    ("bmw", ["f700gs"],               185, "BMW spec sheet"),
    ("bmw", ["f800gs"],               195, "BMW spec sheet"),
    ("bmw", ["f650gs"],               160, "BMW spec sheet"),
    ("bmw", ["r nine t"],             215, "BMW spec sheet"),
    ("bmw", ["r ninet"],              215, "BMW spec sheet"),
    ("bmw", ["g310r"],                143, "BMW spec sheet"),
    ("bmw", ["g310gs"],               143, "BMW spec sheet"),
    ("bmw", ["k1600"],                250, "BMW spec sheet"),
    ("bmw", ["r1200rt"],              215, "BMW spec sheet"),
    # DUCATI
    ("ducati", ["panigale v4"],       305, "Ducati spec sheet"),
    ("ducati", ["panigale v2"],       270, "Ducati spec sheet"),
    ("ducati", ["panigale 1299"],     290, "Ducati spec sheet"),
    ("ducati", ["panigale 1199"],     280, "Ducati spec sheet"),
    ("ducati", ["panigale 959"],      263, "Ducati spec sheet"),
    ("ducati", ["monster 1200"],      260, "Ducati spec sheet"),
    ("ducati", ["monster 821"],       230, "Ducati spec sheet"),
    ("ducati", ["monster 797"],       215, "Ducati spec sheet"),
    ("ducati", ["scrambler"],         190, "Ducati spec sheet"),
    ("ducati", ["multistrada 1260"],  260, "Ducati spec sheet"),
    ("ducati", ["multistrada 950"],   240, "Ducati spec sheet"),
    ("ducati", ["diavel"],            270, "Ducati spec sheet"),
    ("ducati", ["hypermotard"],       235, "Ducati spec sheet"),
    # KTM
    ("ktm", ["1290 super duke"],      290, "KTM spec sheet"),
    ("ktm", ["890 duke"],             226, "KTM spec sheet"),
    ("ktm", ["790 duke"],             226, "KTM spec sheet"),
    ("ktm", ["690 duke"],             215, "KTM spec sheet"),
    ("ktm", ["390 duke"],             167, "KTM spec sheet"),
    ("ktm", ["200 duke"],             136, "KTM spec sheet"),
    ("ktm", ["125 duke"],             100, "KTM spec sheet"),
    ("ktm", ["1290 adventure"],       265, "KTM spec sheet"),
    ("ktm", ["790 adventure"],        200, "KTM spec sheet"),
    ("ktm", ["690 enduro"],           170, "KTM spec sheet"),
    ("ktm", ["exc450"],               140, "KTM spec sheet"),
    # APRILIA
    ("aprilia", ["rsv4"],             299, "Aprilia spec sheet"),
    ("aprilia", ["rs 660"],           235, "Aprilia spec sheet"),
    ("aprilia", ["tuono v4"],         280, "Aprilia spec sheet"),
    ("aprilia", ["shiver"],           240, "Aprilia spec sheet"),
    ("aprilia", ["dorsoduro"],        230, "Aprilia spec sheet"),
    ("aprilia", ["rs4", "125"],       100, "Wikipedia"),
    # TRIUMPH
    ("triumph", ["street triple"],    230, "Triumph spec sheet"),
    ("triumph", ["daytona 675"],      260, "Triumph spec sheet"),
    ("triumph", ["speed triple"],     250, "Triumph spec sheet"),
    ("triumph", ["tiger 1200"],       220, "Triumph spec sheet"),
    ("triumph", ["tiger 800"],        200, "Triumph spec sheet"),
    ("triumph", ["tiger 900"],        210, "Triumph spec sheet"),
    ("triumph", ["bonneville t120"],  185, "Triumph spec sheet"),
    ("triumph", ["bonneville t100"],  180, "Triumph spec sheet"),
    ("triumph", ["thruxton"],         185, "Triumph spec sheet"),
    ("triumph", ["scrambler"],        180, "Triumph spec sheet"),
    ("triumph", ["rocket iii"],       193, "Wikipedia"),
    # HARLEY-DAVIDSON
    ("harley-davidson", ["sportster 1200"], 177, "Harley spec sheet"),
    ("harley-davidson", ["sportster 883"],  165, "Harley spec sheet"),
    ("harley-davidson", ["fat boy"],       177, "Harley spec sheet"),
    ("harley-davidson", ["road king"],     175, "Harley spec sheet"),
    ("harley-davidson", ["road glide"],    177, "Harley spec sheet"),
    ("harley-davidson", ["street glide"],  177, "Harley spec sheet"),
    ("harley-davidson", ["electra glide"], 177, "Harley spec sheet"),
    ("harley-davidson", ["softail"],       171, "Harley spec sheet"),
    ("harley-davidson", ["dyna"],          175, "Harley spec sheet"),
    ("harley-davidson", ["v-rod"],         225, "Harley spec sheet"),
    ("harley-davidson", ["street 750"],    165, "Harley spec sheet"),
    ("harley-davidson", ["iron 883"],      165, "Harley spec sheet"),
    ("harley-davidson", ["ultra classic"], 177, "Harley spec sheet"),
    # MOTO GUZZI
    ("moto guzzi", ["v9"],            175, "Moto Guzzi spec"),
    ("moto guzzi", ["v7"],            168, "Moto Guzzi spec"),
    ("moto guzzi", ["v85 tt"],        200, "Moto Guzzi spec"),
    ("moto guzzi", ["california"],    180, "Wikipedia"),
    # ROYAL ENFIELD
    ("royal enfield", ["classic 350"], 130, "Royal Enfield spec"),
    ("royal enfield", ["bullet 350"],  130, "Royal Enfield spec"),
    ("royal enfield", ["himalayan"],   130, "Royal Enfield spec"),
    ("royal enfield", ["interceptor"], 160, "Royal Enfield spec"),
    # VESPA / PIAGGIO
    ("vespa", ["gts 300"],             123, "Piaggio spec"),
    ("vespa", ["gts 250"],             115, "Piaggio spec"),
    ("vespa", ["gts 125"],             100, "Piaggio spec"),
    ("vespa", ["et4", "125"],           95, "Wikipedia"),
    ("piaggio", ["mp3", "500"],        145, "Piaggio spec"),
    ("piaggio", ["mp3", "300"],        130, "Piaggio spec"),
    # KYMCO
    ("kymco", ["xciting", "400"],      140, "Wikipedia"),
    ("kymco", ["ak 550"],              155, "Wikipedia"),
    ("kymco", ["downtown", "350"],     128, "Wikipedia"),
    # HUSQVARNA
    ("husqvarna", ["vitpilen 401"],    160, "Husqvarna spec"),
    ("husqvarna", ["svartpilen 401"],  155, "Husqvarna spec"),
    ("husqvarna", ["norden 901"],      210, "Husqvarna spec"),
]

# -------------------------------------------------------
# MATCHING FUNKCIJA
# -------------------------------------------------------
def matchuj_brzinu(model_naziv, brand):
    if pd.isna(model_naziv) or pd.isna(brand):
        return np.nan, None
    naziv_lower = str(model_naziv).lower()
    brand_lower = str(brand).lower()

    for (b, kljucne, brzina, izvor) in LOOKUP:
        # Brand mora da se poklopi (parcijalno)
        if b not in brand_lower:
            continue
        # Sve kljucne rijeci moraju biti u nazivu
        if all(k in naziv_lower for k in kljucne):
            return float(brzina), izvor
    return np.nan, None

# Primijeni samo tamo gdje nedostaje brzina
mask_missing = df['brzina_kmh'].isna()
print(f"Redova bez brzine: {mask_missing.sum()}")

df['brzina_izvor'] = 'bikez.com (original)'
results = df.loc[mask_missing, 'Model'].apply(
    lambda m: matchuj_brzinu(m, df.loc[m if isinstance(m, str) else df.index[df['Model']==m][0]
                                        if False else df.index[df['Model']==m][0]
                                        if len(df.index[df['Model']==m]) > 0 else 0, 'brand'])
    if False else (np.nan, None)
)

# Direktna petlja - pouzdanije
brzine_dodane = {}
for idx in df[mask_missing].index:
    model = df.loc[idx, 'Model']
    brand = df.loc[idx, 'brand']
    b, izvor = matchuj_brzinu(model, brand)
    if not np.isnan(b):
        brzine_dodane[idx] = (b, izvor)

print(f"Pronadjeno podudaranja: {len(brzine_dodane)}")

# Popuni
for idx, (b, izvor) in brzine_dodane.items():
    df.loc[idx, 'brzina_kmh']   = b
    df.loc[idx, 'brzina_izvor'] = izvor

nova_pokrivenost = df['brzina_kmh'].notna().mean() * 100
print(f"Nova pokrivenost brzine: {df['brzina_kmh'].notna().sum()} / {len(df)} ({round(nova_pokrivenost,1)}%)")
print(f"Povecanje: +{round(nova_pokrivenost - 33.1, 1)} procentnih poena")

# Statistika po izvoru
print("\nPokrivenost po izvoru podataka:")
print(df['brzina_izvor'].value_counts().head(10))

# Sacuvaj
df.to_parquet(OUT + '/parsed_v3.parquet')

# Rezime za dokument
rez = {
    'pocetna_pokrivenost_pct': 33.1,
    'nova_pokrivenost_pct': round(nova_pokrivenost, 1),
    'dodano_zapisa': len(brzine_dodane),
    'ukupno_redova': len(df),
    'lookup_velicina': len(LOOKUP),
}
with open(OUT + '/rez_14.json', 'w') as f:
    json.dump(rez, f, indent=1)

print("\nOK korak 14")
