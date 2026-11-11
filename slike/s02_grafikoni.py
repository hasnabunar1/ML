# -*- coding: utf-8 -*-
"""Korak 2: deskriptivni grafikoni."""
import numpy as np, pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
sns.set_theme(style='whitegrid', font_scale=1.0)

OUT = '/tmp/rad'; S = OUT + '/slike/'
df = pd.read_parquet(OUT + '/parsed.parquet')
NUM = ['rating','kubikaza_ccm','snaga_hp','moment_nm','tezina_kg','brzina_kmh',
       'rezervoar_l','sjediste_mm','meduosovinski_mm','broj_brzina','cilindri','snaga_po_kg']

def spasi(fig, ime):
    fig.tight_layout(); fig.savefig(S + ime, dpi=130, bbox_inches='tight'); plt.close(fig)

# S1: popunjenost svih raw kolona
pop = ((1 - df[df.columns[:85]].isna().mean()) * 100).sort_values()
fig, ax = plt.subplots(figsize=(8, 13))
boje = ['firebrick' if v < 5 else 'steelblue' for v in pop.values]
ax.barh(pop.index, pop.values, color=boje)
ax.set_xlabel('% popunjenosti'); ax.set_title('Popunjenost kolona (crveno: <5%)')
ax.tick_params(axis='y', labelsize=6)
spasi(fig, 's01_popunjenost.png')

# S2: kategorije
fig, ax = plt.subplots(figsize=(8, 5.5))
df['Category'].value_counts().sort_values().plot.barh(ax=ax, color='steelblue')
ax.set_xlabel('broj modela'); ax.set_title('Zastupljenost kategorija motocikala')
spasi(fig, 's02_kategorije.png')

# S3: top brandovi
fig, ax = plt.subplots(figsize=(8, 5))
df['brand'].value_counts().head(20).sort_values().plot.barh(ax=ax, color='darkorange')
ax.set_xlabel('broj modela'); ax.set_title('Top 20 proizvođača po broju modela')
spasi(fig, 's03_brandovi.png')

# S4: histogrami
fig, axes = plt.subplots(3, 4, figsize=(14, 9))
for ax, k in zip(axes.flat, NUM):
    df[k].dropna().hist(bins=40, ax=ax, color='steelblue'); ax.set_title(k, fontsize=10)
fig.suptitle('Histogrami numeričkih karakteristika', y=1.0)
spasi(fig, 's04_histogrami.png')

# S5: skewness i kurtosis
sk = df[NUM].skew(); ku = df[NUM].kurt()
fig, axes = plt.subplots(1, 2, figsize=(13, 4.5))
sk.sort_values().plot.barh(ax=axes[0], color=['firebrick' if abs(v)>1 else 'steelblue' for v in sk.sort_values()])
axes[0].axvline(1, ls='--', c='gray'); axes[0].axvline(-1, ls='--', c='gray')
axes[0].set_title('Skewness (asimetrija); crveno: |skew|>1')
ku.sort_values().plot.barh(ax=axes[1], color='seagreen')
axes[1].axvline(3, ls='--', c='gray'); axes[1].set_title('Kurtosis (spljoštenost); linija = normalna raspodjela')
spasi(fig, 's05_skew_kurt.png')

# S6: trendovi po decenijama
df['dec'] = (df['Year']//10*10).astype(int)
t = df[df['dec']>=1950].groupby('dec').agg(n=('Model','count'), hp=('snaga_hp','mean'))
fig, axes = plt.subplots(1, 2, figsize=(13, 4))
axes[0].bar(t.index.astype(str), t['n'], color='steelblue'); axes[0].set_title('Broj modela po deceniji')
axes[1].plot(t.index.astype(str), t['hp'], marker='o', color='darkorange'); axes[1].set_title('Prosječna snaga (HP) po deceniji')
spasi(fig, 's06_decenije.png')

# S7: rating po kategoriji
o = df.groupby('Category')['rating'].agg(['mean','count'])
o = o[o['count']>=100].sort_values('mean')
fig, ax = plt.subplots(figsize=(8, 5.5))
o['mean'].plot.barh(ax=ax, color='seagreen'); ax.set_xlim(3.0, 3.9)
ax.set_xlabel('prosječan rating'); ax.set_title('Prosječna ocjena po kategoriji (min. 100 modela)')
spasi(fig, 's07_rating_kat.png')

# S8: boxplotovi (outlieri)
fig, axes = plt.subplots(3, 4, figsize=(14, 9))
for ax, k in zip(axes.flat, NUM):
    ax.boxplot(df[k].dropna(), vert=True, flierprops=dict(marker='.', markersize=3, color='darkorange'))
    ax.set_title(k, fontsize=10); ax.set_xticks([])
fig.suptitle('Boxplotovi — IQR detekcija outliera', y=1.0)
spasi(fig, 's08_boxplotovi.png')

print('OK korak 2 — slike:', len(list(__import__("os").listdir(S))))
