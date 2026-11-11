# -*- coding: utf-8 -*-
"""Korak 9: ROC krivulje, radar dijagram, finalno poređenje LogReg vs RF."""
import json
import numpy as np, pandas as pd
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler, label_binarize
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import roc_curve, auc, precision_recall_fscore_support, accuracy_score, roc_auc_score
sns.set_theme(style='whitegrid')

OUT = '/tmp/rad'; S = OUT + '/slike/'
X_tr = pd.read_parquet(OUT+'/X_tr.parquet'); X_te = pd.read_parquet(OUT+'/X_te.parquet')
y_tr = pd.read_parquet(OUT+'/y_tr.parquet')['y']; y_te = pd.read_parquet(OUT+'/y_te.parquet')['y']
klase = sorted(y_tr.unique())
y_bin = label_binarize(y_te, classes=klase)

modeli = {
 'Logistička regresija': make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000, random_state=42)),
 'KNN (k=10)': make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=10)),
 'Stablo odluke': DecisionTreeClassifier(max_depth=15, random_state=42),
 'Random Forest': RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=2),
 'Gradient Boosting': HistGradientBoostingClassifier(random_state=42),
}
fig, ax = plt.subplots(figsize=(7.5, 6))
fin = {}
for ime, mdl in modeli.items():
    mdl.fit(X_tr, y_tr)
    proba = mdl.predict_proba(X_te)
    fpr, tpr, _ = roc_curve(y_bin.ravel(), proba.ravel())  # micro-average OvR
    a = auc(fpr, tpr)
    ax.plot(fpr, tpr, label=f'{ime} (AUC={a:.3f})', lw=1.8)
    pred = mdl.predict(X_te)
    pr, rc, f1, _ = precision_recall_fscore_support(y_te, pred, average='weighted', zero_division=0)
    fin[ime] = {'acc': round(accuracy_score(y_te, pred),4), 'prec': round(pr,4),
                'rec': round(rc,4), 'f1': round(f1,4), 'auc_micro': round(a,4),
                'auc_macro': round(roc_auc_score(y_te, proba, multi_class='ovr', average='macro'),4)}
ax.plot([0,1],[0,1],'k--', lw=1, label='Nasumično pogađanje')
ax.set_xlabel('Stopa lažno pozitivnih (FPR)'); ax.set_ylabel('Stopa stvarno pozitivnih (TPR)')
ax.set_title('ROC krivulje (micro-average, one-vs-rest) — svi algoritmi'); ax.legend(fontsize=8)
fig.tight_layout(); fig.savefig(S+'s19_roc.png', dpi=130, bbox_inches='tight'); plt.close(fig)

# radar: LogReg vs RF
met = ['acc','prec','rec','f1','auc_macro']
lab = ['Accuracy','Precision','Recall','F1-score','AUC-ROC']
ang = np.linspace(0, 2*np.pi, len(met), endpoint=False).tolist(); ang += ang[:1]
fig, ax = plt.subplots(figsize=(6.5, 6), subplot_kw=dict(polar=True))
for ime, boja in [('Logistička regresija','steelblue'), ('Random Forest','seagreen')]:
    v = [fin[ime][m] for m in met]; v += v[:1]
    ax.plot(ang, v, 'o-', color=boja, label=ime); ax.fill(ang, v, alpha=.15, color=boja)
ax.set_xticks(ang[:-1]); ax.set_xticklabels(lab, fontsize=9); ax.set_ylim(0, 1)
ax.set_title('Usporedni pregled performansi — Logistička regresija vs Random Forest', fontsize=10)
ax.legend(loc='lower right', fontsize=9)
fig.tight_layout(); fig.savefig(S+'s20_radar.png', dpi=130, bbox_inches='tight'); plt.close(fig)

# poredjenje P/R/F1 bar
fig, ax = plt.subplots(figsize=(7.5, 4.2))
x = np.arange(3); w = 0.35
lg = [fin['Logistička regresija'][m] for m in ['prec','rec','f1']]
rf = [fin['Random Forest'][m] for m in ['prec','rec','f1']]
ax.bar(x-w/2, lg, w, label='Logistička regresija', color='steelblue')
ax.bar(x+w/2, rf, w, label='Random Forest', color='seagreen')
ax.set_xticks(x); ax.set_xticklabels(['Precision','Recall','F1-score']); ax.set_ylim(0,1); ax.legend()
for i,v in enumerate(lg): ax.text(i-w/2, v+.01, f'{v:.3f}', ha='center', fontsize=8)
for i,v in enumerate(rf): ax.text(i+w/2, v+.01, f'{v:.3f}', ha='center', fontsize=8)
ax.set_title('Poređenje klasifikacijskih metrika (weighted)')
fig.tight_layout(); fig.savefig(S+'s21_prf.png', dpi=130, bbox_inches='tight'); plt.close(fig)

with open(OUT+'/rez_09.json','w') as f: json.dump(fin, f, indent=1, ensure_ascii=False)
print(json.dumps(fin, indent=1, ensure_ascii=False))
print('OK korak 9')
