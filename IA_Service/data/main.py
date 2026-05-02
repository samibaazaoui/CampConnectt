"""
Smart Pricing AI — FastAPI Service
Entrée : image produit + métadonnées optionnelles
Sortie : prix recommandé + features extraites
"""

import os
import uuid
import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR / "data"))
from model.predictor import PricePredictor
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model.predictor import PricePredictor
from vision.extractor import FeatureExtractor

# ── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("smart-pricing")

# ── Config ───────────────────────────────────────────────────────────────────

TEMP_DIR = Path("tmp")
TEMP_DIR.mkdir(exist_ok=True)

MODEL_PATH = Path("model/model.pkl")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_MB = 10

# ── App lifecycle ─────────────────────────────────────────────────────────────

predictor: PricePredictor | None = None
extractor: FeatureExtractor | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global predictor, extractor
    logger.info("Loading ML model and vision extractor...")
    predictor = PricePredictor(MODEL_PATH)
    extractor = FeatureExtractor()
    logger.info("Ready.")
    yield
    logger.info("Shutting down.")


# ── Application ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Smart Pricing AI",
    description="Recommandation de prix basée sur vision + ML",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:8084"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────


class ProductFeatures(BaseModel):
    brand: str
    material: str
    waterproof_level: float
    demand: int
    season: str
    competitor_price: float


class PredictionResponse(BaseModel):
    request_id: str
    features: ProductFeatures
    recommended_price: float
    confidence_range: dict[str, float]


# ── Routes ────────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": predictor is not None}


@app.post("/predict-price", response_model=PredictionResponse)
async def predict_price(
    file: UploadFile = File(...),
    competitor_price: float = Form(default=40.0),
    demand: int = Form(default=70),
    season: str = Form(default="summer"),
):
    request_id = str(uuid.uuid4())[:8]

    # ── Validate file ─────────────────────────────────────────────────────────
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté : {suffix}. Acceptés : {ALLOWED_EXTENSIONS}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 10 MB)")

    # ── Save temp file ────────────────────────────────────────────────────────
    temp_path = TEMP_DIR / f"{request_id}{suffix}"
    try:
        temp_path.write_bytes(content)
        logger.info(f"[{request_id}] Image sauvegardée : {temp_path}")

        # ── Extract visual features ───────────────────────────────────────────
        features = extractor.extract(temp_path)
        features["demand"] = demand
        features["season"] = season
        features["competitor_price"] = competitor_price

        logger.info(f"[{request_id}] Features : {features}")

        # ── Predict price ─────────────────────────────────────────────────────
        price, bounds = predictor.predict(features)
        logger.info(f"[{request_id}] Prix recommandé : {price:.2f} €")

        return PredictionResponse(
            request_id=request_id,
            features=ProductFeatures(**features),
            recommended_price=round(price, 2),
            confidence_range={"low": round(bounds[0], 2), "high": round(bounds[1], 2)},
        )

    except Exception as exc:
        logger.exception(f"[{request_id}] Erreur prédiction : {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    finally:
        if temp_path.exists():
            temp_path.unlink()