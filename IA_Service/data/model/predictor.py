
"""
model/predictor.py
Encapsule le chargement et l'inférence XGBoost.
"""
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

FEATURE_ORDER = [
    "brand",
    "material",
    "waterproof_level",
    "demand",
    "season",
    "competitor_price",
]

# Mapping catégories → entiers (doit correspondre à l'encodage du training)
#BRAND_MAP = {"Decathlon": 0, "Nike": 1, "Adidas": 2, "Generic": 3}
#MATERIAL_MAP = {"polyester": 0, "fabric": 1, "plastic": 2, "nylon": 3}
#SEASON_MAP = {"summer": 0, "rainy": 1, "winter": 2, "spring": 3}

# Intervalle de confiance simple (±σ estimé)
CONFIDENCE_SIGMA = 3.5


class PricePredictor:
    def __init__(self, model_path: Path):
        if not model_path.exists():
            raise FileNotFoundError(
                f"Modèle introuvable : {model_path}. "
            )
        
        self.model = joblib.load(model_path)
        logger.info(f"Modèle chargé depuis {model_path}")

    def _encode(self, features: dict) -> pd.DataFrame:
        """Retourne les features brutes (sans encodage)."""
        return pd.DataFrame([{
        "brand": str(features.get("brand", "Generic")),
        "material": str(features.get("material", "plastic")),
        "waterproof_level": float(features.get("waterproof_level", 0.5)),
        "demand": int(features.get("demand", 50)),
        "season": str(features.get("season", "summer")),
        "competitor_price": float(features.get("competitor_price", 30.0)),
        }])

    def predict(self, features: dict) -> tuple[float, tuple[float, float]]:
        """
        Retourne (prix_prédit, (borne_basse, borne_haute)).
        """
        df = self._encode(features)
        price: float = float(self.model.predict(df)[0])
        low = max(0.0, price - CONFIDENCE_SIGMA)
        high = price + CONFIDENCE_SIGMA
        return price, (low, high)