# -*- coding: utf-8 -*-
"""Korak 11: Prosjecne vrijednosti po kategorijama + K-Means klasteriranje."""
import json
import numpy as np
import pandas as pd
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import adjusted_rand_score, normalized_mutual_info_score
sns.set_theme(style='whitegrid')

OUT = '/tmp/rad'
S = OUT + '/slike/'

df = pd.read_parquet(OUT + '/parsed.parquet')

# ---------------------------------------------------------------
# 1. PROSJECNE VRIJEDNOSTI PO SVIH 18 KATEGORIJA
# ---------------------------------------------------------------
varijable = ['kubikaza_ccm', 'snaga_hp', 'moment_nm', 'tezina_kg',
             'brzina_kmh', 'rezervoar_l', 'sjediste_mm', 'meduosovinski_mm']

nazivi = {
    'kubikaza_ccm': 'Kubikaza (ccm)',
    'snaga_hp': 'Snaga (HP)',
    'moment_nm': 'Moment (Nm)',
    'tezina_kg': 'Tezina (kg)',
    'brzina_kmh': 'Max brzina (km/h)',
    'rezervoar_l': 'Rezervoar (l)',
    'sjediste_mm': 'Sjediste (mm)',
    'meduosovinski_mm': 'Meduosovinski (mm)',
}

prosjeci = df.groupby('Category')[varijable].mean().round(1)
prosjeci = prosjeci.sort_values('kubikaza_ccm', ascending=False)
print("\n=== PROSJECNE VRIJEDNOSTI PO KATEGORIJAMA ===")
print(prosjeci.to_string())

# Heatmapa normalizovana po koloni (z-score)
prosjeci_z = prosjeci.copy()
for col in varijable:
    m, s = prosjeci[col].mean(), prosjeci[col].std()
    if s > 0:
        prosjeci_z[col] = (prosjeci[col] - m) / s

fig, ax = plt.subplots(figsize=(13, 9))
sns.heatmap(prosjeci_z.rename(columns=nazivi),
            annot=prosjeci.rename(columns=nazivi),
            fmt='.0f', cmap='RdYlGn', center=0,
            linewidths=0.4, linecolor='white',
            annot_kws={'size': 7}, ax=ax)
ax.set_title('Prosjecne vrijednosti kljucnih karakteristika po kategorijama motocikala\n'
             '(boja = relativna pozicija unutar varijable; broj = stvarna vrijednost)',
             fontsize=11)
ax.set_xlabel('')
ax.set_ylabel('')
plt.xticks(rotation=30, ha='right', fontsize=9)
plt.yticks(fontsize=8)
fig.tight_layout()
fig.savefig(S + 'k01_heatmapa_kategorije.png', dpi=130, bbox_inches='tight')
plt.close(fig)
print("Sacuvano k01_heatmapa_kategorije.png")

# Bar chart - kubikaza po kategorijama
fig, ax = plt.subplots(figsize=(12, 5))
boje = plt.cm.tab20(np.linspace(0, 1, len(prosjeci)))
prosjeci['kubikaza_ccm'].plot.bar(ax=ax, color=boje)
ax.set_title('Prosjecna radna zapremina (ccm) po kategorijama motocikala')
ax.set_ylabel('Kubikaza (ccm)')
ax.set_xlabel('')
plt.xticks(rotation=40, ha='right', fontsize=9)
for i, v in enumerate(prosjeci['kubikaza_ccm']):
    ax.text(i, v + 15, f'{v:.0f}', ha='center', fontsize=7)
fig.tight_layout()
fig.savefig(S + 'k02_kubikaza_kategorije.png', dpi=130, bbox_inches='tight')
plt.close(fig)

# Bar chart - snaga po kategorijama
fig, ax = plt.subplots(figsize=(12, 5))
prosjeci_snaga = prosjeci['snaga_hp'].dropna()
prosjeci_snaga.plot.bar(ax=ax, color='steelblue')
ax.set_title('Prosjecna snaga (HP) po kategorijama motocikala')
ax.set_ylabel('Snaga (HP)')
ax.set_xlabel('')
plt.xticks(rotation=40, ha='right', fontsize=9)
for i, v in enumerate(prosjeci_snaga):
    ax.text(i, v + 0.5, f'{v:.0f}', ha='center', fontsize=7)
