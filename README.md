# Klasifikacija motocikala — mašinsko učenje

Seminarski rad iz predmeta **Mašinsko učenje**, Fakultet informacijskih tehnologija, Univerzitet „Džemal Bijedić" u Mostaru (2025/2026).

Cilj projekta je da model na osnovu **samo tehničkih specifikacija** (kubikaža, snaga, težina, brzina…) pogodi kojoj od **18 kategorija** motocikl pripada (Sport, Scooter, Enduro, Custom/cruiser…). Pored klasifikacije, isprobane su i metode klasteriranja da se vidi da li podaci sami od sebe formiraju prirodne grupe.

## Dataset

- Izvor: [Motorcycle Technical Specifications (Kaggle)](https://www.kaggle.com/datasets/emmanuelfwerr/motorcycle-technical-specifications-19702022), podaci sa Bikez.com
- 38.472 motocikla, 85 varijabli, period 1894–2023
- Fajl **nije uključen u repozitorij**. Skini `all_bikez_raw.csv` i stavi ga u folder `data/`.

## Šta je urađeno

1. **Razumijevanje podataka**: raspodjela kategorija, nedostajuće vrijednosti, korelacije
2. **Preprocesiranje**: izvlačenje brojeva iz teksta regexom (npr. `"49.9 ccm (3.04 cubic inches)"` → `49.9`), feature engineering iz naziva modela, dopuna maksimalne brzine, imputacija, enkodiranje
3. **Klasifikacija**: Random Forest i logistička regresija, uz 5-fold cross-validation
4. **Klasteriranje**: K-Means, K-Medoids (PAM, ručna implementacija), K-Modes i K-Prototypes
5. **Ručna predikcija**: uneseš specifikacije motora, model kaže kategoriju

## Rezultati

| Model | F1 (macro) | Accuracy |
|---|---|---|
| Random Forest | ≈ 0,67 | ≈ 0,78 |
| Logistička regresija | ≈ 0,32 | — |

Najbolje klasteriranje (K-Means, k=6) daje Silhouette ≈ 0,21 i ARI ≈ 0,13. Bez labela, klasteri ne mogu rekonstruisati 18 kategorija, ali otkrivaju nekoliko prirodnih „profila" motocikala.

## Pokretanje

```bash
pip install -r requirements.txt
jupyter notebook ML.ipynb
```

## Struktura

```
├── ML.ipynb          # glavni notebook
├── dokumentacija/    # seminarski rad (Word/PDF)
├── slike/            # grafikoni korišteni u radu
├── data/             # ovdje ide dataset (nije na GitHubu)
└── requirements.txt
```

## Autorica

Hasna Bunar · mentorica: prof. dr. Mirela Mabić
