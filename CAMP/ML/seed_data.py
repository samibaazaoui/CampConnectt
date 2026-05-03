"""
CAMP ML Training Data Seeder
Injects realistic interaction data into the DB to train the recommendation model.

User profiles (simulated personas):
  - Group A (users 1-4,  14-17) : Nature lovers  → outdoor events (hike, safari, climbing)
  - Group B (users 5-8,  18-21) : Beach fans     → social events (bonfire, kayak, yoga)
  - Group C (users 9-11, 22-24) : Adventurers    → high-energy events
  - Group E (users 25-27)       : Culture/family → photography, family day, jamboree
  - Group F (users 28-30)       : Night owls     → stargazing, desert, night hike
  - Group D (users 12,13)       : Casual users   → few interactions (cold-start test)
"""

import pymysql
import random
from datetime import date, timedelta

DB = dict(host="localhost", port=3306, user="root", password="", database="camp_db", charset="utf8mb4")

# --- Data configuration ---
USER_IDS      = list(range(1, 31))   # users 1-30 (13 real + 17 synthetic)
CAMPSITE_IDS  = [1, 2, 3, 4, 5, 6, 7, 8, 9]
EVENT_IDS     = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

# Synthetic users to create (IDs 14-30)
SYNTHETIC_USERS = [
    (14, "alice.nature@camp.com",   "Alice Martin"),
    (15, "bob.forest@camp.com",     "Bob Dupont"),
    (16, "claire.trail@camp.com",   "Claire Rousseau"),
    (17, "david.hike@camp.com",     "David Bernard"),
    (18, "emma.beach@camp.com",     "Emma Petit"),
    (19, "felix.surf@camp.com",     "Felix Moreau"),
    (20, "grace.ocean@camp.com",    "Grace Simon"),
    (21, "hugo.wave@camp.com",      "Hugo Laurent"),
    (22, "iris.climb@camp.com",     "Iris Thomas"),
    (23, "jack.kayak@camp.com",     "Jack Robert"),
    (24, "kate.rapids@camp.com",    "Kate Michel"),
    (25, "leo.photo@camp.com",      "Leo Garcia"),
    (26, "mia.family@camp.com",     "Mia Roux"),
    (27, "noah.culture@camp.com",   "Noah David"),
    (28, "olivia.stars@camp.com",   "Olivia Leroy"),
    (29, "paul.desert@camp.com",    "Paul Bertrand"),
    (30, "quinn.night@camp.com",    "Quinn Morel"),
]

# ── Campsite preferences ──────────────────────────────────────────────────────
GROUP_A = {1: 5, 7: 5, 3: 4, 4: 3, 5: 2, 6: 1, 2: 2, 8: 1, 9: 1}  # nature
GROUP_B = {2: 5, 6: 5, 9: 4, 5: 3, 8: 3, 1: 2, 3: 1, 4: 1, 7: 1}  # beach
GROUP_C = {4: 5, 8: 5, 1: 4, 7: 4, 3: 3, 2: 3, 5: 2, 6: 2, 9: 2}  # adventure
GROUP_E = {3: 5, 1: 4, 5: 4, 7: 3, 2: 3, 4: 2, 6: 2, 8: 1, 9: 1}  # culture/family
GROUP_F = {4: 5, 9: 5, 7: 4, 1: 4, 3: 3, 2: 2, 5: 2, 6: 1, 8: 1}  # night/desert

