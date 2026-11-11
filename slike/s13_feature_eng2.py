# -*- coding: utf-8 -*-
"""
Korak 13: Napredni feature engineering
  - Razdvajanje Model kolone (brand, model_naziv, ccm_iz_naziva)
  - Uklanjanje snaga_po_kg (izvedena varijabla = multikolinearnost)
  - Analiza uticaja na model
"""
import re, json
import pandas as pd
import numpy as np

OUT = '/tmp/rad'
df = pd.read_parquet(OUT + '/parsed.parquet')

print("=== RAZDVAJANJE MODEL KOLONE ===")
print(f"Ukupno redova: {len(df)}")
print(f"Primjeri modela: {df['Model'].dropna().head(5).tolist()}")

# -------------------------------------------------------
# 1. Izvuci brand (prva rijec) - vec postoji, ali osvjezimo
# -------------------------------------------------------
df['brand'] = df['Model'].dropna().apply(lambda x: x.strip().split()[0] if x.strip() else np.nan)

# -------------------------------------------------------
# 2. Izvuci kubikazu iz NAZIVA modela (npr. "Yamaha R3 300" -> 300)
#    Pattern: broj od 2-4 cifre na kraju ili u sredini naziva
#    koji izgleda kao kubikaza (25-2000 realnih ccm vrijednosti)
# -------------------------------------------------------
def ccm_iz_naziva(naziv):
    if pd.isna(naziv):
        return np.nan
    # Trazi brojeve koji izgledaju kao kubikaza (50-2500)
    kandidati = re.findall(r'\b(\d{2,4})\b', naziv)
    for k in reversed(kandidati):  # pocni od kraja naziva
        val = int(k)
        if 25 <= val <= 2500:
            return float(val)
    return np.nan

df['ccm_iz_naziva'] = df['Model'].apply(ccm_iz_naziva)

# Koliko je pronadeno?
n_pronadjeno = df['ccm_iz_naziva'].notna().sum()
print(f"\nccc iz naziva modela: pronadjeno u {n_pronadjeno} redova ({round(n_pronadjeno/len(df)*100,1)}%)")

# Koliko se poklapa s parsiranom kubikrazom (provjera tacnosti)?
mask = df['kubikaza_ccm'].notna() & df['ccm_iz_naziva'].notna()
podudaranje = (abs(df.loc[mask,'kubikaza_ccm'] - df.loc[mask,'ccm_iz_naziva']) < 50).mean()
print(f"Podudaranje s parsiranom kubikrazom (±50 ccm): {round(podudaranje*100,1)}%")

# -------------------------------------------------------
# 3. Izvuci cisti naziv modela (bez branda, bez ccm broja)
# -------------------------------------------------------
def cisti_naziv(naziv):
    if pd.isna(naziv):
        return np.nan
    dijelovi = naziv.strip().split()
    if not dijelovi:
        return np.nan
    # Ukloni prvu rijec (brand)
    ostatak = dijelovi[1:]
    # Ukloni rijeci koje su samo broj (potencijalna kubikaza)
    ostatak_bez_ccm = [d for d in ostatak if not re.match(r'^\d{2,4}$', d)]
    return ' '.join(ostatak_bez_ccm) if ostatak_bez_ccm else np.nan

df['model_naziv'] = df['Model'].apply(cisti_naziv)

print("\nPrimjeri razdvajanja:")
primjeri = df[['Model','brand','model_naziv','ccm_iz_naziva']].dropna(subset=['Model']).head(10)
for _, r in primjeri.iterrows():
    print(f"  '{r['Model']}' → brand='{r['brand']}' | naziv='{r['model_naziv']}' | ccm={r['ccm_iz_naziva']}")

# -------------------------------------------------------
# 4. Popis novih kolona i multikolinearnost
# -------------------------------------------------------
print("\n=== MULTIKOLINEARNOST: snaga_po_kg ===")
print("snaga_po_kg = snaga_hp / tezina_kg")
print("Ova varijabla je direktno izracunata iz dvije druge koje vec postoje.")
print("Ukljucivanjem sve tri varijable u model, ista informacija se daje 3 puta.")

# Korelacija snaga_po_kg s roditeljima
from scipy.stats import pearsonr
mask2 = df['snaga_hp'].notna() & df['tezina_kg'].notna() & df['snaga_po_kg'].notna()
r1, _ = pearsonr(df.loc[mask2,'snaga_po_kg'], df.loc[mask2,'snaga_hp'])
r2, _ = pearsonr(df.loc[mask2,'snaga_po_kg'], df.loc[mask2,'tezina_kg'])
print(f"Korelacija snaga_po_kg ↔ snaga_hp:  r = {r1:.3f}")
print(f"Korelacija snaga_po_kg ↔ tezina_kg: r = {r2:.3f}")
print("Zakljucak: snaga_po_kg treba izbaciti iz skupa karakteristika za modeliranje.")

# -------------------------------------------------------
# 5. Sacuvaj obogaceni dataset
# -------------------------------------------------------
df.to_parquet(OUT + '/parsed_v2.parquet')
print(f"\nSacuvano: {OUT}/parsed_v2.parquet")
print(f"Nove kolone: brand, model_naziv, ccm_iz_naziva")
print("OK korak 13")
