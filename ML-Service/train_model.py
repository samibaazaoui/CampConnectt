# train.py - ML Model Training with Algorithm Comparison
# =====================================================
import pandas as pd
import numpy as np
import re
import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB, BernoulliNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score, StratifiedKFold, train_test_split
from sklearn.metrics import classification_report, confusion_matrix, f1_score, accuracy_score, precision_score, recall_score
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== PRÉTRAITEMENT DU TEXTE ====================
def preprocess_text(text):
    """
    Nettoyage avancé du texte pour FR/EN
    - Lowercase
    - Suppression URLs, emails, mentions
    - Normalisation ponctuation
    - Gestion des emojis (optionnel)
    """
    if not isinstance(text, str):
        return ""
    
    # Lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)
    
    # Remove emails
    text = re.sub(r'\S+@\S+', '', text)
    
    # Remove mentions (@user) and hashtags (#tag) - keep the word
    text = re.sub(r'@\w+|#\w+', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Keep only letters, numbers, spaces, and basic punctuation (for FR/EN)
    text = re.sub(r'[^a-z0-9\s\.\,\!\?\;\:\'\-]', ' ', text)
    
    return text


# ==================== LISTES BAD WORDS (FR + EN) ====================
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

ALL_BAD_WORDS = list(set(BAD_WORDS_EN + BAD_WORDS_FR))  # Remove duplicates


# ==================== DÉTECTION BAD WORDS ====================
def detect_bad_words(text: str) -> list:
    """Détecte les mots inappropriés avec regex précise"""
    text_lower = text.lower()
    found = []
    
    for word in ALL_BAD_WORDS:
        if ' ' in word:
            # Phrase complète
            if word in text_lower:
                found.append(word)
        else:
            # Mot entier avec word boundaries
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, text_lower):
                found.append(word)
    
    return list(set(found))  # Remove duplicates


# ==================== RÈGLES SPAM HEURISTIQUES ====================
def detect_spam_rules(text: str) -> tuple:
    """
    Détection basée sur des motifs spam typiques
    Retourne: (is_spam: bool, confidence: float, reason: str)
    """
    text_lower = text.lower()
    
    # Patterns spam forts (confiance élevée)
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
    
    # Patterns spam moyens (confiance moyenne)
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


# ==================== CONFIGURATION DES MODÈLES ====================
def get_model_configs():
    """
    Configuration de plusieurs algorithmes pour comparaison
    Chaque modèle est testé, le meilleur est sélectionné
    """
    return {
        'naive_bayes': {
            'model': MultinomialNB(alpha=0.1),
            'name': 'Naive Bayes',
            'desc': 'Rapide, bon pour petit dataset, interprétable'
        },
        'logistic_regression': {
            'model': LogisticRegression(
                C=1.0, 
                class_weight='balanced', 
                max_iter=1000, 
                random_state=42,
                solver='lbfgs'
            ),
            'name': 'Logistic Regression',
            'desc': 'Bon équilibre précision/rappel, robuste'
        },
        'random_forest': {
            'model': RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                class_weight='balanced',
                random_state=42,
                n_jobs=-1
            ),
            'name': 'Random Forest',
            'desc': 'Puissant, gère bien le bruit, feature importance'
        },
        'gradient_boosting': {
            'model': GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42
            ),
            'name': 'Gradient Boosting',
            'desc': 'Très performant mais plus lent à entraîner'
        },
        'linear_svc': {
            'model': LinearSVC(
                C=1.0,
                class_weight='balanced',
                max_iter=1000,
                random_state=42
            ),
            'name': 'Linear SVM',
            'desc': 'Excellent pour texte haute dimension'
        }
    }