# ── Event preferences ─────────────────────────────────────────────────────────
# A: nature/outdoor
EVENT_GROUP_A = {5: 5, 6: 5, 9: 5, 10: 5, 11: 5, 1: 4, 12: 4, 3: 3, 8: 3, 14: 3, 13: 2, 4: 2, 7: 2, 2: 1}
# B: beach/social
EVENT_GROUP_B = {7: 5, 8: 5, 13: 5, 14: 5, 12: 4, 4: 4, 1: 3, 2: 3, 10: 2, 3: 2, 5: 2, 11: 2, 6: 1, 9: 1}
# C: high-energy adventure
EVENT_GROUP_C = {5: 5, 6: 5, 8: 5, 9: 5, 12: 5, 11: 5, 1: 4, 10: 4, 4: 3, 7: 3, 14: 3, 13: 2, 2: 2, 3: 1}
# E: culture/family/photography
EVENT_GROUP_E = {1: 5, 10: 5, 13: 5, 14: 4, 3: 4, 11: 3, 7: 3, 12: 3, 5: 2, 4: 2, 8: 2, 6: 1, 9: 1, 2: 1}
# F: night/stars/desert
EVENT_GROUP_F = {12: 5, 5: 5, 1: 4, 9: 4, 6: 4, 11: 3, 10: 3, 8: 3, 14: 3, 4: 2, 7: 2, 13: 2, 2: 1, 3: 1}

GROUPS = {
    1:  GROUP_A, 2:  GROUP_A, 3:  GROUP_A, 4:  GROUP_A,
    5:  GROUP_B, 6:  GROUP_B, 7:  GROUP_B, 8:  GROUP_B,
    9:  GROUP_C, 10: GROUP_C, 11: GROUP_C,
    12: None,   13: None,
    14: GROUP_A, 15: GROUP_A, 16: GROUP_A, 17: GROUP_A,
    18: GROUP_B, 19: GROUP_B, 20: GROUP_B, 21: GROUP_B,
    22: GROUP_C, 23: GROUP_C, 24: GROUP_C,
    25: GROUP_E, 26: GROUP_E, 27: GROUP_E,
    28: GROUP_F, 29: GROUP_F, 30: GROUP_F,
}
EVENT_GROUPS = {
    1:  EVENT_GROUP_A, 2:  EVENT_GROUP_A, 3:  EVENT_GROUP_A, 4:  EVENT_GROUP_A,
    5:  EVENT_GROUP_B, 6:  EVENT_GROUP_B, 7:  EVENT_GROUP_B, 8:  EVENT_GROUP_B,
    9:  EVENT_GROUP_C, 10: EVENT_GROUP_C, 11: EVENT_GROUP_C,
    12: None,          13: None,
    14: EVENT_GROUP_A, 15: EVENT_GROUP_A, 16: EVENT_GROUP_A, 17: EVENT_GROUP_A,
    18: EVENT_GROUP_B, 19: EVENT_GROUP_B, 20: EVENT_GROUP_B, 21: EVENT_GROUP_B,
    22: EVENT_GROUP_C, 23: EVENT_GROUP_C, 24: EVENT_GROUP_C,
    25: EVENT_GROUP_E, 26: EVENT_GROUP_E, 27: EVENT_GROUP_E,
    28: EVENT_GROUP_F, 29: EVENT_GROUP_F, 30: EVENT_GROUP_F,
}

random.seed(42)


def weighted_sample(prefs: dict, k: int) -> list:
    items = list(prefs.keys())
    weights = [prefs[i] for i in items]
    chosen = []
    for _ in range(k):
        total = sum(weights)
        r = random.uniform(0, total)
        cum = 0
        for item, w in zip(items, weights):
            cum += w
            if r <= cum:
                chosen.append(item)
                break
    return list(set(chosen))


def noisy_rating(base: int) -> int:
    return max(1, min(5, base + random.choice([-1, 0, 0, 0, 1])))


def random_dates():
    start = date.today() - timedelta(days=random.randint(30, 365))
    end = start + timedelta(days=random.randint(1, 7))
    return start, end


