# -*- coding: utf-8 -*-
"""
Korak 17: K-medoids i K-modes klasteriranje
  - K-medoids (PAM): koristi stvarne podatke kao centre, robustan na ekstreme (kao medijan)
  - K-modes: koristi mod, radi s kategorijskim podacima
  - Usporedba svih 4 metoda: K-Means, K-Prototypes, K-medoids, K-modes
"""
import json, warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import (adjusted_rand_score, silhouette_score,
                             davies_bouldin_score, calinski_harabasz_score)
from kmodes.kmodes import KModes
sns.set_theme(style='whitegrid')

OUT = '/tmp/rad'; S = OUT + '/slike/'

df = pd.read_parquet(OUT + '/parsed_v3.parquet')

num_vars = ['kubikaza_ccm','snaga_hp','moment_nm','tezina_kg',
            'brzina_kmh','rezervoar_l','sjediste_mm','meduosovinski_mm',
            'broj_brzina','cilindri']

df2 = df[num_vars + ['Category','dvotaktni','hladjenje']].dropna(subset=['Category']).copy()
for col in num_vars:
    df2[col] = df2[col].fillna(df2[col].median())
df2['dvotaktni'] = df2['dvotaktni'].fillna(0).astype(int)
df2['hladjenje'] = df2['hladjenje'].fillna('Unknown').astype(str)

# Uzorak za brzinu
df_s = df2.sample(n=3000, random_state=42)
y_true = df_s['Category'].values
scaler = StandardScaler()
X_sc = scaler.fit_transform(df_s[num_vars].values)

print(f"Uzorak: {len(df_s)} redova")

# -------------------------------------------------------
# 1. K-MEDOIDS (PAM) — implementacija
# -------------------------------------------------------
print("\n--- K-Medoids (PAM, k=6) ---")
print("K-medoids ne racuna prosjek — bira stvarni motor iz dataseta kao centar klastera.")
print("Ovo ga cini robusnim na ekstreme, slicno kao sto je medijan robustan na ekstreme.")

def kmedoids(X, k, max_iter=100, random_state=42):
    """Jednostavna PAM implementacija."""
    np.random.seed(random_state)
    n = len(X)
    # Inicijalizacija: nasumicni medoidi
    medoid_idx = np.random.choice(n, k, replace=False)

    for _ in range(max_iter):
        # Dodijeli svaki tacku najblizem medoidu
        dists = np.array([[np.linalg.norm(X[i] - X[m]) for m in medoid_idx] for i in range(n)])
        labels = np.argmin(dists, axis=1)

        # Azuriraj medoide: za svaki klaster, pronadji tacku s minimalnom ukupnom udaljenoscu
        new_medoids = medoid_idx.copy()
        for ki in range(k):
            cluster_mask = labels == ki
            if cluster_mask.sum() == 0:
                continue
            cluster_idx = np.where(cluster_mask)[0]
            # Sumarna udaljenost od svake tacke do svih ostalih u klasteru
            sub = X[cluster_mask]
            intra_dists = np.sum(np.linalg.norm(sub[:, None] - sub[None, :], axis=2), axis=1)
            new_medoids[ki] = cluster_idx[np.argmin(intra_dists)]

        if np.all(new_medoids == medoid_idx):
            break
        medoid_idx = new_medoids

    return labels, medoid_idx

# Manji uzorak za K-medoids jer je O(n²)
df_km = df_s.sample(n=800, random_state=42)
X_km = scaler.transform(df_km[num_vars].values)
y_true_km = df_km['Category'].values

labels_kmed, medoids = kmedoids(X_km, k=6, random_state=42)
sil_kmed = silhouette_score(X_km, labels_kmed)
db_kmed  = davies_bouldin_score(X_km, labels_kmed)
ch_kmed  = calinski_harabasz_score(X_km, labels_kmed)
ari_kmed = adjusted_rand_score(y_true_km, labels_kmed)
print(f"K-medoids k=6: Sil={sil_kmed:.4f}, DB={db_kmed:.4f}, CH={ch_kmed:.1f}, ARI={ari_kmed:.4f}")