fig.tight_layout()
fig.savefig(S + 'k03_snaga_kategorije.png', dpi=130, bbox_inches='tight')
plt.close(fig)

# ---------------------------------------------------------------
# 2. K-MEANS KLASTERIRANJE
# ---------------------------------------------------------------
# Koristimo iste varijable kao u modelu (bez one-hot, bez izvedenih)
klaster_vars = ['kubikaza_ccm', 'snaga_hp', 'moment_nm', 'tezina_kg',
                'brzina_kmh', 'rezervoar_l', 'sjediste_mm', 'meduosovinski_mm',
                'broj_brzina', 'cilindri']

df_k = df[klaster_vars + ['Category']].dropna(subset=['Category'])
# Imputacija medijanom za klasteriranje
for col in klaster_vars:
    df_k[col] = df_k[col].fillna(df_k[col].median())

X = df_k[klaster_vars].values
y_true = df_k['Category'].values

scaler = StandardScaler()
X_sc = scaler.fit_transform(X)

# K-Means s k=18 (broj stvarnih kategorija)
kmeans18 = KMeans(n_clusters=18, random_state=42, n_init=20, max_iter=500)
y_km18 = kmeans18.fit_predict(X_sc)

ari18 = adjusted_rand_score(y_true, y_km18)
nmi18 = normalized_mutual_info_score(y_true, y_km18)
print(f"\nK-Means k=18: ARI={ari18:.4f}, NMI={nmi18:.4f}")

# K-Means s k=6 (manji broj - grupisanje po "duhovima")
kmeans6 = KMeans(n_clusters=6, random_state=42, n_init=20, max_iter=500)
y_km6 = kmeans6.fit_predict(X_sc)
ari6 = adjusted_rand_score(y_true, y_km6)
nmi6 = normalized_mutual_info_score(y_true, y_km6)
print(f"K-Means k=6:  ARI={ari6:.4f}, NMI={nmi6:.4f}")

# Elbow metoda (SSE za k=2..20)
sse = []
K_range = range(2, 21)
for k in K_range:
    km = KMeans(n_clusters=k, random_state=42, n_init=10, max_iter=300)
    km.fit(X_sc)
    sse.append(km.inertia_)

fig, ax = plt.subplots(figsize=(9, 4.5))
ax.plot(list(K_range), sse, 'o-', color='steelblue', lw=2)
ax.axvline(x=18, color='red', linestyle='--', lw=1.5, label='k=18 (broj stvarnih kategorija)')
ax.axvline(x=6, color='orange', linestyle='--', lw=1.5, label='k=6 (lakat)')
ax.set_xlabel('Broj klastera (k)')
ax.set_ylabel('SSE (suma kvadratnih gresaka)')
ax.set_title('Elbow metoda — optimalan broj klastera')
ax.legend()
fig.tight_layout()
fig.savefig(S + 'k04_elbow.png', dpi=130, bbox_inches='tight')
plt.close(fig)

# PCA vizualizacija - k=18
pca = PCA(n_components=2, random_state=42)
X_pca = pca.fit_transform(X_sc)
var_exp = pca.explained_variance_ratio_
print(f"PCA varijansa: PC1={var_exp[0]:.3f}, PC2={var_exp[1]:.3f}, ukupno={sum(var_exp):.3f}")

# PCA scatter - prave kategorije
kategorije_sve = sorted(df_k['Category'].unique())
palette = plt.cm.tab20(np.linspace(0, 1, len(kategorije_sve)))
kat_boja = {k: palette[i] for i, k in enumerate(kategorije_sve)}

fig, axes = plt.subplots(1, 2, figsize=(15, 6))

# Lijevo: prave kategorije
for kat in kategorije_sve:
    mask = y_true == kat
    axes[0].scatter(X_pca[mask, 0], X_pca[mask, 1],
                    c=[kat_boja[kat]], label=kat, s=4, alpha=0.5)
