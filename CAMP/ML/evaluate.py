"""
CAMP Recommendation Engine — Model Evaluation
=============================================
Métriques calculées :
  - Hit Rate@K      : au moins 1 item pertinent dans le top-K
  - Precision@K     : nb items pertinents dans top-K / K
  - Recall@K        : nb items pertinents dans top-K / total items pertinents
  - NDCG@K          : qualité du classement (bonus si item pertinent est haut)
  - MAE / RMSE      : erreur de prédiction de score
  - Coverage        : % des items jamais recommandés
  - Personalization : diversité entre les recommandations de différents utilisateurs
"""

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, VotingRegressor
from sklearn.model_selection import KFold, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import warnings
warnings.filterwarnings("ignore")

from main import collaborative_filter, _mean_center, _svd_scores, _popularity_scores, load_event_training_data, FEATURES

# ─── DB ────────────────────────────────────────────────────────────────────────
DB_URL = "mysql+pymysql://root:@localhost:3306/camp_db?charset=utf8mb4"

def get_engine():
    return create_engine(DB_URL, pool_pre_ping=True)

def load_campsite_interactions():
    engine = get_engine()
    with engine.connect() as conn:
        feedback = pd.read_sql(text(
            "SELECT user_id, campsite_id AS item_id, CAST(rating AS FLOAT) AS rating FROM feedbacks"
        ), conn)
        reservations = pd.read_sql(text(
            "SELECT user_id, campsite_id AS item_id, status FROM reservations WHERE campsite_id IS NOT NULL"
        ), conn)
    scores = {"COMPLETED": 4.5, "CONFIRMED": 3.5, "PENDING": 2.0, "CANCELLED": 0.5}
    reservations["rating"] = reservations["status"].map(scores).fillna(1.0)
    combined = pd.concat([feedback[["user_id","item_id","rating"]],
                          reservations[["user_id","item_id","rating"]]])
    combined["rating"] = pd.to_numeric(combined["rating"], errors="coerce").fillna(1.0)
    return combined.groupby(["user_id","item_id"])["rating"].max().reset_index()

def load_event_interactions():
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(text(
            "SELECT user_id, event_id AS item_id, status FROM event_participations"
        ), conn)
    scores = {"ATTENDED": 5.0, "REGISTERED": 3.0, "CANCELLED": 0.5}
    df["rating"] = pd.to_numeric(df["status"].map(scores), errors="coerce").fillna(2.0)
    return df[["user_id","item_id","rating"]]