# Prikaz medoida — koji su to stvarni motori?
print("\nMedoidi (stvarni motori koji su centri klastera):")
df_km2 = df_km.reset_index(drop=True)
for ki, mid in enumerate(medoids):
    row = df_km2.iloc[mid]
    kat = row['Category'] if 'Category' in row else '?'
    print(f"  Klaster {ki+1}: {df.iloc[0]['Model'] if False else ''} "
          f"kubikaza={row['kubikaza_ccm']:.0f}ccm, snaga={row['snaga_hp']:.0f}HP, "
          f"tezina={row['tezina_kg']:.0f}kg | kategorija: {kat}")

# -------------------------------------------------------
# 2. K-MODES — koristi MOD za kategorijske podatke
# -------------------------------------------------------
print("\n--- K-Modes (k=6) ---")
print("K-modes radi SAMO s kategorijskim podacima.")
print("Umjesto srednje vrijednosti, koristi MOD (najcescu vrijednost) u klasteru.")

# Kategorizacija numeričkih varijabli u bins za K-modes
df_km3 = df_s.copy()
df_km3['kub_bin'] = pd.cut(df_km3['kubikaza_ccm'],
    bins=[0,125,300,600,1000,10000],
    labels=['micro','mali','srednji','veliki','ekstrem'])
df_km3['snaga_bin'] = pd.cut(df_km3['snaga_hp'],
    bins=[0,20,50,100,200,1000],
    labels=['slaba','niska','srednja','visoka','ekstremna'])
df_km3['tezina_bin'] = pd.cut(df_km3['tezina_kg'],
    bins=[0,80,130,180,300,1000],
    labels=['lagan','normalan','tezak','veoma_tezak','ekstrem'])
df_km3['brzina_bin'] = pd.cut(df_km3['brzina_kmh'],
    bins=[0,80,130,180,250,700],
    labels=['spor','umjeren','brz','veoma_brz','superbrz'])

# Popuni NaN u bin kolonama
for c in ['kub_bin','snaga_bin','tezina_bin','brzina_bin']:
    df_km3[c] = df_km3[c].cat.add_categories('nepoznato').fillna('nepoznato')

cat_cols = ['kub_bin','snaga_bin','tezina_bin','brzina_bin','hladjenje','dvotaktni']
X_modes = df_km3[cat_cols].astype(str).values

km6_modes = KModes(n_clusters=6, init='Huang', n_init=3, random_state=42)
y_modes = km6_modes.fit_predict(X_modes)
y_true_modes = df_km3['Category'].values

ari_modes = adjusted_rand_score(y_true_modes, y_modes)
# Za silhouette trebamo numericki prostor — koristimo originalni X_sc za isti uzorak
sil_modes = silhouette_score(X_sc[:len(df_km3)], y_modes)
db_modes  = davies_bouldin_score(X_sc[:len(df_km3)], y_modes)
ch_modes  = calinski_harabasz_score(X_sc[:len(df_km3)], y_modes)
print(f"K-modes k=6:  Sil={sil_modes:.4f}, DB={db_modes:.4f}, CH={ch_modes:.1f}, ARI={ari_modes:.4f}")

# Modovi klastera (sta je "tipicno" u svakom klasteru)
print("\nModi klastera (najcesca vrijednost u svakom klasteru):")
for ki in range(6):
    print(f"  Klaster {ki+1}: {dict(zip(cat_cols, km6_modes.cluster_centroids_[ki]))}")

# -------------------------------------------------------
# 3. K-MEANS za usporedbu (isti uzorak)
# -------------------------------------------------------
km6 = KMeans(n_clusters=6, random_state=42, n_init=10)
y_km = km6.fit_predict(X_sc)
sil_km  = silhouette_score(X_sc, y_km)
db_km   = davies_bouldin_score(X_sc, y_km)
ch_km   = calinski_harabasz_score(X_sc, y_km)
ari_km  = adjusted_rand_score(y_true, y_km)

# -------------------------------------------------------
# 4. USPOREDNA VIZUALIZACIJA
# -------------------------------------------------------
pca = PCA(n_components=2, random_state=42)
X_pca = pca.fit_transform(X_sc)
var_exp = pca.explained_variance_ratio_
boje6 = plt.cm.Set1(np.linspace(0,1,6))

