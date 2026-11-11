# -*- coding: utf-8 -*-
"""Korak 4: priprema podataka za modeliranje (bez curenja podataka)."""
import json
import numpy as np, pandas as pd
from sklearn.model_selection import train_test_split

OUT = '/tmp/rad'
df = pd.read_parquet(OUT + '/parsed.parquet')

# Ciljna varijabla: kategorije s >= 1000 primjeraka (bez 'Unspecified category')
vc = df['Category'].value_counts()
klase = [k for k in vc[vc >= 1000].index if k != 'Unspecified category']
m = df[df['Category'].isin(klase)].copy()

FEAT_NUM = ['kubikaza_ccm','snaga_hp','moment_nm','tezina_kg','brzina_kmh','rezervoar_l',
            'sjediste_mm','meduosovinski_mm','broj_brzina','cilindri','snaga_po_kg','Year']
m['dvotaktni'] = m['dvotaktni'].astype(float)
hl = pd.get_dummies(m['hladjenje'], prefix='hladjenje').astype(float)
X = pd.concat([m[FEAT_NUM + ['dvotaktni']], hl], axis=1)
y = m['Category']

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Imputacija: GLOBALNI MEDIJAN IZ TRENING SKUPA.
# Napomena (curenje podataka): u deskriptivnoj fazi imputirali smo medijanom po kategoriji,
# ali ovdje je kategorija CILJNA varijabla -> imputacija po kategoriji bi bila leakage.
medijani = X_tr[FEAT_NUM].median()
X_tr[FEAT_NUM] = X_tr[FEAT_NUM].fillna(medijani)
X_te[FEAT_NUM] = X_te[FEAT_NUM].fillna(medijani)

X_tr.to_parquet(OUT + '/X_tr.parquet'); X_te.to_parquet(OUT + '/X_te.parquet')
y_tr.to_frame('y').to_parquet(OUT + '/y_tr.parquet'); y_te.to_frame('y').to_parquet(OUT + '/y_te.parquet')

rez = {'klase': klase, 'n_klasa': len(klase), 'n_ukupno': int(len(m)),
       'pct_zadrzano': round(100*len(m)/len(df),1), 'n_feat': int(X.shape[1]),
       'featovi': list(X.columns), 'n_train': int(len(X_tr)), 'n_test': int(len(X_te)),
       'missing_pct_prije': {k: round(100*m[k].isna().mean(),1) for k in FEAT_NUM}}
with open(OUT + '/rez_04.json','w') as f: json.dump(rez, f, indent=1, ensure_ascii=False)
print(json.dumps({k: rez[k] for k in ['n_klasa','n_ukupno','pct_zadrzano','n_feat','n_train','n_test']}))
print('OK korak 4')
