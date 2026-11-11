# -*- coding: utf-8 -*-
"""Korak 6: Logistička regresija — duboka analiza."""
import json
import numpy as np, pandas as pd
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.metrics import confusion_matrix, classification_report
sns.set_theme(style='whitegrid')

OUT = '/tmp/rad'; S = OUT + '/slike/'
X_tr = pd.read_parquet(OUT+'/X_tr.parquet'); X_te = pd.read_parquet(OUT+'/X_te.parquet')
y_tr = pd.read_parquet(OUT+'/y_tr.parquet')['y']; y_te = pd.read_parquet(OUT+'/y_te.parquet')['y']

mdl = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000, random_state=42))
cv = cross_val_score(mdl, X_tr, y_tr, cv=5, scoring='f1_weighted', n_jobs=-1)
mdl.fit(X_tr, y_tr)
pred = mdl.predict(X_te)

klase = sorted(y_tr.unique())
cm = confusion_matrix(y_te, pred, labels=klase, normalize='true')
fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='.2f', cmap='Blues', xticklabels=klase, yticklabels=klase,
            ax=ax, annot_kws={'size':7})
ax.set_title('Logistička regresija — matrica konfuzije (normalizovana po redu)')
ax.set_xlabel('Predviđena klasa'); ax.set_ylabel('Stvarna klasa')
plt.xticks(rotation=45, ha='right', fontsize=8); plt.yticks(fontsize=8)
fig.tight_layout(); fig.savefig(S+'s12_logreg_cm.png', dpi=130, bbox_inches='tight'); plt.close(fig)

# koeficijenti po klasama (heatmap)
lr = mdl.named_steps['logisticregression']
koef = pd.DataFrame(lr.coef_, index=lr.classes_, columns=X_tr.columns)
fig, ax = plt.subplots(figsize=(11, 6))
sns.heatmap(koef, cmap='coolwarm', center=0, ax=ax, annot=True, fmt='.1f', annot_kws={'size':6})
ax.set_title('Logistička regresija — koeficijenti (standardizovane karakteristike)')
plt.xticks(rotation=45, ha='right', fontsize=8); plt.yticks(fontsize=8)
fig.tight_layout(); fig.savefig(S+'s13_logreg_koef.png', dpi=130, bbox_inches='tight'); plt.close(fig)

rep = classification_report(y_te, pred, output_dict=True, zero_division=0)
rez = {'cv_f1_mean': round(float(cv.mean()),4), 'cv_f1_std': round(float(cv.std()),4),
       'report': {k: {m: round(v[m],3) for m in ['precision','recall','f1-score']}
                  for k, v in rep.items() if isinstance(v, dict) and k in klase},
       'accuracy': round(rep['accuracy'],4),
       'najbolje_klase': sorted([(k, round(rep[k]['f1-score'],3)) for k in klase], key=lambda x:-x[1])[:3],
       'najgore_klase': sorted([(k, round(rep[k]['f1-score'],3)) for k in klase], key=lambda x:x[1])[:3]}
with open(OUT+'/rez_06.json','w') as f: json.dump(rez, f, indent=1, ensure_ascii=False)
print('CV F1:', rez['cv_f1_mean'], '+/-', rez['cv_f1_std'])
print('naj:', rez['najbolje_klase'], 'najgore:', rez['najgore_klase'])
print('OK korak 6')
