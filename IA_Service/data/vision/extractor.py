"""
vision/extractor.py
Extrait des features produit à partir d'une image.
Version pro : analyse couleurs dominantes + texture + luminosité.
"""

import logging
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ── Seuils de détection ───────────────────────────────────────────────────────

BRAND_THRESHOLDS = {
    # Heuristique basée sur la luminosité moyenne + saturation
    # À remplacer par un classifier CNN fine-tuné sur vos données
    "high_brightness_high_saturation": "Decathlon",
    "high_brightness_low_saturation":  "Nike",
    "low_brightness_high_saturation":  "Adidas",
    "default":                         "Generic",
}

MATERIAL_COLOR_RANGES = {
    # Plage HSV approximative → matière
    "polyester": {"hue_range": (100, 140), "min_saturation": 50},
    "nylon":     {"hue_range": (20,  80),  "min_saturation": 40},
    "fabric":    {"hue_range": (0,   180), "min_saturation": 15},
    "plastic":   {"hue_range": (0,   180), "min_saturation": 0},   # fallback
}


class FeatureExtractor:
    """Extrait des features visuelles d'une image produit."""

    def extract(self, image_path: Path) -> dict:
        """
        Analyse l'image et retourne un dict de features.
        """
        bgr = cv2.imread(str(image_path))
        if bgr is None:
            raise ValueError(f"Impossible de lire l'image : {image_path}")

        bgr = cv2.resize(bgr, (224, 224))
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

        brightness  = self._mean_brightness(hsv)
        saturation  = self._mean_saturation(hsv)
        texture_score = self._texture_score(bgr)

        brand = self._detect_brand(brightness, saturation)
        material = self._detect_material(hsv, texture_score)
        waterproof = self._estimate_waterproof(material, texture_score)

        features = {
            "brand":           brand,
            "material":        material,
            "waterproof_level": round(waterproof, 2),
        }

        logger.debug(
            f"brightness={brightness:.1f} sat={saturation:.1f} "
            f"texture={texture_score:.3f} → {features}"
        )
        return features

    # ── Méthodes privées ──────────────────────────────────────────────────────

    @staticmethod
    def _mean_brightness(hsv: np.ndarray) -> float:
        return float(hsv[:, :, 2].mean())

    @staticmethod
    def _mean_saturation(hsv: np.ndarray) -> float:
        return float(hsv[:, :, 1].mean())

    @staticmethod
    def _texture_score(bgr: np.ndarray) -> float:
        """Score de texture via variance du Laplacien (détecte netteté et motifs)."""
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        lap  = cv2.Laplacian(gray, cv2.CV_64F)
        return float(lap.var()) / 1000.0  # normalisé

    @staticmethod
    def _detect_brand(brightness: float, saturation: float) -> str:
        if brightness > 130 and saturation > 80:
            return "Decathlon"
        elif brightness > 130 and saturation <= 80:
            return "Nike"
        elif brightness <= 130 and saturation > 80:
            return "Adidas"
        return "Generic"

    @staticmethod
    def _detect_material(hsv: np.ndarray, texture_score: float) -> str:
        mean_sat = float(hsv[:, :, 1].mean())
        mean_hue = float(hsv[:, :, 0].mean())

        # Polyester : tons froids, saturation élevée, texture fine
        if 100 <= mean_hue <= 140 and mean_sat > 50:
            return "polyester"
        # Nylon : tons chauds-neutres, saturation modérée
        elif 20 <= mean_hue <= 80 and mean_sat > 40:
            return "nylon"
        # Tissu : texture élevée, saturation basse
        elif texture_score > 1.5 and mean_sat < 40:
            return "fabric"
        return "plastic"

    @staticmethod
    def _estimate_waterproof(material: str, texture_score: float) -> float:
        base = {
            "polyester": 0.85,
            "nylon":     0.75,
            "fabric":    0.50,
            "plastic":   0.40,
        }.get(material, 0.50)
        # Ajustement léger selon la densité de texture
        adjustment = min(0.10, texture_score * 0.02)
        return min(1.0, base + adjustment)