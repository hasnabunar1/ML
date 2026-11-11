# -*- coding: utf-8 -*-
"""Korak 7: Random Forest — GridSearchCV, feature importance, evaluacija."""
import json
import numpy as np, pandas as pd
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import confusion_matrix, classification_report
sns.set_theme(style='whitegrid')

OUT = '/tmp/rad'; S = OUT + '/slike/'
X_tr = pd.read_parquet(OUT+'/X_tr.parquet'); X_te = pd.read_parquet(OUT+'/X_te.parquet')
y_tr = pd.read_parquet(OUT+'/y_tr.parquet')['y']; y_te = pd.read_parquet(OUT+'/y_te.parquet')['y']

grid = GridSearchCV(RandomForestClassifier(random_state=42, n_jobs=2),
                    {'n_estimators': [100, 200], 'max_depth': [10, 20, None]},
                    cv=3, scoring='f1_weighted', n_jobs=2)
grid.fit(X_tr, y_tr)
gr = pd.DataFrame(grid.cv_results_)[['param_n_estimators','param_max_depth','mean_test_score']]
gr['param_max_depth'] = gr['param_max_depth'].astype(str)
piv = gr.pivot(index='param_max_depth', columns='param_n_estimators', values='mean_test_score')
fig, ax = plt.subplots(figsize=(6.5, 4.2))
sns.heatmap(piv, annot=True, fmt='.4f', cmap='YlGnBu', ax=ax)
ax.set_title('GridSearchCV — F1 (3-fold CV)'); ax.set_xlabel('n_estimators'); ax.set_ylabel('max_depth')
fig.tight_layout(); fig.savefig(S+'s14_rf_grid.png', dpi=130, bbox_inches='tight'); plt.close(fig)

best = grid.best_estimator_
pred = best.predict(X_te)

# feature importance
imp = pd.Series(best.feature_importances_, index=X_tr.columns).sort_values()
fig, ax = plt.subplots(figsize=(8, 5.5))
imp.plot.barh(ax=ax, color='seagreen')
ax.set_title('Random Forest — važnost karakteristika (feature importance)')
fig.tight_layout(); fig.savefig(S+'s15_rf_importance.png', dpi=130, bbox_inches='tight'); plt.close(fig)

klase = sorted(y_tr.unique())
cm = confusion_matrix(y_te, pred, labels=klase, normalize='true')
fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='.2f', cmap='Greens', xticklabels=klase, yticklabels=klase,
            ax=ax, annot_kws={'size':7})
ax.set_title('Random Forest — matrica konfuzije (normalizovana po redu)')
ax.set_xlabel('Predviđena klasa'); ax.set_ylabel('Stvarna klasa')
plt.xticks(rotation=45, ha='right', fontsize=8); plt.yticks(fontsize=8)
fig.tight_layout(); fig.savefig(S+'s16_rf_cm.png', dpi=130, bbox_inches='tight'); plt.close(fig)

rep = classification_report(y_te, pred, output_dict=True, zero_division=0)
rez = {'best_params': {k: (v if v is None else int(v)) for k,v in grid.best_params_.items()},
       'best_cv_f1': round(float(grid.best_score_),4),
       'grid_tabela': gr.round(4).to_dict('records'),
       'accuracy': round(rep['accuracy'],4),
       'report': {k: {m: round(v[m],3) for m in ['precision','recall','f1-score']}
                  for k, v in rep.items() if isinstance(v, dict) and k in klase},
       'importance': imp.round(4).to_dict(),
       'najbolje_klase': sorted([(k, round(rep[k]['f1-score'],3)) for k in klase], key=lambda x:-x[1])[:3],
       'najgore_klase': sorted([(k, round(rep[k]['f1-score'],3)) for k in klase], key=lambda x:x[1])[:3]}
with open(OUT+'/rez_07.json','w') as f: json.dump(rez, f, indent=1, ensure_ascii=False)
import joblib; joblib.dump(best, OUT+'/rf_best.joblib')
print('best:', rez['best_params'], 'CV F1:', rez['best_cv_f1'], 'test acc:', rez['accuracy'])
print('naj:', rez['najbolje_klase'], 'najgore:', rez['najgore_klase'])
print('OK korak 7')
