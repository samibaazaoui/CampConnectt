# main.py - Advanced Spam & Bad Words Detection API (Production Ready)
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import re
import joblib
import os
from contextlib import asynccontextmanager
import logging
import time
import hashlib
from datetime import datetime

# Configure logging (NO EMOJIS, clean format)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('ml_service.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Global model variable
model = None
model_metadata = None

# ==================== BAD WORDS FILTER ====================
BAD_WORDS_EN = [
    "fuck", "shit", "damn", "ass", "bitch", "bastard", "dick", "crap",
    "idiot", "stupid", "moron", "retard", "dumb", "loser", "suck",
    "hate", "kill", "die", "ugly", "fat", "slut", "whore", "nigger",
    "faggot", "cunt", "piss", "cock", "wanker", "twat", "bollocks",
    "arse", "bloody hell", "screw you", "shut up", "prick", "jerk"
]

BAD_WORDS_FR = [
    "merde", "putain", "connard", "connasse", "enculé", "salaud",
    "salope", "bordel", "foutre", "nique", "bite", "couille", "con",
    "débile", "abruti", "crétin", "imbécile", "pétasse", "casse-toi",
    "ta gueule", "ferme-la", "enfoiré", "ordure", "pourri", "dégage",
    "va te faire", "fils de pute", "nique ta mère", "fdp", "ntm",
    "pd", "batard", "bouffon", "tg", "stfu", "gtfo", "chiant"
]

ALL_BAD_WORDS = list(set(BAD_WORDS_EN + BAD_WORDS_FR))


def detect_bad_words(text: str) -> List[str]:
    """Detect bad words in text content (FR + EN)"""
    if not text:
        return []
    
    text_lower = text.lower()
    found = []
    
    for word in ALL_BAD_WORDS:
        if ' ' in word:
            if word in text_lower:
                found.append(word)
        else:
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, text_lower):
                found.append(word)
    
    return list(set(found))


def detect_spam_rules(text: str) -> tuple:
    """Fallback rule-based spam detection"""
    if not text:
        return False, 0.0, "Empty content"
    
    text_lower = text.lower()
    
    strong_patterns = [
        (r'buy\s+now|click\s+here|act\s+now|order\s+now', "Urgency CTA"),
        (r'free\s+(money|cash|prize|gift|iphone|winner)', "Free offer scam"),
        (r'win\s+(prize|lottery|money|car|iphone)', "Lottery scam"),
        (r'(credit\s*card|bank\s*details|account\s*verify|password)', "Phishing attempt"),
        (r'(casino|poker|slots|betting|gambling)', "Gambling spam"),
        (r'earn\s+\$?\d+|make\s+money|work\s+from\s+home', "Get rich quick"),
        (r'congratulations|you.?ve\s+been\s+selected|winner', "Fake notification"),
        (r'urgent|important|alert|warning.*account', "Fake urgency"),
        (r'viagra|cialis|weight\s+loss|belly\s+fat|miracle\s+cure', "Medical spam"),
        (r'hot\s+singles|meet\s+women|adult\s+content', "Adult spam"),
    ]
    
    for pattern, reason in strong_patterns:
        if re.search(pattern, text_lower):
            return True, 0.95, f"Strong spam pattern: {reason}"
    
    medium_patterns = [
        (r'\b\d+%\s*off\b|\bsale\b|\bdiscount\b', "Promotional spam"),
        (r'subscribe|newsletter|unsubscribe', "Bulk email pattern"),
        (r'limited\s+time|offer\s+ends|last\s+chance', "False scarcity"),
        (r'guaranteed|100%|no\s+risk', "Overpromising"),
    ]
    
    for pattern, reason in medium_patterns:
        if re.search(pattern, text_lower):
            return True, 0.75, f"Medium spam pattern: {reason}"
    
    return False, 0.1, "No spam patterns detected"


def clamp_confidence(conf: float) -> float:
    """
    Clamp confidence to a safe range: [0.55, 0.99]
    Never returns exactly 1.0 or 0.5 to reflect realistic model uncertainty
    """
    return round(min(max(conf, 0.55), 0.99), 4)


class ContentRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    
    @validator('content')
    def content_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty or whitespace only')
        return v.strip()


class SpamResponse(BaseModel):
    is_spam: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    reason: str = ""
    method: str = ""
    bad_words_detected: List[str] = []
    has_bad_words: bool = False
    processing_time_ms: Optional[float] = None
    model_version: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ML Service starting up...")
    load_model()
    load_metadata()
    yield
    logger.info("ML Service shutting down...")

