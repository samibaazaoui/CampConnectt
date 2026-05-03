import os
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, VotingRegressor
from sqlalchemy import create_engine, text
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="CAMP Recommendation Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "camp_db")


def get_engine():
    url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    return create_engine(url, pool_pre_ping=True)


def load_campsite_interactions() -> pd.DataFrame:
    engine = get_engine()
    with engine.connect() as conn:
        feedback_df = pd.read_sql(text("SELECT user_id, campsite_id, CAST(rating AS FLOAT) AS rating FROM feedbacks"), conn)
        reservations_df = pd.read_sql(text("SELECT user_id, campsite_id, status FROM reservations WHERE campsite_id IS NOT NULL"), conn)
    status_scores = {"COMPLETED": 4.5, "CONFIRMED": 3.5, "PENDING": 2.0, "CANCELLED": 0.5}
    reservations_df["rating"] = reservations_df["status"].map(status_scores).fillna(1.0)
    reservations_df = reservations_df[["user_id", "campsite_id", "rating"]]
    combined = pd.concat([feedback_df[["user_id", "campsite_id", "rating"]], reservations_df])
    combined["rating"] = pd.to_numeric(combined["rating"], errors="coerce").fillna(1.0)
    return combined.groupby(["user_id", "campsite_id"])["rating"].max().reset_index()


def load_event_interactions() -> pd.DataFrame:
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(text("SELECT user_id, event_id, status FROM event_participations"), conn)
    status_scores = {"ATTENDED": 5.0, "REGISTERED": 3.0, "CANCELLED": 0.5}
    df["rating"] = pd.to_numeric(df["status"].map(status_scores), errors="coerce").fillna(2.0)
    return df[["user_id", "event_id", "rating"]]


def load_all_campsites() -> pd.DataFrame:
    engine = get_engine()
    with engine.connect() as conn:
        return pd.read_sql(text("SELECT id, name, location, nightly_price, image_url FROM campsites WHERE approval_status = 'APPROVED'"), conn)


def load_all_events() -> pd.DataFrame:
    engine = get_engine()
    with engine.connect() as conn:
        return pd.read_sql(text("SELECT id, title, location, start_at, end_at FROM events"), conn)


SIM_THRESHOLD = 0.05   # ignore neighbors with similarity below this
CF_WEIGHT     = 0.70   # weight for collaborative score
POP_WEIGHT    = 0.30   # weight for popularity score
SVD_MIN_USERS = 5      # min users needed to use SVD


def _popularity_scores(matrix: pd.DataFrame, available_cols: list) -> pd.Series:
    """Popularity = mean rating across all users (non-zero only)."""
    sub = matrix[available_cols].replace(0, np.nan)
    return sub.mean(skipna=True).fillna(0)


def _mean_center(matrix: pd.DataFrame) -> pd.DataFrame:
    """Subtract each user's mean rating from their non-zero entries."""
    centered = matrix.copy().astype(float)
    for uid in centered.index:
        row = centered.loc[uid]
        nonzero_mean = row[row != 0].mean()
        if pd.notna(nonzero_mean):
            centered.loc[uid] = row.where(row == 0, row - nonzero_mean)
    return centered


def _svd_scores(user_id: int, matrix: pd.DataFrame, available_cols: list) -> pd.Series:
    """TruncatedSVD latent-factor reconstruction scores for a user."""
    n_components = min(10, matrix.shape[0] - 1, matrix.shape[1] - 1)
    if n_components < 1:
        return pd.Series(dtype=float)
    try:
        svd = TruncatedSVD(n_components=n_components, random_state=42)
        reconstructed = svd.fit_transform(matrix)
        reconstructed_full = pd.DataFrame(
            svd.inverse_transform(reconstructed),
            index=matrix.index, columns=matrix.columns
        )
        if user_id not in reconstructed_full.index:
            return pd.Series(dtype=float)
        return reconstructed_full.loc[user_id, available_cols]
    except Exception:
        return pd.Series(dtype=float)


