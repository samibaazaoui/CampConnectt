"""
model/train.py
Entraîne le modèle XGBoost de recommandation de prix.

Usage :
    python model/train.py [--data data/dataset.csv] [--output model/model.pkl]
"""

import argparse
import logging
from pathlib import Path

import joblib

import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import Pipeline
import numpy as np
from sklearn.preprocessing import OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, r2_score
import xgboost as xgb

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train")

# ── Colonnes ──────────────────────────────────────────────────────────────────

CATEGORICAL = ["brand", "material", "season"]
NUMERICAL   = ["waterproof_level", "demand", "competitor_price"]
TARGET      = "price"

BRAND_CATS    = [["Decathlon", "Nike", "Adidas", "Generic"]]
MATERIAL_CATS = [["polyester", "fabric", "plastic", "nylon"]]
SEASON_CATS   = [["summer", "rainy", "winter", "spring"]]


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OrdinalEncoder(
                    categories=BRAND_CATS + MATERIAL_CATS + SEASON_CATS,
                    handle_unknown="use_encoded_value",
                    unknown_value=-1,
                ),
                CATEGORICAL,
            ),
        ],
        remainder="passthrough",
    )
    model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
    )
    return Pipeline(steps=[("preprocessor", preprocessor), ("model", model)])


def evaluate(pipeline: Pipeline, X_test: pd.DataFrame, y_test: pd.Series) -> None:
    y_pred = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2  = r2_score(y_test, y_pred)
    logger.info(f"MAE  : {mae:.3f} €")
    logger.info(f"R²   : {r2:.4f}")


def main(data_path: Path, output_path: Path) -> None:
    logger.info(f"Lecture du dataset : {data_path}")
    df = pd.read_csv(data_path)

    missing = set(CATEGORICAL + NUMERICAL + [TARGET]) - set(df.columns)
    if missing:
        raise ValueError(f"Colonnes manquantes dans le CSV : {missing}")

    X = df[CATEGORICAL + NUMERICAL]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    pipeline = build_pipeline()

    logger.info("Entraînement en cours…")
    pipeline.fit(X_train, y_train)

    logger.info("Évaluation sur le jeu de test :")
    evaluate(pipeline, X_test, y_test)

    # Cross-validation pour confirmer la généralisation
    scores = cross_val_score(pipeline, X, y, cv=5, scoring="neg_mean_absolute_error")
    logger.info(f"CV MAE (5-fold) : {-scores.mean():.3f} ± {scores.std():.3f}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, output_path)
    logger.info(f"Modèle sauvegardé : {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Entraîne le modèle Smart Pricing")
    parser.add_argument("--data",   default="data/dataset.csv",  type=Path)
    parser.add_argument("--output", default="model/model.pkl",   type=Path)
    args = parser.parse_args()
    main(args.data, args.output)