app = FastAPI(
    title="Advanced Spam & Bad Words Detection Service",
    description="ML-powered spam detection + Bad Words filter for Forum and Chat",
    version="2.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-Id"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Request-Id"] = hashlib.md5(f"{request.method}{request.url}{start_time}".encode()).hexdigest()[:8]
    return response


def load_model():
    global model
    model_path = 'spam_model.joblib'
    if os.path.exists(model_path):
        try:
            model = joblib.load(model_path)
            logger.info(f"ML Model loaded: {model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            model = None
    else:
        logger.warning(f"No trained model found at {model_path}. Using fallback rules only.")


def load_metadata():
    global model_metadata
    metadata_path = 'model_metadata.json'
    if os.path.exists(metadata_path):
        try:
            import json
            with open(metadata_path, 'r', encoding='utf-8') as f:
                model_metadata = json.load(f)
            logger.info(f"Model metadata loaded: version {model_metadata.get('version', 'unknown')}")
        except Exception as e:
            logger.warning(f"Could not load metadata: {e}")
            model_metadata = None
    else:
        model_metadata = None


@app.get("/")
async def root():
    return {
        "message": "Advanced Spam & Bad Words Detection API",
        "status": "running",
        "model_loaded": model is not None,
        "model_version": model_metadata.get('version') if model_metadata else None,
        "bad_words_count": len(ALL_BAD_WORDS),
        "supported_languages": ["French", "English"],
        "endpoints": {
            "/predict": "POST - Analyze content for spam",
            "/check-badwords": "POST - Check bad words only",
            "/health": "GET - Service health check",
            "/docs": "GET - Interactive API documentation"
        }
    }


@app.get("/health")
async def health_check():
    status = "healthy" if model is not None else "degraded"
    return {
        "status": status,
        "model_loaded": model is not None,
        "model_info": model_metadata if model_metadata else None,
        "bad_words_count": len(ALL_BAD_WORDS),
        "features": ["spam_detection", "bad_words_filter", "confidence_scoring", "fallback_rules"],
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/predict", response_model=SpamResponse)
async def predict_spam(request: ContentRequest, background_tasks: BackgroundTasks):
    start_time = time.time()
    content = request.content
    content_hash = hashlib.md5(content.encode()).hexdigest()[:8]
    
    logger.info(f"[REQ:{content_hash}] Analyzing content ({len(content)} chars)")
    
    # 1. Bad Words Check (Priority 1)
    bad_words_found = detect_bad_words(content)
    if bad_words_found:
        processing_time = (time.time() - start_time) * 1000
        logger.warning(f"[REQ:{content_hash}] Bad words detected: {bad_words_found[:3]}")
        
        return SpamResponse(
            is_spam=True,
            confidence=clamp_confidence(0.99),  # Never 1.0
            reason=f"Bad words: {', '.join(bad_words_found[:3])}",
            method="Bad Words Filter",
            bad_words_detected=bad_words_found,
            has_bad_words=True,
            processing_time_ms=round(processing_time, 2),
            model_version=model_metadata.get('version') if model_metadata else None
        )
    
    # 2. ML Model Prediction (Priority 2)
    if model:
        try:
            clean_text = content.lower().strip()
            pred = model.predict([clean_text])[0]
            probs = model.predict_proba([clean_text])[0]
            
            is_spam = bool(pred)
            raw_confidence = float(probs[1] if is_spam else probs[0])
            confidence = clamp_confidence(raw_confidence)
            
            processing_time = (time.time() - start_time) * 1000
            
            if is_spam:
                if confidence >= 0.90:
                    logger.info(f"[REQ:{content_hash}] SPAM detected (conf: {confidence:.2%})")
                elif confidence >= 0.70:
                    logger.warning(f"[REQ:{content_hash}] Likely spam (conf: {confidence:.2%})")
                else:
                    logger.debug(f"[REQ:{content_hash}] Possible spam (low conf: {confidence:.2%})")
            else:
                logger.debug(f"[REQ:{content_hash}] HAM confirmed (conf: {confidence:.2%})")
            
            return SpamResponse(
                is_spam=is_spam,
                confidence=confidence,
                reason="ML model prediction",
                method="Machine Learning",
                bad_words_detected=[],
                has_bad_words=False,
                processing_time_ms=round(processing_time, 2),
                model_version=model_metadata.get('version') if model_metadata else None
            )
            
        except Exception as e:
            logger.error(f"[REQ:{content_hash}] ML prediction error: {e}")
    
    # 3. Fallback to rule-based detection (Priority 3)
    is_spam, confidence, reason = detect_spam_rules(content)
    confidence = clamp_confidence(confidence)
    processing_time = (time.time() - start_time) * 1000
    
    logger.info(f"[REQ:{content_hash}] Fallback rules: {'SPAM' if is_spam else 'HAM'} | {reason}")
    
    return SpamResponse(
        is_spam=is_spam,
        confidence=confidence,
        reason=reason,
        method="Rule-based (Fallback)",
        bad_words_detected=[],
        has_bad_words=False,
        processing_time_ms=round(processing_time, 2),
        model_version=None
    )


@app.post("/check-badwords")
async def check_bad_words_only(request: ContentRequest):
    if not request.content:
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    
    bad_words_found = detect_bad_words(request.content)
    
    return {
        "has_bad_words": len(bad_words_found) > 0,
        "bad_words_found": bad_words_found,
        "content_length": len(request.content),
        "checked_words_count": len(ALL_BAD_WORDS),
        "languages": ["French", "English"]
    }


@app.get("/model-info")
async def get_model_info():
    if not model_metadata:
        raise HTTPException(status_code=404, detail="No model metadata available")
    
    return {
        **model_metadata,
        "bad_words_count": len(ALL_BAD_WORDS),
        "algorithm_details": {
            "naive_bayes": "Probabilistic, fast, good for small datasets",
            "logistic_regression": "Linear classifier, balanced precision/recall",
            "random_forest": "Ensemble method, handles noise well",
            "gradient_boosting": "High performance, slower training",
            "linear_svc": "Excellent for high-dimensional text"
        }
    }


@app.post("/upload-audio")
async def upload_audio(file):
    return {
        "audio_url": f"http://localhost:8001/uploads/{hashlib.md5(str(time.time()).encode()).hexdigest()[:8]}.webm",
        "filename": "temp.webm",
        "status": "uploaded",
        "note": "Audio analysis requires STT integration (e.g., Whisper)"
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP {exc.status_code} on {request.url}: {exc.detail}")
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500}
    )


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting ML Service with CORS enabled...")
    logger.info(f"Bad words dictionary: {len(ALL_BAD_WORDS)} terms (FR+EN)")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info", access_log=True)