# PCA za K-modes (isti redosljed uzorka)
X_pca_modes = X_pca[:len(df_km3)]

fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# K-Means
for ki in range(6):
    m = y_km==ki
    axes[0].scatter(X_pca[m,0],X_pca[m,1],c=[boje6[ki]],label=f'K{ki+1}',s=5,alpha=0.6)
axes[0].set_title(f'K-Means (k=6)\nSil={sil_km:.3f} | DB={db_km:.3f} | ARI={ari_km:.3f}')
axes[0].set_xlabel(f'PC1 ({var_exp[0]*100:.1f}%)'); axes[0].set_ylabel(f'PC2 ({var_exp[1]*100:.1f}%)')
axes[0].legend(fontsize=8, markerscale=2)

# K-medoids (manji uzorak)
X_pca_kmed = pca.transform(X_km)
for ki in range(6):
    m = labels_kmed==ki
    axes[1].scatter(X_pca_kmed[m,0],X_pca_kmed[m,1],c=[boje6[ki]],label=f'K{ki+1}',s=8,alpha=0.6)
# Oznaci medoide
for ki, mid in enumerate(medoids):
    axes[1].scatter(X_pca_kmed[mid,0],X_pca_kmed[mid,1],
                   c='black',marker='*',s=200,zorder=5)
axes[1].set_title(f'K-Medoids / PAM (k=6)\nSil={sil_kmed:.3f} | DB={db_kmed:.3f} | ARI={ari_kmed:.3f}\n★ = medoid (stvarni motor)')
axes[1].set_xlabel(f'PC1'); axes[1].legend(fontsize=8, markerscale=2)

# K-modes
for ki in range(6):
    m = y_modes==ki
    axes[2].scatter(X_pca_modes[m,0],X_pca_modes[m,1],c=[boje6[ki]],label=f'K{ki+1}',s=5,alpha=0.6)
axes[2].set_title(f'K-Modes (k=6)\nSil={sil_modes:.3f} | DB={db_modes:.3f} | ARI={ari_modes:.3f}')
axes[2].set_xlabel(f'PC1'); axes[2].legend(fontsize=8, markerscale=2)

fig.suptitle('Usporedba K-Means, K-Medoids i K-Modes klasteriranja (PCA prikaz)', fontsize=12)
fig.tight_layout()
fig.savefig(S+'k09_kmedoids_kmodes.png', dpi=130, bbox_inches='tight')
plt.close(fig)
print("\nSacuvano k09_kmedoids_kmodes.png")

# -------------------------------------------------------
# 5. FINALNA USPOREDNA TABELA SVIH METODA
# -------------------------------------------------------
print("\n=== FINALNA USPOREDBA SVIH METODA ===")
tabela = [
    ['K-Means',      round(sil_km,3),   round(db_km,3),   round(ch_km,1),   round(ari_km,3),   'Numericki',     'Prosjek (mean)'],
    ['K-Medoids',    round(sil_kmed,3), round(db_kmed,3), round(ch_kmed,1), round(ari_kmed,3), 'Numericki',     'Medoid (stvarni motor)'],
    ['K-Modes',      round(sil_modes,3),round(db_modes,3),round(ch_modes,1),round(ari_modes,3),'Kategorijski',  'Mod (najcesca vrijednost)'],
]
for r in tabela:
    print(f"  {r[0]:15} Sil={r[1]:.3f} DB={r[2]:.3f} CH={r[3]:7.1f} ARI={r[4]:.3f} | {r[5]:15} centar={r[6]}")

rez = {
    'kmeans_k6':  {'sil':round(sil_km,4),'db':round(db_km,4),'ch':round(ch_km,1),'ari':round(ari_km,4)},
    'kmedoids_k6':{'sil':round(sil_kmed,4),'db':round(db_kmed,4),'ch':round(ch_kmed,1),'ari':round(ari_kmed,4)},
    'kmodes_k6':  {'sil':round(sil_modes,4),'db':round(db_modes,4),'ch':round(ch_modes,1),'ari':round(ari_modes,4)},
}
with open(OUT+'/rez_17.json','w') as f: json.dump(rez,f,indent=1)
print("OK korak 17")