axes[0].set_title(f'PCA — stvarne kategorije (18)\n'
                  f'PC1={var_exp[0]*100:.1f}%, PC2={var_exp[1]*100:.1f}%')
axes[0].set_xlabel('PC1'); axes[0].set_ylabel('PC2')
axes[0].legend(fontsize=5, markerscale=3, loc='upper right',
               ncol=2, framealpha=0.7)

# Desno: K-Means k=18 klasteri
boje_km = plt.cm.tab20(np.linspace(0, 1, 18))
for ki in range(18):
    mask = y_km18 == ki
    axes[1].scatter(X_pca[mask, 0], X_pca[mask, 1],
                    c=[boje_km[ki]], label=f'Klaster {ki+1}', s=4, alpha=0.5)
axes[1].set_title(f'PCA — K-Means klasteri (k=18)\nARI={ari18:.3f}, NMI={nmi18:.3f}')
axes[1].set_xlabel('PC1'); axes[1].set_ylabel('PC2')
axes[1].legend(fontsize=5, markerscale=3, loc='upper right',
               ncol=2, framealpha=0.7)

fig.tight_layout()
fig.savefig(S + 'k05_pca_scatter.png', dpi=130, bbox_inches='tight')
plt.close(fig)

# PCA scatter k=6
fig, axes = plt.subplots(1, 2, figsize=(15, 6))
boje_km6 = plt.cm.Set1(np.linspace(0, 1, 6))

for kat in kategorije_sve:
    mask = y_true == kat
    axes[0].scatter(X_pca[mask, 0], X_pca[mask, 1],
                    c=[kat_boja[kat]], label=kat, s=4, alpha=0.5)
axes[0].set_title('PCA — stvarne kategorije (18)')
axes[0].set_xlabel('PC1'); axes[0].set_ylabel('PC2')
axes[0].legend(fontsize=5, markerscale=3, loc='upper right', ncol=2, framealpha=0.7)

for ki in range(6):
    mask = y_km6 == ki
    axes[1].scatter(X_pca[mask, 0], X_pca[mask, 1],
                    c=[boje_km6[ki]], label=f'Klaster {ki+1}', s=6, alpha=0.6)
axes[1].set_title(f'PCA — K-Means klasteri (k=6)\nARI={ari6:.3f}, NMI={nmi6:.3f}')
axes[1].set_xlabel('PC1'); axes[1].set_ylabel('PC2')
axes[1].legend(fontsize=8, markerscale=3, loc='upper right', framealpha=0.7)

fig.tight_layout()
fig.savefig(S + 'k06_pca_k6.png', dpi=130, bbox_inches='tight')
plt.close(fig)

# Prosjecne vrijednosti po klasterima k=6 (interpretacija)
df_k2 = df_k.copy()
df_k2['klaster'] = y_km6
klaster_prosjeci = df_k2.groupby('klaster')[klaster_vars].mean().round(1)
print("\n=== PROSJECI PO K-MEANS KLASTERIMA (k=6) ===")
print(klaster_prosjeci.to_string())

# Koja kategorija dominira u kom klasteru
kat_klaster = pd.crosstab(df_k2['Category'], df_k2['klaster'])
kat_klaster_pct = kat_klaster.div(kat_klaster.sum(axis=0), axis=1).round(3) * 100
print("\n=== RASPODJELA KATEGORIJA PO KLASTERIMA (%) ===")
print(kat_klaster_pct.to_string())

# Sacuvaj rezultate
rez = {
    'prosjeci_kategorije': prosjeci.to_dict(),
    'kmeans18': {'ari': round(ari18, 4), 'nmi': round(nmi18, 4)},
    'kmeans6': {'ari': round(ari6, 4), 'nmi': round(nmi6, 4)},
    'pca_var_exp': [round(float(v), 4) for v in var_exp],
    'klaster_prosjeci_k6': klaster_prosjeci.to_dict(),
    'kat_klaster_pct': kat_klaster_pct.to_dict(),
}
with open(OUT + '/rez_11.json', 'w', encoding='utf-8') as f:
    json.dump(rez, f, indent=1, ensure_ascii=False)

print("\nOK korak 11")
