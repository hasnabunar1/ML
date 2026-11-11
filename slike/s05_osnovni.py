# -*- coding: utf-8 -*-
"""Korak 5: osnovna komparacija 5 algoritama."""
import json, time
import numpy as np, pandas as pd
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score
sns.set_theme(style='whitegrid')

OUT = '/tmp/rad'; S = OUT + '/slike/'
X_tr = pd.read_parquet(OUT+'/X_tr.parquet'); X_te = pd.read_parquet(OUT+'/X_te.parquet')
y_tr = pd.read_parquet(OUT+'/y_tr.parquet')['y']; y_te = pd.read_parquet(OUT+'/y_te.parquet')['y']

modeli = {
 'Logistička regresija': make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000, random_state=42)),
 'KNN (k=10)': make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=10)),
 'Stablo odluke': DecisionTreeClassifier(max_depth=15, random_state=42),
 'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
 'Gradient Boosting': HistGradientBoostingClassifier(random_state=42),
}
rez = []
np.save(OUT+'/klase_sorted.npy', np.array(sorted(y_tr.unique())))
for ime, mdl in modeli.items():
    t0 = time.time()
    mdl.fit(X_tr, y_tr)
    pred = mdl.predict(X_te)
    proba = mdl.predict_proba(X_te)
    acc = accuracy_score(y_te, pred)
    pr, rc, f1, _ = precision_recall_fscore_support(y_te, pred, average='weighted', zero_division=0)
    f1m = precision_recall_fscore_support(y_te, pred, average='macro', zero_division=0)[2]
    auc = roc_auc_score(y_te, proba, multi_class='ovr', average='macro')
    rez.append({'algoritam': ime, 'accuracy': round(acc,4), 'precision_w': round(pr,4),
                'recall_w': round(rc,4), 'f1_w': round(f1,4), 'f1_macro': round(f1m,4),
                'auc_ovr': round(auc,4), 'vrijeme_s': round(time.time()-t0,1)})
    print(rez[-1])

t = pd.DataFrame(rez)
t.to_csv(OUT + '/tab_osnovni.csv', index=False)

fig, axes = plt.subplots(1, 3, figsize=(15, 4.2))
for ax, met, naslov in zip(axes, ['accuracy','f1_w','auc_ovr'],
                           ['Accuracy (tačnost)','F1-score (weighted)','AUC-ROC (OvR macro)']):
    ax.bar(t['algoritam'], t[met], color='steelblue')
    ax.set_title(naslov); ax.set_ylim(0, 1); ax.tick_params(axis='x', rotation=25, labelsize=8)
    for i, v in enumerate(t[met]): ax.text(i, v+0.01, f'{v:.3f}', ha='center', fontsize=8)
fig.tight_layout(); fig.savefig(S+'s11_osnovna_komparacija.png', dpi=130, bbox_inches='tight')
print('OK korak 5')