def collaborative_filter(user_id: int, matrix: pd.DataFrame, n: int, exclude_ids: set) -> List[int]:
    if matrix.empty:
        return []

    available_cols = [c for c in matrix.columns if c not in exclude_ids]
    if not available_cols:
        return []

    pop_scores = _popularity_scores(matrix, available_cols)

    # Cold-start: user unknown → pure popularity
    if user_id not in matrix.index:
        return [int(i) for i in pop_scores.nlargest(n).index]

    # ── 1. Mean-centered cosine similarity ──────────────────────────
    centered = _mean_center(matrix)
    user_vec  = centered.loc[[user_id]].values
    sim_scores = cosine_similarity(user_vec, centered)[0]
    sim_series = pd.Series(sim_scores, index=matrix.index)
    top_similar = (
        sim_series
        .drop(index=user_id, errors="ignore")
        .where(sim_series >= SIM_THRESHOLD)
        .dropna()
        .nlargest(15)
    )

    # ── 2. CF score from similar neighbors ──────────────────────────
    if not top_similar.empty:
        sim_mat = matrix.loc[top_similar.index, available_cols]
        weights = top_similar.values.reshape(1, -1)
        cf_raw  = np.dot(weights, sim_mat.values).flatten()
        cf_series = pd.Series(cf_raw, index=sim_mat.columns)
    else:
        cf_series = pd.Series(np.zeros(len(available_cols)), index=available_cols)

    # ── 3. SVD latent-factor scores (better on sparse data) ─────────
    if matrix.shape[0] >= SVD_MIN_USERS:
        svd_series = _svd_scores(user_id, matrix, available_cols)
        if not svd_series.empty:
            # Normalize both to [0,1] then blend
            def norm01(s):
                mn, mx = s.min(), s.max()
                return (s - mn) / (mx - mn + 1e-9)
            cf_norm  = norm01(cf_series.reindex(available_cols).fillna(0))
            svd_norm = norm01(svd_series.reindex(available_cols).fillna(0))
            cf_series = 0.5 * cf_norm + 0.5 * svd_norm

    # ── 4. Hybrid: blend CF + popularity ────────────────────────────
    def norm01(s):
        mn, mx = s.min(), s.max()
        return (s - mn) / (mx - mn + 1e-9)

    cf_n   = norm01(cf_series.reindex(available_cols).fillna(0))
    pop_n  = norm01(pop_scores.reindex(available_cols).fillna(0))
    final  = CF_WEIGHT * cf_n + POP_WEIGHT * pop_n

    top_items = final.nlargest(n)
    return [int(i) for i in top_items.index if str(i).lstrip('-').isdigit()]


class CampsiteRec(BaseModel):
    id: int
    name: str
    location: str
    nightly_price: Optional[float] = None
    image_url: Optional[str] = None


class EventRec(BaseModel):
    id: int
    title: str
    location: str
    start_at: Optional[str] = None
    end_at: Optional[str] = None


class RecommendationResponse(BaseModel):
    user_id: int
    campsites: List[CampsiteRec]
    events: List[EventRec]


@app.get("/recommendations/{user_id}", response_model=RecommendationResponse)
def get_recommendations(user_id: int, n: int = 5):
    try:
        campsite_interactions = load_campsite_interactions()
        event_interactions = load_event_interactions()
        all_campsites = load_all_campsites()
        all_events = load_all_events()

        already_visited = set(
            campsite_interactions[campsite_interactions["user_id"] == user_id]["campsite_id"].tolist()
        )
        already_attended = set(
            event_interactions[event_interactions["user_id"] == user_id]["event_id"].tolist()
        )

        campsite_matrix = (
            campsite_interactions.pivot_table(
                index="user_id", columns="campsite_id", values="rating", aggfunc="mean", fill_value=0
            ).astype(float)
            if not campsite_interactions.empty else pd.DataFrame()
        )
        event_matrix = (
            event_interactions.pivot_table(
                index="user_id", columns="event_id", values="rating", aggfunc="mean", fill_value=0
            ).astype(float)
            if not event_interactions.empty else pd.DataFrame()
        )

        rec_campsite_ids = collaborative_filter(user_id, campsite_matrix, n, already_visited)
        rec_event_ids = collaborative_filter(user_id, event_matrix, n, already_attended)

        rec_campsites = all_campsites[all_campsites["id"].isin(rec_campsite_ids)].to_dict("records")
        rec_events = all_events[all_events["id"].isin(rec_event_ids)].to_dict("records")

        rec_campsite_ids_ordered = {v: i for i, v in enumerate(rec_campsite_ids)}
        rec_event_ids_ordered = {v: i for i, v in enumerate(rec_event_ids)}
        rec_campsites.sort(key=lambda x: rec_campsite_ids_ordered.get(x["id"], 99))
        rec_events.sort(key=lambda x: rec_event_ids_ordered.get(x["id"], 99))

        for c in rec_campsites:
            for k, v in c.items():
                if hasattr(v, 'item'):
                    c[k] = v.item()
                elif v is None:
                    c[k] = None
        for e in rec_events:
            for k, v in e.items():
                if v is not None and not isinstance(v, (str, int, float, bool)):
                    e[k] = str(v)

        return RecommendationResponse(
            user_id=user_id,
            campsites=[CampsiteRec(**c) for c in rec_campsites],
            events=[EventRec(**e) for e in rec_events],
        )
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@app.get("/health")
def health():
    return {"status": "ok", "service": "CAMP Recommendation Engine"}