# ==================== ENTRAÎNEMENT PRINCIPAL ====================
def train():
    logger.info("🚀 Starting ML model training...")
    
    # 1. Charger et prétraiter les données
    if not os.path.exists('dataset.csv'):
        logger.error("❌ dataset.csv not found! Run collect.py first.")
        return
    
    data = pd.read_csv('dataset.csv')
    logger.info(f"📊 Dataset loaded: {len(data)} samples")
    
    # Nettoyage baseline
    data = data.dropna(subset=['text', 'label'])
    data['text_clean'] = data['text'].apply(preprocess_text)
    
    # Stats des classes
    ham_count = (data['label'] == 0).sum()
    spam_count = (data['label'] == 1).sum()
    logger.info(f"   Ham (legitimate): {ham_count} ({ham_count/len(data)*100:.1f}%)")
    logger.info(f"   Spam: {spam_count} ({spam_count/len(data)*100:.1f}%)")
    
    if spam_count == 0 or ham_count == 0:
        logger.error("❌ Dataset must contain both ham and spam samples!")
        return
    
    # 2. Split train/test pour évaluation finale
    X_train, X_test, y_train, y_test = train_test_split(
        data['text_clean'], 
        data['label'], 
        test_size=0.2, 
        stratify=data['label'],  # Garde la proportion spam/ham
        random_state=42
    )
    
    logger.info(f"   Train set: {len(X_train)} samples | Test set: {len(X_test)} samples")
    
    # 3. Configuration du vectorizer TF-IDF (commun à tous les modèles)
    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words=None,  # On garde tout pour FR/EN
        ngram_range=(1, 3),      # Unigrams + bigrams + trigrams
        max_features=10000,       # Plus de features = plus de contexte
        sublinear_tf=True,        # Scaling non-linéaire
        min_df=2,                 # Ignore termes trop rares (bruit)
        max_df=0.9,              # Ignore termes trop fréquents
        token_pattern=r'(?u)\b[a-z][a-z]+\b'  # Tokens alphabétiques uniquement
    )
    
    # 4. Tester tous les modèles et comparer
    results = []
    best_model = None
    best_f1 = 0
    
    logger.info("\n🔬 Testing multiple algorithms...")
    logger.info("-" * 60)
    
    for key, config in get_model_configs().items():
        logger.info(f"\n🧪 Testing {config['name']}...")
        
        # Pipeline complet
        pipeline = Pipeline([
            ('tfidf', vectorizer),
            ('clf', config['model'])
        ])
        
        try:
            # Cross-validation stratifiée 5-fold
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            
            # Métriques multiples
            f1_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring='f1')
            acc_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring='accuracy')
            prec_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring='precision')
            rec_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring='recall')
            
            # Entraînement sur train set complet pour test final
            pipeline.fit(X_train, y_train)
            y_pred = pipeline.predict(X_test)
            
            # Métriques sur test set
            test_f1 = f1_score(y_test, y_pred)
            test_acc = accuracy_score(y_test, y_pred)
            test_prec = precision_score(y_test, y_pred)
            test_rec = recall_score(y_test, y_pred)
            
            result = {
                'key': key,
                'name': config['name'],
                'desc': config['desc'],
                'cv_f1_mean': f1_scores.mean(),
                'cv_f1_std': f1_scores.std(),
                'cv_acc_mean': acc_scores.mean(),
                'test_f1': test_f1,
                'test_acc': test_acc,
                'test_precision': test_prec,
                'test_recall': test_rec,
                'pipeline': pipeline
            }
            results.append(result)
            
            logger.info(f"   CV F1: {f1_scores.mean():.4f} (+/- {f1_scores.std()*2:.4f})")
            logger.info(f"   Test F1: {test_f1:.4f} | Acc: {test_acc:.4f}")
            logger.info(f"   Precision: {test_prec:.4f} | Recall: {test_rec:.4f}")
            
            # Sélection du meilleur modèle par F1-score (équilibre précision/rappel)
            if test_f1 > best_f1:
                best_f1 = test_f1
                best_model = result
                logger.info(f"   ✅ New best model!")
                
        except Exception as e:
            logger.warning(f"   ⚠️ {config['name']} failed: {e}")
            continue
    
    # 5. Afficher le classement
    logger.info("\n" + "=" * 60)
    logger.info("🏆 MODEL RANKING (by Test F1-Score):")
    logger.info("=" * 60)
    
    results_sorted = sorted(results, key=lambda x: x['test_f1'], reverse=True)
    for i, r in enumerate(results_sorted, 1):
        medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "  "
        logger.info(f"{medal} {i}. {r['name']}: F1={r['test_f1']:.4f} | Acc={r['test_acc']:.4f}")
        logger.info(f"      {r['desc']}")
    
    if not best_model:
        logger.error("❌ No model could be trained!")
        return
    
    # 6. Rapport détaillé du meilleur modèle
    logger.info(f"\n📋 Detailed Report - Best Model: {best_model['name']}")
    logger.info("-" * 60)
    
    y_pred_best = best_model['pipeline'].predict(X_test)
    print(classification_report(y_test, y_pred_best, target_names=['Ham', 'Spam']))
    
    # Matrice de confusion
    cm = confusion_matrix(y_test, y_pred_best)
    logger.info(f"Confusion Matrix:\n{cm}")
    logger.info(f"  True Ham: {cm[0][0]} | False Spam: {cm[0][1]}")
    logger.info(f"  False Ham: {cm[1][0]} | True Spam: {cm[1][1]}")
    
    # 7. Feature Importance (si disponible)
    try:
        vectorizer_fitted = best_model['pipeline'].named_steps['tfidf']
        classifier = best_model['pipeline'].named_steps['clf']
        
        if hasattr(classifier, 'coef_'):
            feature_names = vectorizer_fitted.get_feature_names_out()
            coef = classifier.coef_[0]
            
            # Top 15 mots les plus "spammy"
            top_spam = sorted(zip(coef, feature_names), reverse=True)[:15]
            logger.info("\n🔍 Top 15 Spam Indicators:")
            for coef_val, word in top_spam:
                logger.info(f"   {word}: {coef_val:.3f}")
            
            # Top 15 mots les plus "ham"
            top_ham = sorted(zip(coef, feature_names))[:15]
            logger.info("\n🔍 Top 15 Ham Indicators:")
            for coef_val, word in top_ham:
                logger.info(f"   {word}: {abs(coef_val):.3f}")
                
    except Exception as e:
        logger.warning(f"⚠️ Could not extract feature importance: {e}")
    
    # 8. Test sur exemples réels
    logger.info("\n🧪 Live Prediction Tests:")
    test_examples = [
        ("BUY NOW! FREE MONEY CLICK HERE!", 1),
        ("J'adore le camping en forêt", 0),
        ("Win a prize! Enter your credit card!", 1),
        ("Quelles chaussures pour la randonnée ?", 0),
        ("fuck you stupid idiot", 1),
        ("merde va te faire foutre", 1),
        ("Get rich quick with forex trading", 1),
        ("Le coucher de soleil à Sidi Bou Said est magnifique", 0),
        ("URGENT: Your account is locked! Verify here", 1),
        ("Superbe expérience au Cap Bon ce weekend", 0),
    ]
    
    for text, expected in test_examples:
        clean = preprocess_text(text)
        pred = best_model['pipeline'].predict([clean])[0]
        probs = best_model['pipeline'].predict_proba([clean])[0]
        confidence = probs[1] if pred == 1 else probs[0]
        
        status = "✅" if pred == expected else "❌"
        label = "🚫 SPAM" if pred == 1 else "✅ HAM"
        logger.info(f"   {status} {label} (conf: {confidence:.2%}) | '{text[:50]}...'")
    
    # 9. Sauvegarde du modèle
    model_path = 'spam_model.joblib'
    joblib.dump(best_model['pipeline'], model_path)
    logger.info(f"\n💾 Best model saved: {model_path}")
    
    # 10. Metadata pour le déploiement
    metadata = {
        'model_name': best_model['name'],
        'algorithm': best_model['key'],
        'test_f1': best_f1,
        'test_accuracy': best_model['test_acc'],
        'test_precision': best_model['test_precision'],
        'test_recall': best_model['test_recall'],
        'cv_f1_mean': best_model['cv_f1_mean'],
        'cv_f1_std': best_model['cv_f1_std'],
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'spam_ratio': spam_count / len(data),
        'bad_words_count': len(ALL_BAD_WORDS),
        'timestamp': pd.Timestamp.now().isoformat(),
        'version': '2.0.0'
    }
    
    metadata_path = 'model_metadata.json'
    import json
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    logger.info(f"📄 Metadata saved: {metadata_path}")
    
    logger.info("\n✨ Training completed successfully!")
    logger.info(f"🎯 Best model: {best_model['name']} with F1={best_f1:.4f}")
    
    return best_model


if __name__ == "__main__":
    train()