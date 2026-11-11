# -*- coding: utf-8 -*-
"""Korak 15: Napredno klasteriranje + evaluacijske metrike."""
import json, warnings; warnings.filterwarnings('ignore')
import numpy as np, pandas as pd
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import (adjusted_rand_score, normalized_mutual_info_score,
                             silhouette_score, davies_bouldin_score,
                             calinski_harabasz_score)
from kmodes.kprototypes import KPrototypes
sns.set_theme(style='whitegrid')

OUT = '/tmp/rad'; S = OUT + '/slike/'
df = pd.read_parquet(OUT + '/parsed_v3.parquet')

num_vars = ['kubikaza_ccm','snaga_hp','moment_nm','tezina_kg',
            'brzina_kmh','rezervoar_l','sjediste_mm','meduosovinski_mm',
            'broj_brzina','cilindri']

df2 = df[num_vars + ['Category','dvotaktni']].dropna(subset=['Category']).copy()
for col in num_vars:
    df2[col] = df2[col].fillna(df2[col].median())
df2['dvotaktni'] = df2['dvotaktni'].fillna(0).astype(float)

# Uzorak 5000 za brzinu
df_s = df2.sample(n=5000, random_state=42)
y_true = df_s['Category'].values
X_sc = StandardScaler().fit_transform(df_s[num_vars].values)
print(f"Uzorak: {len(df_s)} redova")

# --- K-Means k=6 ---
km6 = KMeans(n_clusters=6, random_state=42, n_init=10)
y_km6 = km6.fit_predict(X_sc)
sil_km = silhouette_score(X_sc, y_km6)
db_km  = davies_bouldin_score(X_sc, y_km6)
ch_km  = calinski_harabasz_score(X_sc, y_km6)
ari_km = adjusted_rand_score(y_true, y_km6)
nmi_km = normalized_mutual_info_score(y_true, y_km6)
print(f"K-Means k=6: Sil={sil_km:.4f}, DB={db_km:.4f}, CH={ch_km:.1f}, ARI={ari_km:.4f}")

# --- K-Prototypes k=6 (uzorak 2000) ---
df_kp = df2.sample(n=2000, random_state=42)
X_num_kp = StandardScaler().fit_transform(df_kp[num_vars].values)
X_cat_kp = df_kp[['dvotaktni']].astype(str).values
X_proto  = np.hstack([X_num_kp, X_cat_kp])
cat_idx  = [X_num_kp.shape[1]]
kp6 = KPrototypes(n_clusters=6, init='Cao', n_init=3, random_state=42)
y_kp6 = kp6.fit_predict(X_proto, categorical=cat_idx)
y_true_kp = df_kp['Category'].values
sil_kp = silhouette_score(X_num_kp, y_kp6)
db_kp  = davies_bouldin_score(X_num_kp, y_kp6)
ch_kp  = calinski_harabasz_score(X_num_kp, y_kp6)
ari_kp = adjusted_rand_score(y_true_kp, y_kp6)
nmi_kp = normalized_mutual_info_score(y_true_kp, y_kp6)
print(f"K-Protos k=6: Sil={sil_kp:.4f}, DB={db_kp:.4f}, CH={ch_kp:.1f}, ARI={ari_kp:.4f}")

# --- Metrike po k ---
sil_scores, db_scores, ch_scores = [], [], []
K_range = range(2, 12)
for k in K_range:
    km = KMeans(n_clusters=k, random_state=42, n_init=5)
    lbl = km.fit_predict(X_sc)
    sil_scores.append(silhouette_score(X_sc, lbl))
    db_scores.append(davies_bouldin_score(X_sc, lbl))
    ch_scores.append(calinski_harabasz_score(X_sc, lbl))
    print(f"  k={k}: sil={sil_scores[-1]:.3f}")

fig, axes = plt.subplots(1, 3, figsize=(15, 4.5))
for ax, sc, title, color, best in zip(
    axes,
    [sil_scores, db_scores, ch_scores],
    ['Silhouette (veci = bolji)', 'Davies-Bouldin (manji = bolji)', 'Calinski-Harabasz (veci = bolji)'],
    ['steelblue','darkorange','seagreen'],
    [max, min, max]):
    ax.plot(list(K_range), sc, 'o-', color=color, lw=2)
    opt = list(K_range)[sc.index(best(sc))]
    ax.axvline(x=opt, color='red', ls='--', lw=1.5, label=f'optimum k={opt}')
    ax.set_title(title, fontsize=10); ax.set_xlabel('k'); ax.legend()
fig.suptitle('Evaluacijske metrike kvaliteta klastera (K-Means, uzorak 5.000)', fontsize=11)
fig.tight_layout(); fig.savefig(S+'k07_metrike_kvaliteta.png', dpi=130, bbox_inches='tight'); plt.close(fig)
print("k07 sacuvano")

# --- PCA vizualizacija ---
pca = PCA(n_components=2, random_state=42)
X_pca = pca.fit_transform(X_sc)
var_exp = pca.explained_variance_ratio_
kategorije_sve = sorted(set(y_true))
pal = plt.cm.tab20(np.linspace(0,1,len(kategorije_sve)))
kat_boja = {k:pal[i] for i,k in enumerate(kategorije_sve)}
boje6 = plt.cm.Set1(np.linspace(0,1,6))

fig, axes = plt.subplots(1, 2, figsize=(14, 5))
for kat in kategorije_sve:
    m = y_true==kat
    axes[0].scatter(X_pca[m,0],X_pca[m,1],c=[kat_boja[kat]],label=kat,s=4,alpha=0.5)
axes[0].set_title(f'Stvarne kategorije (18)\nPC1={var_exp[0]*100:.1f}%, PC2={var_exp[1]*100:.1f}%')
axes[0].legend(fontsize=4, markerscale=3, ncol=2)
for ki in range(6):
    m = y_km6==ki
    axes[1].scatter(X_pca[m,0],X_pca[m,1],c=[boje6[ki]],label=f'K{ki+1}',s=4,alpha=0.5)
axes[1].set_title(f'K-Means k=6\nSil={sil_km:.3f}, DB={db_km:.3f}, ARI={ari_km:.3f}')
axes[1].legend(fontsize=8, markerscale=3)
fig.tight_layout(); fig.savefig(S+'k08_pca_usporedba.png', dpi=130, bbox_inches='tight'); plt.close(fig)
print("k08 sacuvano")

rez = {
    'kmeans_k6': {'sil':round(sil_km,4),'db':round(db_km,4),'ch':round(ch_km,1),'ari':round(ari_km,4),'nmi':round(nmi_km,4)},
    'kproto_k6': {'sil':round(sil_kp,4),'db':round(db_kp,4),'ch':round(ch_kp,1),'ari':round(ari_kp,4),'nmi':round(nmi_kp,4)},
    'sil_po_k': dict(zip([int(k) for k in K_range],[round(s,4) for s in sil_scores])),
    'db_po_k':  dict(zip([int(k) for k in K_range],[round(s,4) for s in db_scores])),
    'opt_k_sil': int(list(K_range)[sil_scores.index(max(sil_scores))]),
    'opt_k_db':  int(list(K_range)[db_scores.index(min(db_scores))]),
    'pca_var': [round(float(v),4) for v in var_exp],
}
with open(OUT+'/rez_15.json','w') as f: json.dump(rez,f,indent=1)
print("OK korak 15")