# ─── Recommender core ──────────────────────────────────────────────────────────
def build_matrix(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()
    return df.pivot_table(
        index="user_id", columns="item_id",
        values="rating", aggfunc="mean", fill_value=0
    ).astype(float)

def recommend(user_id: int, matrix: pd.DataFrame, n: int, exclude: set):
    return collaborative_filter(user_id, matrix, n, exclude)

# ─── Metric helpers ────────────────────────────────────────────────────────────
def dcg(relevant_positions, k):
    score = 0.0
    for pos in relevant_positions:
        if pos < k:
            score += 1.0 / np.log2(pos + 2)
    return score

def ndcg_at_k(recs, relevant_set, k):
    hits = [1 if r in relevant_set else 0 for r in recs[:k]]
    actual_dcg = sum(h / np.log2(i + 2) for i, h in enumerate(hits))
    ideal_dcg  = sum(1.0 / np.log2(i + 2) for i in range(min(len(relevant_set), k)))
    return actual_dcg / ideal_dcg if ideal_dcg > 0 else 0.0

# ─── Leave-One-Out Evaluation ──────────────────────────────────────────────────
def evaluate(df: pd.DataFrame, label: str, k_values=(1, 3, 5), threshold=3.0):
    print(f"\n{'='*60}")
    print(f"  Evaluation : {label.upper()}")
    print(f"{'='*60}")
    print(f"  Interactions totales : {len(df)}")
    print(f"  Utilisateurs uniques : {df['user_id'].nunique()}")
    print(f"  Items uniques        : {df['item_id'].nunique()}")
    print(f"  Seuil de pertinence  : rating >= {threshold}")

    positive = df[df["rating"] >= threshold]
    eligible = positive.groupby("user_id").filter(lambda x: len(x) >= 2)

    if eligible.empty:
        print("  [!] Pas assez d'interactions positives pour évaluer.")
        return

    print(f"  Utilisateurs éligibles (>=2 positifs) : {eligible['user_id'].nunique()}")

    metrics = {k: {"hit": [], "precision": [], "recall": [], "ndcg": []} for k in k_values}
    mae_scores, rmse_scores = [], []
    all_recs = {k: [] for k in k_values}
    all_items = set(df["item_id"].unique())

    users = eligible["user_id"].unique()
    for uid in users:
        user_pos = eligible[eligible["user_id"] == uid]
        # Leave-one-out: hold out 1 positive item
        held_out = user_pos.sample(1, random_state=42).iloc[0]
        held_item = held_out["item_id"]
        held_rating = held_out["rating"]

        train_df = df[~((df["user_id"] == uid) & (df["item_id"] == held_item))]
        matrix = build_matrix(train_df)

        known_items = set(df[df["user_id"] == uid]["item_id"].tolist()) - {held_item}

        for k in k_values:
            recs = recommend(uid, matrix, k, known_items)
            relevant_set = {held_item}
            hit   = 1 if held_item in recs else 0
            prec  = hit / k
            rec_v = hit / 1
            ndcg  = ndcg_at_k(recs, relevant_set, k)
            metrics[k]["hit"].append(hit)
            metrics[k]["precision"].append(prec)
            metrics[k]["recall"].append(rec_v)
            metrics[k]["ndcg"].append(ndcg)
            all_recs[k].extend(recs)

        # MAE / RMSE — predict rating for held-out item
        full_matrix = build_matrix(train_df)
        if uid in full_matrix.index and held_item in full_matrix.columns:
            predicted = float(full_matrix.loc[uid, held_item])
        else:
            predicted = float(df["rating"].mean())
        mae_scores.append(abs(predicted - held_rating))
        rmse_scores.append((predicted - held_rating) ** 2)

    # ── Print metric table ────────────────────────────────────────────
    print(f"\n  {'Metric':<20}", end="")
    for k in k_values:
        print(f"  @K={k:<5}", end="")
    print()
    print("  " + "-"*55)

    for metric_name in ["hit", "precision", "recall", "ndcg"]:
        label_map = {"hit": "Hit Rate", "precision": "Precision",
                     "recall": "Recall", "ndcg": "NDCG"}
        print(f"  {label_map[metric_name]:<20}", end="")
        for k in k_values:
            val = np.mean(metrics[k][metric_name])
            print(f"  {val:.4f}     ", end="")
        print()

    if mae_scores:
        mae  = np.mean(mae_scores)
        rmse = np.sqrt(np.mean(rmse_scores))
        print(f"\n  {'MAE':<20}  {mae:.4f}")
        print(f"  {'RMSE':<20}  {rmse:.4f}")

    # ── Coverage ─────────────────────────────────────────────────────
    print(f"\n  {'--- Coverage & Diversity ---':}")
    for k in k_values:
        unique_recs = set(all_recs[k])
        coverage = len(unique_recs) / len(all_items) * 100 if all_items else 0
        print(f"  Coverage @K={k}  : {len(unique_recs)}/{len(all_items)} items = {coverage:.1f}%")

    # ── Personalization (intra-list diversity) ────────────────────────
    k = max(k_values)
    user_recs = {}
    for uid in users:
        known_items = set(df[df["user_id"] == uid]["item_id"].tolist())
        user_recs[uid] = set(recommend(uid, build_matrix(df), k, known_items))

    pairs, diversity_sum = 0, 0
    ulist = list(users)
    for i in range(len(ulist)):
        for j in range(i+1, len(ulist)):
            r1, r2 = user_recs[ulist[i]], user_recs[ulist[j]]
            union = r1 | r2
            inter = r1 & r2
            diversity_sum += 1 - (len(inter) / len(union) if union else 0)
            pairs += 1
    personalization = diversity_sum / pairs if pairs > 0 else 0
    print(f"  Personalization @K={k}: {personalization:.4f}  (1.0 = totalement diversifié)")


def bar(value, max_val=1.0, width=30, fill="#", empty="-"):
    filled = int(round(value / max_val * width))
    return fill * filled + empty * (width - filled)


def evaluate_prediction_model():
    SEP = "-" * 60
    SEP2 = "-" * 56
    print(f"\n{SEP}")
    print("  MODELE DE PREDICTION DU TAUX DE PARTICIPATION")
    print(SEP)

    df = load_event_training_data()
    print(f"  Evenements charges     : {len(df)}")
    print(f"  Participants (moy.)    : {df['total_participants'].mean():.1f}")
    print(f"  Taux presence (moy.)   : {df['attendance_rate'].mean():.1f}%")

    if len(df) < 5:
        print("  [!] Pas assez de donnees (< 5 evenements).")
        return

    X = df[FEATURES].values
    y_count = df["total_participants"].values.astype(float)
    y_rate  = df["attendance_rate"].values.astype(float)

    kf  = KFold(n_splits=5, shuffle=True, random_state=42)
    ensemble = VotingRegressor(estimators=[
        ("gb", GradientBoostingRegressor(n_estimators=300, learning_rate=0.04, max_depth=4, min_samples_leaf=3, subsample=0.8, random_state=42)),
        ("rf", RandomForestRegressor(n_estimators=200, max_depth=8, min_samples_leaf=3, random_state=42))
    ])

    print(f"\n  {SEP2}")
    print("  K-Fold Cross-Validation (k=5) - VotingRegressor (GBM + RF)")
    print(f"  {SEP2}")

    for target_name, y in [("Nb Participants", y_count), ("Taux de Presence (%)", y_rate)]:
        mae_scores  = -cross_val_score(ensemble, X, y, cv=kf, scoring="neg_mean_absolute_error")
        rmse_scores = np.sqrt(-cross_val_score(ensemble, X, y, cv=kf, scoring="neg_mean_squared_error"))
        r2_scores   = cross_val_score(ensemble, X, y, cv=kf, scoring="r2")

        print(f"\n  Target : {target_name}")
        print(f"    MAE   : {mae_scores.mean():.3f}  +/- {mae_scores.std():.3f}")
        print(f"    RMSE  : {rmse_scores.mean():.3f}  +/- {rmse_scores.std():.3f}")
        r2_val = r2_scores.mean()
        r2_bar = bar(max(0, r2_val), max_val=1.0, width=25)
        print(f"    R2    : {r2_val:.3f}  [{r2_bar}]")
        rating = "Excellent" if r2_val > 0.8 else "Bon" if r2_val > 0.6 else "Moyen" if r2_val > 0.4 else "Faible"
        print(f"    Qualite : {rating}")

    print(f"\n  {SEP2}")
    print("  Importance des Features (GBM)")
    print(f"  {SEP2}")
    gb_fi = GradientBoostingRegressor(n_estimators=300, learning_rate=0.04, max_depth=4, min_samples_leaf=3, subsample=0.8, random_state=42)
    gb_fi.fit(X, y_count)
    importances = gb_fi.feature_importances_
    feat_imp = sorted(zip(FEATURES, importances), key=lambda x: x[1], reverse=True)
    max_imp = feat_imp[0][1]
    for feat, imp in feat_imp:
        b = bar(imp, max_val=max_imp, width=25)
        print(f"    {feat:<20} {b}  {imp*100:.1f}%")

    print(f"\n  {SEP2}")
    print("  Prediction vs Realite (10 premiers evenements)")
    print(f"  {SEP2}")
    m_count = VotingRegressor(estimators=[
        ("gb", GradientBoostingRegressor(n_estimators=300, learning_rate=0.04, max_depth=4, min_samples_leaf=3, subsample=0.8, random_state=42)),
        ("rf", RandomForestRegressor(n_estimators=200, max_depth=8, min_samples_leaf=3, random_state=42))
    ])
    m_rate = VotingRegressor(estimators=[
        ("gb", GradientBoostingRegressor(n_estimators=300, learning_rate=0.04, max_depth=4, min_samples_leaf=3, subsample=0.8, random_state=42)),
        ("rf", RandomForestRegressor(n_estimators=200, max_depth=8, min_samples_leaf=3, random_state=42))
    ])
    m_count.fit(X, y_count)
    m_rate.fit(X, y_rate)

    pred_count = m_count.predict(X)
    pred_rate  = m_rate.predict(X)
    sample_df = df[["total_participants", "attendance_rate"]].copy()
    sample_df["pred_count"] = pred_count.round(0).astype(int)
    sample_df["pred_rate"]  = pred_rate.round(1)

    print(f"  {'Reel participants':>18} | {'Predit':>7} | {'Reel taux':>10} | {'Predit':>7}")
    print(f"  {'-'*52}")
    for _, row in sample_df.head(10).iterrows():
        diff_c = "OK" if abs(row['total_participants'] - row['pred_count']) <= 3 else "!!"
        diff_r = "OK" if abs(row['attendance_rate'] - row['pred_rate']) <= 10 else "!!"
        print(f"  {int(row['total_participants']):>18} | {int(row['pred_count']):>7} {diff_c}| {row['attendance_rate']:>9.1f}% | {row['pred_rate']:>6.1f}% {diff_r}")

    mae_c  = mean_absolute_error(y_count, pred_count)
    rmse_c = np.sqrt(mean_squared_error(y_count, pred_count))
    r2_c   = r2_score(y_count, pred_count)
    mae_r  = mean_absolute_error(y_rate, pred_rate)
    rmse_r = np.sqrt(mean_squared_error(y_rate, pred_rate))
    r2_r   = r2_score(y_rate, pred_rate)

    print(f"\n  {SEP2}")
    print("  Metriques finales (entrainement complet)")
    print(f"  {SEP2}")
    print(f"  Participants  -> MAE: {mae_c:.2f}  RMSE: {rmse_c:.2f}  R2: {r2_c:.3f}")
    print(f"  Taux presence -> MAE: {mae_r:.2f}%  RMSE: {rmse_r:.2f}%  R2: {r2_r:.3f}")


# ─── Main ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "-"*60)
    print("  CAMP ML — Rapport d'évaluation du modèle")
    print("-"*60)
    print("="*60)

    camp_df  = load_campsite_interactions()
    event_df = load_event_interactions()

    evaluate(camp_df,  label="Campsites",  k_values=(1, 3, 5), threshold=3.0)
    evaluate(event_df, label="Événements", k_values=(1, 3, 5), threshold=3.0)

    evaluate_prediction_model()

    print("\n" + "="*60)
    print("  Légende")
    print("="*60)
    print("  Hit Rate@K    : % d'utilisateurs avec au moins 1 bon item dans le top-K")
    print("  Precision@K   : % d'items recommandés qui sont pertinents")
    print("  Recall@K      : % d'items pertinents qui ont été trouvés")
    print("  NDCG@K        : qualité du classement (bonus si pertinent en haut)")
    print("  MAE           : erreur absolue moyenne de prédiction de score")
    print("  RMSE          : erreur quadratique moyenne")
    print("  Coverage      : diversité catalogue (% items jamais recommandés)")
    print("  Personalization: diversité entre users (0=identique, 1=unique)")
    print("  R²            : coefficient de détermination (1.0 = parfait)")
    print()
