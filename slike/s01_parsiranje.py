# -*- coding: utf-8 -*-
"""Korak 1: parsiranje raw podataka -> cisti dataframe (parquet) + osnovne tabele."""
import json, re
import numpy as np
import pandas as pd

RAW = '/sessions/stoic-kind-maxwell/mnt/uploads/all_bikez_raw.csv'
OUT = '/tmp/rad'
import os; os.makedirs(OUT, exist_ok=True); os.makedirs(OUT + '/slike', exist_ok=True)

df = pd.read_csv(RAW, low_memory=False)

def izvuci(s, pat):
    return s.astype(str).str.extract(pat)[0].astype(float)

df['rating'] = izvuci(df['Rating'], r'(\d\.\d)')
df['kubikaza_ccm'] = izvuci(df['Displacement'], r'([\d.]+)\s*ccm')
df['snaga_hp'] = izvuci(df['Power'], r'([\d.]+)\s*HP')
df['moment_nm'] = izvuci(df['Torque'], r'([\d.]+)\s*Nm')
df['tezina_kg'] = izvuci(df['Dry weight'], r'([\d.]+)\s*kg')
df['brzina_kmh'] = izvuci(df['Top speed'], r'([\d.]+)\s*km/h')
df['rezervoar_l'] = izvuci(df['Fuel capacity'], r'([\d.]+)\s*litres')
df['sjediste_mm'] = izvuci(df['Seat height'], r'([\d.]+)\s*mm')
df['meduosovinski_mm'] = izvuci(df['Wheelbase'], r'([\d.]+)\s*mm')
df['broj_brzina'] = izvuci(df['Gearbox'], r'(\d+)-speed')
df['brand'] = df['Model'].str.split().str[0]

# ociglene greske
df.loc[df['tezina_kg'] == 0, 'tezina_kg'] = np.nan
df.loc[df['sjediste_mm'] < 300, 'sjediste_mm'] = np.nan

# broj cilindara iz Engine type (tekstualno)
et = df['Engine type'].astype(str).str.lower()
cil = pd.Series(np.nan, index=df.index)
cil[et.str.contains('single')] = 1
cil[et.str.contains('twin|two cylinder|v2|boxer 2')] = 2
cil[et.str.contains('three|triple')] = 3
cil[et.str.contains('four cylinder|in-line four|v4|inline-4|four,|four ')] = 4
cil[et.str.contains('six|inline-6')] = 6
cil[et.str.contains('v8|eight')] = 8
df['cilindri'] = cil
df['dvotaktni'] = et.str.contains('two-stroke').astype(int)

# hladjenje pojednostavljeno
cool = df['Cooling system'].astype(str).str.lower()
df['hladjenje'] = np.where(cool.str.contains('liquid|water'), 'tecno',
                  np.where(cool.str.contains('oil'), 'uljno',
                  np.where(cool.str.contains('air'), 'zracno', 'nepoznato')))

# izvedena karakteristika
df['snaga_po_kg'] = df['snaga_hp'] / df['tezina_kg']

df.to_parquet(OUT + '/parsed.parquet')

NUM = ['rating','kubikaza_ccm','snaga_hp','moment_nm','tezina_kg','brzina_kmh',
       'rezervoar_l','sjediste_mm','meduosovinski_mm','broj_brzina','cilindri','snaga_po_kg']

rez = {
    'n_redova': int(len(df)), 'n_kolona_raw': 85,
    'godine': [int(df['Year'].min()), int(df['Year'].max())],
    'n_kategorija': int(df['Category'].nunique()),
    'n_brandova': int(df['brand'].nunique()),
    'kategorije_counts': df['Category'].value_counts().head(15).to_dict(),
    'popunjenost_kljucne': {k: round(100*(1-df[k].isna().mean()),1) for k in
        ['Displacement','Power','Torque','Dry weight','Top speed','Fuel capacity',
         'Seat height','Wheelbase','Gearbox','Cooling system','Rating']},
    'n_kolona_ispod5pct': int(((1-df[list(df.columns[:85])].isna().mean())*100 < 5).sum()),
    'deskriptivna': json.loads(df[NUM+['Year']].describe().round(2).to_json()),
    'skew': df[NUM].skew().round(2).to_dict(),
    'kurt': df[NUM].kurt().round(2).to_dict(),
    'rating_popunjen_pct': round(100*(1-df['rating'].isna().mean()),1),
    'top_brandovi': df['brand'].value_counts().head(10).to_dict(),
}
with open(OUT + '/rez_01.json','w') as f: json.dump(rez, f, indent=1, ensure_ascii=False)
print(json.dumps({k: rez[k] for k in ['n_redova','n_kategorija','n_brandova','rating_popunjen_pct','n_kolona_ispod5pct']}, ensure_ascii=False))
print('OK korak 1')
