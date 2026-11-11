# -*- coding: utf-8 -*-
"""Korak 3: ispravna korelacijska analiza + outlieri (IQR)."""
import json
import numpy as np, pandas as pd
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.feature_selection import f_classif, mutual_info_classif
sns.set_theme(style='whitegrid')

OUT = '/tmp/rad'; S = OUT + '/slike/'
df = pd.read_parquet(OUT + '/parsed.parquet')
NUM = ['kubikaza_ccm','snaga_hp','moment_nm','tezina_kg','brzina_kmh',
       'rezervoar_l','sjediste_mm','meduosovinski_mm','broj_brzina','cilindri','snaga_po_kg','Year']

def spasi(fig, ime):
    fig.tight_layout(); fig.savefig(S + ime, dpi=130, bbox_inches='tight'); plt.close(fig)

# --- 3.1 povezanost karakteristika s ciljnom varijablom (Category) ---
# Ciljna varijabla je KATEGORIJSKA -> Pearson nije primjeren; koristimo ANOVA F-test + mutual information
sub = df[NUM + ['Category']].copy()
for k in NUM:  # privremena imputacija medijanom samo za ovu analizu
    sub[k] = sub[k].fillna(sub[k].median())
X = sub[NUM].values; y = sub['Category'].values
F, p = f_classif(X, y)
mi = mutual_info_classif(X, y, random_state=42, n_neighbors=5)
tab = pd.DataFrame({'karakteristika': NUM, 'ANOVA_F': F.round(1), 'p_vrijednost': p,
                    'mutual_info': mi.round(3)}).sort_values('ANOVA_F', ascending=False)
tab.to_csv(OUT + '/tab_anova.csv', index=False)

fig, axes = plt.subplots(1, 2, figsize=(13, 4.8))
t1 = tab.sort_values('ANOVA_F')
axes[0].barh(t1['karakteristika'], t1['ANOVA_F'], color='steelblue')
axes[0].set_title('ANOVA F-statistika (veza karakteristike s kategorijom)')
t2 = tab.sort_values('mutual_info')
axes[1].barh(t2['karakteristika'], t2['mutual_info'], color='darkorange')
axes[1].set_title('Mutual information s ciljnom varijablom')
spasi(fig, 's09_anova_mi.png')

# --- 3.2 Pearsonova matrica medju numerickim karakteristikama ---
kor = df[NUM].corr()
fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(kor, annot=True, fmt='.2f', cmap='coolwarm', center=0, ax=ax, annot_kws={'size':8})
ax.set_title('Pearsonova korelacijska matrica numeričkih karakteristika')
spasi(fig, 's10_pearson.png')

parovi = []
for i in range(len(NUM)):
    for j in range(i+1, len(NUM)):
        r = kor.iloc[i, j]
        if abs(r) > 0.80: parovi.append([NUM[i], NUM[j], round(float(r), 2)])

# --- 3.4 outlieri IQR ---
outl = []
for k in NUM[:-1]:
    s = df[k].dropna()
    q1, q3 = s.quantile([.25, .75]); iqr = q3 - q1
    lo, hi = q1 - 1.5*iqr, q3 + 1.5*iqr
    n = int(((s < lo) | (s > hi)).sum())
    outl.append([k, round(float(lo),1), round(float(hi),1), n, round(100*n/len(s),1)])
outl_df = pd.DataFrame(outl, columns=['karakteristika','donja','gornja','broj','pct'])
outl_df.to_csv(OUT + '/tab_outlieri.csv', index=False)

ekstremi = df.nlargest(5, 'snaga_hp')[['Model','Year','Category','snaga_hp','kubikaza_ccm']].to_dict('records')

rez = {'anova_top': tab.head(6).to_dict('records'),
       'anova_dno': tab.tail(3).to_dict('records'),
       'parovi_kolinearni': parovi,
       'outlieri': outl_df.to_dict('records'),
       'ekstremi_snaga': ekstremi}
with open(OUT + '/rez_03.json','w') as f: json.dump(rez, f, indent=1, ensure_ascii=False, default=str)
print(tab.to_string(index=False))
print('kolinearni parovi:', parovi)
print('OK korak 3')
