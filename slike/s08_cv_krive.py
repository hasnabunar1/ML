# -*- coding: utf-8 -*-
"""Korak 8: 5-fold cross-validacija (4 algoritma) + krivulja učenja RF."""
import json
import numpy as np, pandas as pd
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.model_selection import cross_val_score, learning_curve
sns.set_theme(style='whitegrid')

OUT = '/tmp/rad'; S = OUT + '/slike/'
X_tr = pd.read_parquet(OUT+'/X_tr.parquet'); y_tr = pd.read_parquet(OUT+'/y_tr.parquet')['y']

modeli = {
 'Logistička regresija': make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000, random_state=42)),
 'KNN (k=10)': make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=10)),
 'Random Forest': RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=2),
 'Gradient Boosting': HistGradientBoostingClassifier(random_state=42),
}
cv_rez = {}
for ime, mdl in modeli.items():
    sc = cross_val_score(mdl, X_tr, y_tr, cv=5, scoring='f1_weighted', n_jobs=2)
    cv_rez[ime] = {'mean': round(float(sc.mean()),4), 'std': round(float(sc.std()),4)}
    print(ime, cv_rez[ime])

fig, ax = plt.subplots(figsize=(8, 4.5))
imena = list(cv_rez); m = [cv_rez[i]['mean'] for i in imena]; s = [cv_rez[i]['std'] for i in imena]
ax.bar(imena, m, yerr=[v*2 for v in s], capsize=6, color='steelblue')
ax.set_ylim(0.4, 0.85); ax.set_ylabel('F1 (weighted)'); ax.tick_params(axis='x', rotation=15)
ax.set_title('5-fold cross-validacija — F1 s intervalima pouzdanosti (±2 std)')
for i, v in enumerate(m): ax.text(i, v+0.015, f'{v:.3f}', ha='center', fontsize=9)
fig.tight_layout(); fig.savefig(S+'s17_cv.png', dpi=130, bbox_inches='tight'); plt.close(fig)

# krivulja ucenja RF
sizes, tr_sc, va_sc = learning_curve(
    RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=2),
    X_tr, y_tr, train_sizes=[0.1, 0.25, 0.5, 0.75, 1.0], cv=3, scoring='f1_weighted', n_jobs=2)
fig, ax = plt.subplots(figsize=(8, 4.5))
ax.plot(sizes, tr_sc.mean(1), 'o-', color='steelblue', label='Trening F1')
ax.plot(sizes, va_sc.mean(1), 'o-', color='darkorange', label='Validacijski F1 (3-fold)')
ax.fill_between(sizes, va_sc.mean(1)-va_sc.std(1), va_sc.mean(1)+va_sc.std(1), alpha=.2, color='darkorange')
ax.set_xlabel('Veličina trening skupa'); ax.set_ylabel('F1 (weighted)'); ax.legend()
ax.set_title('Random Forest — krivulje učenja')
fig.tight_layout(); fig.savefig(S+'s18_krivulja_ucenja.png', dpi=130, bbox_inches='tight'); plt.close(fig)

rez = {'cv': cv_rez, 'lc_sizes': sizes.tolist(),
       'lc_tr': tr_sc.mean(1).round(4).tolist(), 'lc_va': va_sc.mean(1).round(4).tolist()}
with open(OUT+'/rez_08.json','w') as f: json.dump(rez, f, indent=1, ensure_ascii=False)
print('OK korak 8')