def main():
    conn = pymysql.connect(**DB)
    cur = conn.cursor()

    # ── Create synthetic users 14-30 ──────────────────────────────────────────
    print("Creating synthetic users (14-30)...")
    # BCrypt hash for 'seed1234' — compatible with Spring BCryptPasswordEncoder
    SEED_PWD = "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"
    created = 0
    for uid, email, name in SYNTHETIC_USERS:
        cur.execute("SELECT id FROM users WHERE id=%s OR email=%s", (uid, email))
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO users (id, email, full_name, password, role) VALUES (%s,%s,%s,%s,'USER')",
                (uid, email, name, SEED_PWD)
            )
            created += 1
    conn.commit()
    print(f"  Created {created} new synthetic users.")

    # ── Clear existing synthetic data ──
    print("Clearing old synthetic interaction data...")
    cur.execute("DELETE FROM feedbacks WHERE id > 0")
    cur.execute("DELETE FROM reservations WHERE id > 0")
    cur.execute("DELETE FROM event_participations WHERE id > 0")
    conn.commit()
    print("Cleared.")

    feedbacks = []
    reservations = []
    participations = []

    for user_id in USER_IDS:
        prefs = GROUPS[user_id]
        event_prefs = EVENT_GROUPS[user_id]

        # ── Feedbacks (explicit ratings) ──
        if prefs:
            n_feedback = random.randint(3, 6)
            visited = weighted_sample(prefs, n_feedback)
            for cs_id in visited:
                base = prefs[cs_id]
                rating = noisy_rating(base)
                feedbacks.append((user_id, cs_id, rating, None))
        else:
            # Casual: 1-2 random feedbacks
            for cs_id in random.sample(CAMPSITE_IDS, random.randint(1, 2)):
                feedbacks.append((user_id, cs_id, random.randint(2, 4), None))

        # ── Reservations (implicit signals) ──
        if prefs:
            n_res = random.randint(2, 5)
            res_sites = weighted_sample(prefs, n_res)
            for cs_id in res_sites:
                start, end = random_dates()
                affinity = prefs[cs_id]
                if affinity >= 4:
                    status = random.choice(["CONFIRMED", "COMPLETED", "COMPLETED"])
                elif affinity == 3:
                    status = random.choice(["CONFIRMED", "PENDING", "COMPLETED"])
                else:
                    status = random.choice(["PENDING", "CANCELLED"])
                reservations.append((user_id, cs_id, start, end, status))
        else:
            start, end = random_dates()
            cs_id = random.choice(CAMPSITE_IDS)
            reservations.append((user_id, cs_id, start, end, "PENDING"))

        # ── Event participations ──
        if event_prefs:
            n_events = random.randint(5, 9)   # increased from 2-4 to 5-9
            ev_ids = weighted_sample(event_prefs, n_events)
            for ev_id in ev_ids:
                affinity = event_prefs[ev_id]
                if affinity >= 4:
                    status = random.choice(["ATTENDED", "ATTENDED", "REGISTERED"])
                else:
                    status = random.choice(["REGISTERED", "CANCELLED"])
                qr = f"seed-{user_id}-{ev_id}-{random.randint(1000,9999)}"
                participations.append((ev_id, user_id, status, qr))
        else:
            ev_id = random.choice(EVENT_IDS)
            qr = f"seed-{user_id}-{ev_id}-{random.randint(1000,9999)}"
            participations.append((ev_id, user_id, "REGISTERED", qr))

    # ── Insert feedbacks ──
    print(f"Inserting {len(feedbacks)} feedbacks...")
    cur.executemany(
        "INSERT INTO feedbacks (user_id, campsite_id, rating, comment) VALUES (%s, %s, %s, %s)",
        feedbacks
    )

    # ── Insert reservations ──
    print(f"Inserting {len(reservations)} reservations...")
    cur.executemany(
        "INSERT INTO reservations (user_id, campsite_id, start_date, end_date, status) VALUES (%s, %s, %s, %s, %s)",
        reservations
    )

    # ── Insert event_participations ──
    print(f"Inserting {len(participations)} event participations...")
    # Avoid duplicate (event_id, user_id) if qr_token unique constraint exists
    seen = set()
    unique_parts = []
    for p in participations:
        key = (p[0], p[1])
        if key not in seen:
            seen.add(key)
            unique_parts.append(p)
    cur.executemany(
        "INSERT INTO event_participations (event_id, user_id, status, qr_token) VALUES (%s, %s, %s, %s)",
        unique_parts
    )

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n[OK] Done! Inserted:")
    print(f"   {len(feedbacks)} feedbacks")
    print(f"   {len(reservations)} reservations")
    print(f"   {len(unique_parts)} event participations")
    print("\nML model is now ready to produce meaningful recommendations.")


if __name__ == "__main__":
    main()