@app.get("/model-metrics")
def model_metrics():
    try:
        from sklearn.model_selection import KFold, cross_val_score
        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

        df = load_event_training_data()
        if len(df) < 5:
            raise HTTPException(status_code=400, detail="Not enough data")

        X       = df[FEATURES].values
        y_count = df["total_participants"].values.astype(float)
        y_rate  = df["attendance_rate"].values.astype(float)

        kf = KFold(n_splits=5, shuffle=True, random_state=42)
        ensemble = _build_ensemble()

        def cv_metrics(y):
            mae  = float(-cross_val_score(ensemble, X, y, cv=kf, scoring="neg_mean_absolute_error").mean())
            rmse = float(np.sqrt(-cross_val_score(ensemble, X, y, cv=kf, scoring="neg_mean_squared_error").mean()))
            r2   = float(cross_val_score(ensemble, X, y, cv=kf, scoring="r2").mean())
            return {"mae": round(mae, 3), "rmse": round(rmse, 3), "r2": round(r2, 3)}

        cv_count = cv_metrics(y_count)
        cv_rate  = cv_metrics(y_rate)

        m_count, m_rate = train_models(df)
        pred_count = m_count.predict(X)
        pred_rate  = m_rate.predict(X)

        feat_model = GradientBoostingRegressor(
            n_estimators=300, learning_rate=0.04, max_depth=4,
            min_samples_leaf=3, subsample=0.8, random_state=42
        )
        feat_model.fit(X, y_count)
        feat_imp = [
            {"feature": f, "importance": round(float(i) * 100, 1)}
            for f, i in sorted(zip(FEATURES, feat_model.feature_importances_), key=lambda x: x[1], reverse=True)
        ]

        def quality(r2):
            return "Excellent" if r2 > 0.8 else "Bon" if r2 > 0.6 else "Moyen" if r2 > 0.4 else "Faible"

        return {
            "total_events": int(len(df)),
            "avg_participants": round(float(df["total_participants"].mean()), 1),
            "avg_attendance_rate": round(float(df["attendance_rate"].mean()), 1),
            "cv_participants": {**cv_count, "quality": quality(cv_count["r2"])},
            "cv_attendance_rate": {**cv_rate, "quality": quality(cv_rate["r2"])},
            "train_participants": {
                "mae": round(float(mean_absolute_error(y_count, pred_count)), 2),
                "rmse": round(float(np.sqrt(mean_squared_error(y_count, pred_count))), 2),
                "r2": round(float(r2_score(y_count, pred_count)), 3)
            },
            "train_attendance_rate": {
                "mae": round(float(mean_absolute_error(y_rate, pred_rate)), 2),
                "rmse": round(float(np.sqrt(mean_squared_error(y_rate, pred_rate))), 2),
                "r2": round(float(r2_score(y_rate, pred_rate)), 3)
            },
            "feature_importance": feat_imp,
            "model": "VotingRegressor (GradientBoosting + RandomForest)"
        }
    except HTTPException:
        raise
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


# ─────────────────────────────────────────────
#  PARTICIPATION PREDICTION
# ─────────────────────────────────────────────

def load_event_training_data() -> pd.DataFrame:
    """Load historical events with participation stats + engineered features."""
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(text("""
            SELECT
                e.id,
                e.start_at,
                e.end_at,
                COUNT(ep.id)                                          AS total_participants,
                SUM(CASE WHEN ep.status='ATTENDED'  THEN 1 ELSE 0 END) AS attended,
                SUM(CASE WHEN ep.status='CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
                (SELECT COUNT(*) FROM activities a WHERE a.event_id = e.id) AS n_activities
            FROM events e
            LEFT JOIN event_participations ep ON e.id = ep.event_id
            GROUP BY e.id
        """), conn)
    df["start_at"] = pd.to_datetime(df["start_at"], errors="coerce")
    df["end_at"]   = pd.to_datetime(df["end_at"],   errors="coerce")
    df["month"]         = df["start_at"].dt.month.fillna(6).astype(int)
    df["day_of_week"]   = df["start_at"].dt.dayofweek.fillna(2).astype(int)
    df["hour_of_start"] = df["start_at"].dt.hour.fillna(10).astype(int)
    df["duration_hours"] = ((df["end_at"] - df["start_at"]).dt.total_seconds() / 3600).clip(lower=0).fillna(8)
    # Engineered features
    df["is_weekend"]    = (df["day_of_week"] >= 5).astype(int)
    df["season"]        = df["month"].map(lambda m: 0 if m in [12,1,2] else 1 if m in [3,4,5] else 2 if m in [6,7,8] else 3)
    df["time_category"] = df["hour_of_start"].map(lambda h: 0 if h < 9 else 1 if h < 14 else 2 if h < 19 else 3)
    df["log_duration"]  = np.log1p(df["duration_hours"])
    # Interaction features
    df["act_x_season"]  = df["n_activities"] * df["season"]
    df["act_x_weekend"] = df["n_activities"] * df["is_weekend"]
    df["act_x_morning"] = df["n_activities"] * (df["hour_of_start"].between(6, 13)).astype(int)
    df["total_participants"] = df["total_participants"].fillna(0).astype(int)
    df["attended"]           = df["attended"].fillna(0).astype(int)
    df["attendance_rate"]    = np.where(
        df["total_participants"] > 0,
        (df["attended"] / df["total_participants"] * 100).round(1),
        0.0
    )
    return df


FEATURES = [
    "month", "day_of_week", "hour_of_start", "duration_hours", "n_activities",
    "is_weekend", "season", "time_category", "log_duration",
    "act_x_season", "act_x_weekend", "act_x_morning"
]


def _build_ensemble():
    gb = GradientBoostingRegressor(
        n_estimators=300, learning_rate=0.04,
        max_depth=4, min_samples_leaf=3,
        subsample=0.8, random_state=42
    )
    rf = RandomForestRegressor(
        n_estimators=200, max_depth=8,
        min_samples_leaf=3, random_state=42
    )
    return VotingRegressor(estimators=[("gb", gb), ("rf", rf)])


def train_models(df: pd.DataFrame):
    if len(df) < 3:
        return None, None
    X = df[FEATURES].values
    y_count = df["total_participants"].values.astype(float)
    y_rate  = df["attendance_rate"].values.astype(float)
    m_count = _build_ensemble()
    m_rate  = _build_ensemble()
    m_count.fit(X, y_count)
    m_rate.fit(X, y_rate)
    return m_count, m_rate


class ParticipationPredictionRequest(BaseModel):
    event_id: Optional[int] = None
    month: Optional[int] = None
    day_of_week: Optional[int] = None
    hour_of_start: Optional[int] = None
    duration_hours: Optional[float] = None
    n_activities: Optional[int] = None


class ParticipationPredictionResponse(BaseModel):
    predicted_participants: int
    predicted_attendance_rate: float
    confidence: str
    label: str
    insight: str


@app.post("/predict-participation", response_model=ParticipationPredictionResponse)
def predict_participation(req: ParticipationPredictionRequest):
    try:
        df = load_event_training_data()

        if req.event_id is not None:
            row = df[df["id"] == req.event_id]
            if row.empty:
                raise HTTPException(status_code=404, detail="Event not found")
            feats = row[FEATURES].values[0]
        else:
            if any(v is None for v in [req.month, req.day_of_week, req.hour_of_start, req.duration_hours, req.n_activities]):
                raise HTTPException(status_code=400, detail="Provide event_id or all feature fields")
            m   = req.month
            dow = req.day_of_week
            h   = req.hour_of_start
            dur = req.duration_hours
            na  = req.n_activities
            is_weekend    = 1 if dow >= 5 else 0
            season        = 0 if m in [12,1,2] else 1 if m in [3,4,5] else 2 if m in [6,7,8] else 3
            time_cat      = 0 if h < 9 else 1 if h < 14 else 2 if h < 19 else 3
            log_dur       = float(np.log1p(dur))
            act_x_season  = na * season
            act_x_weekend = na * is_weekend
            act_x_morning = na * (1 if 6 <= h <= 13 else 0)
            feats = np.array([m, dow, h, dur, na, is_weekend, season, time_cat,
                               log_dur, act_x_season, act_x_weekend, act_x_morning], dtype=float)

        rf_count, rf_rate = train_models(df)

        if rf_count is None:
            avg_count = int(df["total_participants"].mean()) if len(df) > 0 else 10
            avg_rate  = float(df["attendance_rate"].mean()) if len(df) > 0 else 50.0
            pred_count = avg_count
            pred_rate  = avg_rate
            confidence = "low"
        else:
            pred_count = max(0, int(round(rf_count.predict([feats])[0])))
            pred_rate  = float(round(min(100, max(0, rf_rate.predict([feats])[0])), 1))
            n_train = len(df)
            confidence = "high" if n_train >= 10 else ("medium" if n_train >= 5 else "low")

        if pred_rate >= 70:
            label   = "High Turnout"
            insight = f"Expected strong attendance ({pred_rate:.0f}%). Consider larger venue."
        elif pred_rate >= 40:
            label   = "Moderate Turnout"
            insight = f"Average attendance expected ({pred_rate:.0f}%). Standard preparations recommended."
        else:
            label   = "Low Turnout"
            insight = f"Below-average attendance predicted ({pred_rate:.0f}%). Boost promotion efforts."

        return ParticipationPredictionResponse(
            predicted_participants=pred_count,
            predicted_attendance_rate=pred_rate,
            confidence=confidence,
            label=label,
            insight=insight,
        )
    except HTTPException:
        raise
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))
