"""
CAMP — Prediction Model Data Seeder
Injects 40 synthetic historical events with varied features
so the participation prediction model has enough data to learn from.

Patterns injected (realistic):
  - Summer (June-Aug)  → higher attendance
  - Weekends (Sat/Sun) → higher attendance
  - More activities    → more participants
  - Short evening events → lower attendance
  - Multi-day events   → moderate attendance
"""

import pymysql
import uuid
import random
from datetime import datetime, timedelta

DB = dict(host="localhost", port=3306, user="root", password="", database="camp_db", charset="utf8mb4")

ADMIN_USER_ID = 1   # created_by_id for synthetic events

# ── Synthetic event templates ──────────────────────────────────────────────────
EVENTS = [
    # (title, location, month, day_of_week, hour_start, duration_hours, n_activities, base_participants, base_attendance_rate)
    # Summer high-attendance events
    ("Summer Hike Marathon",     "Atlas Mountains",    7,  5, 7,   8,  4, 22, 75),
    ("Beach Volleyball Open",    "Hammamet Beach",     7,  6, 9,   6,  3, 18, 70),
    ("Mountain Trek Festival",   "Chelia Summit",      8,  5, 6,  16,  5, 25, 80),
    ("River Kayak Challenge",    "Ain Drahem",         8,  6, 8,   8,  3, 20, 72),
    ("Stargazing Night Party",   "Sahara Desert",      7,  4, 20,  9,  2, 16, 68),
    ("Wildlife Photography Day", "Ichkeul Lake",       6,  5, 6,  10,  4, 21, 74),
    ("Sunset Yoga Retreat",      "Sidi Bou Said",      6,  6, 17,  5,  2, 14, 65),
    ("Forest Survival Camp",     "Beja Forest",        8,  5, 9,  48,  5, 19, 71),
    ("Camping Cooking Battle",   "Makhtar Ruins",      7,  5, 10,  7,  3, 17, 66),
    ("Canyoning Adventure",      "Tamerza Canyon",     8,  6, 7,  10,  4, 23, 78),
    # Spring moderate-attendance events
    ("Spring Flower Walk",       "Nabeul Fields",      4,  5, 9,   5,  2, 14, 55),
    ("Bird Watching Tour",       "Beni Mtir",          3,  5, 7,   6,  3, 12, 52),
    ("Cycling City Challenge",   "Tunis Center",       4,  6, 8,   6,  2, 15, 58),
    ("Rock Climbing Intro",      "Zaghouan Cliff",     5,  5, 9,   8,  3, 13, 54),
    ("Trail Running Race",       "Borj Cedria",        5,  6, 7,   5,  2, 16, 60),
    ("Photography Workshop",     "Medina Tunis",       4,  3, 10,  6,  3, 11, 50),
    ("Orienteering Challenge",   "Ennahli Forest",     3,  6, 9,   7,  2, 13, 53),
    ("Cultural Heritage Walk",   "Carthage Site",      5,  6, 10,  4,  2, 12, 48),
    ("Archery Tournament",       "Ariana Park",        4,  5, 11,  6,  3, 10, 45),
    ("Lake Swimming Challenge",  "Bir M'Cherga",       5,  5, 9,   5,  2, 14, 57),
    # Autumn low-to-moderate
    ("Harvest Festival Walk",    "Cap Bon Fields",     9,  6, 10,  7,  3, 11, 44),
    ("Autumn Trail Hike",        "Jugurtha Table",    10,  5, 8,  10,  3, 10, 42),
    ("Astronomy Night",          "Douz Desert",       11,  4, 20,  8,  1,  9, 38),
    ("Mushroom Foraging Walk",   "Tabarka Forest",    10,  6, 9,   5,  2,  8, 40),
    ("Off-Road Biking Tour",     "Dougga Ruins",       9,  5, 8,   8,  2, 10, 43),
    # Winter low-attendance
    ("Winter Trekking Camp",     "Ain Drahem",        12,  5, 9,  24,  4,  8, 35),
    ("New Year Nature Walk",     "Bizerte Coast",      1,  3, 10,  4,  1,  7, 32),
    ("Indoor Survival Skills",   "Ariana Hall",        1,  1, 10,  6,  3,  6, 30),
    ("February Mud Run",         "Soukra Fields",      2,  5, 8,   5,  2,  9, 38),
    ("Cold Weather Camping",     "Ain Bou Monchar",   12,  4, 8,  36,  4,  7, 33),
    # Evening low-turnout events
    ("Night Fishing Trip",       "Bizerte Lake",       6,  4, 20,  5,  1,  8, 30),
    ("Evening Meditation",       "Sidi Bou Said",      7,  1, 19,  3,  1,  6, 28),
    ("Moonlight Hike",           "Zaghouan Hill",      9,  5, 21,  4,  1,  7, 32),
    ("Late Night Observatory",   "Borj Cedria",       11,  3, 21,  4,  1,  5, 25),
    # Weekday low-attendance
    ("Midweek Yoga Session",     "Lac Park Tunis",     6,  1, 7,   2,  1,  5, 28),
    ("Tuesday Trail Run",        "Ennahli Forest",     5,  1, 6,   3,  1,  6, 30),
    ("Wednesday Workshop",       "Ariana Hub",         4,  2, 10,  5,  2,  7, 35),
    ("Thursday Night Hike",      "Bou Kornine",        8,  3, 18,  4,  1,  8, 36),
    # Large multi-day events
    ("3-Day Summit Expedition",  "Chelia Summit",      7,  4, 7,  72,  6, 30, 82),
    ("Annual Explorer Festival", "Dougga Ruins",       6,  5, 9,  48,  7, 35, 85),
    # Batch 2 — more seasonal variety
    ("July Beach Marathon",       "Sousse Shore",      7,  6, 7,   5,  3, 24, 78),
    ("August Surf Camp",          "Hammamet",          8,  5, 8,  48,  4, 28, 80),
    ("June Night Walk",           "Sidi Bou Said",     6,  4, 20,  4,  1, 10, 35),
    ("October Forest Trail",      "Ain Drahem",       10,  5, 9,  10,  3, 11, 44),
    ("November Trekking Day",     "Zaghouan",         11,  6, 8,   8,  2,  9, 38),
    ("December Caving Tour",      "Ghar el Melh",     12,  5, 10,  6,  2,  8, 33),
    ("January Ice Hiking",        "Ain Bou Monchar",   1,  5, 9,  24,  3,  7, 30),
    ("February Bird Walk",        "Ichkeul",           2,  6, 8,   5,  2,  8, 36),
    ("March Spring Hike",         "Boukornine",        3,  5, 9,   6,  2, 11, 47),
    ("April Wildflower Trek",     "Cap Bon",           4,  6, 8,   7,  3, 13, 52),
    ("May Heritage Tour",         "Dougga",            5,  5, 10,  6,  3, 12, 50),
    ("Saturday Mega Rally",       "Tunis Suburbs",     7,  5, 8,  10,  5, 27, 76),
    ("Sunday Family Picnic",      "Lac Park",          6,  6, 10,  6,  2, 20, 68),
    ("Monday Office Run",         "Ariana",            5,  0, 7,   2,  0,  4, 25),
    ("Friday Evening Yoga",       "Sidi Bou Said",     7,  4, 18,  2,  1,  7, 30),
    ("Long Weekend Expedition",   "Tamerza",           8,  4, 6,  72,  6, 26, 75),
    ("Half Day Photography",      "Medina",            4,  5, 9,   4,  1, 10, 48),
    ("Dawn Hike Series",          "Zaghouan",          6,  5, 5,   5,  2, 16, 62),
    ("Lunchtime Yoga",            "Tunis Center",      7,  2, 12,  1,  0,  5, 28),
    ("Late Night Run",            "Ennahli",           8,  5, 22,  2,  0,  6, 27),
    ("4-Day Wild Camp",           "Chelia",            7,  5, 7,  96,  7, 32, 83),
    ("5-Activity Megafest",       "Dougga",            6,  6, 9,  24,  7, 33, 82),
    ("No Activity Social",        "Ariana Park",       5,  6, 11,  4,  0,  7, 32),
    ("1-Activity Quick Trek",     "Boukornine",        4,  6, 8,   5,  1, 11, 46),
    ("2-Activity Trail Day",      "Tabarka",           5,  5, 8,   8,  2, 13, 53),
    ("6-Activity Adventure",      "Tamerza",           8,  5, 7,  48,  6, 29, 80),
    ("Rainy Season Hike",         "Ain Drahem",       11,  3, 10,  6,  2,  8, 35),
    ("Hot Midday Race",           "Hammamet",          7,  3, 13,  3,  1,  9, 38),
    ("Cold Morning Trek",         "Zaghouan",         12,  5, 6,   8,  3,  7, 32),
    ("Warm Evening Social",       "Lac Park",          6,  4, 19,  3,  1,  9, 38),
    ("Busy Sat MultiSport",       "Ennahli",           7,  5, 8,  12,  5, 25, 74),
    ("Calm Sun Meditation",       "Sidi Bou Said",     6,  6, 8,   4,  1, 12, 55),
    ("Peak Summer Fest",          "Hammamet",          8,  6, 9,  24,  6, 34, 86),
    ("Off-Peak Winter Camp",      "Chelia",            1,  3, 9,  48,  4,  8, 30),
    ("Spring Sprint",             "Boukornine",        4,  5, 7,   3,  2, 13, 52),
    ("Autumn Sunset Trail",       "Cap Bon",          10,  4, 17,  5,  2, 10, 42),
    ("Midweek Intensive Camp",    "Tabarka",           6,  2, 8,  24,  4, 11, 42),
    ("Weekend Extreme Trek",      "Chelia",            7,  5, 6,  48,  5, 27, 77),
    ("New Year Eve Hike",         "Zaghouan",         12,  2, 22,  4,  1,  8, 33),
    ("Valentine Walk",            "Sidi Bou Said",     2,  5, 10,  3,  1,  9, 40),
    ("Ramadan Night Hike",        "Ennahli",           3,  1, 21,  4,  1,  7, 29),
    ("Eid Family Camp",           "Hammamet",          4,  6, 9,  24,  4, 22, 70),
    ("National Day Trek",         "Carthage",          3,  0, 9,   6,  3, 14, 55),
    ("School Holiday Camp",       "Ain Drahem",        7,  0, 8,  48,  5, 29, 81),
    ("Corporate Team Build",      "Tunis Suburbs",     5,  2, 9,   8,  4, 15, 55),
    ("Uni Student Hike",          "Boukornine",        3,  5, 8,   6,  2, 18, 60),
    ("Kids Outdoor Day",          "Ariana Park",       6,  5, 10,  5,  3, 17, 65),
    ("Seniors Walk",              "Lac Park",          4,  3, 9,   3,  1,  9, 42),
    ("Night Swim Challenge",      "Bizerte Lake",      7,  5, 20,  3,  1,  8, 35),
    ("Sunrise Yoga Camp",         "Sidi Bou Said",     6,  5, 5,   4,  2, 14, 58),
    ("2-Day Kayak Tour",          "Bizerte",           8,  5, 8,  36,  4, 20, 70),
    ("Single Day Bike Race",      "Tunis",             5,  5, 7,   8,  2, 16, 60),
    ("Long Haul Ultra Run",       "Zaghouan",          6,  5, 5,  12,  3, 13, 50),
    ("City Nature Walk",          "Tunis Center",      4,  5, 10,  3,  1, 11, 47),
    ("Mountain Photo Walk",       "Chelia",            7,  5, 7,   8,  3, 18, 65),
    ("Seaside Marathon",          "Monastir",          5,  6, 7,   5,  2, 19, 67),
    ("Desert 24H Challenge",      "Douz",              9,  5, 6,  24,  4, 14, 52),
    ("Full Moon Hike",            "Boukornine",        6,  2, 20,  4,  1,  9, 36),
    # Batch 3 — maximum variance for better generalization
    ("Summer 7-Act Festival",     "Hammamet",          7,  5, 8,  24,  7, 36, 88),
    ("Winter 0-Act Walk",         "Ariana",           12,  1, 10,  3,  0,  5, 22),
    ("Spring 3-Act Weekend",      "Cap Bon",           4,  5, 9,   8,  3, 14, 54),
    ("Autumn 2-Act Weekday",      "Zaghouan",         10,  2, 10,  6,  2,  8, 38),
    ("Summer Sat Morning Trek",   "Chelia",            6,  5, 7,  10,  4, 22, 72),
    ("Summer Sun Evening Walk",   "Sidi Bou Said",     7,  6, 18,  3,  1, 10, 34),
    ("Winter Sat Full Day",       "Ain Drahem",        1,  5, 9,  10,  3,  9, 36),
    ("Winter Mon Quick Run",      "Tunis",            12,  0, 7,   2,  0,  4, 20),
    ("Spring Fri Night Hike",     "Ennahli",           5,  4, 20,  4,  1,  6, 27),
    ("Summer Wed 5-Act Camp",     "Tabarka",           8,  2, 8,  48,  5, 20, 63),
    ("Spring Sun 4-Act Tour",     "Dougga",            3,  6, 9,  12,  4, 16, 58),
    ("Autumn Sat 5-Act Fest",     "Monastir",         11,  5, 8,  24,  5, 18, 55),
    ("Summer Mon 2-Act Run",      "Boukornine",        7,  0, 6,   4,  2,  9, 40),
    ("Spring Sat 6-Act Mega",     "Hammamet",          5,  5, 8,  36,  6, 28, 79),
    ("Winter Fri 1-Act Yoga",     "Lac Park",          2,  4, 17,  2,  1,  7, 30),
    ("Summer Thu 3-Act Hike",     "Zaghouan",          8,  3, 9,   8,  3, 14, 52),
    ("Autumn Sun 0-Act Social",   "Ariana",            9,  6, 11,  4,  0,  6, 28),
    ("Spring Wed 2-Act Cycle",    "Tunis",             4,  2, 7,   5,  2, 10, 44),
    ("Summer Sat 7-Act Ultra",    "Chelia",            7,  5, 6,  48,  7, 33, 85),
    ("Winter Sun 3-Act Camp",     "Ain Drahem",        1,  6, 9,  24,  3,  9, 34),
    ("Spring Thu 4-Act Trail",    "Cap Bon",           3,  3, 8,  10,  4, 15, 56),
    ("Summer Tue 1-Act Run",      "Ennahli",           6,  1, 6,   3,  1,  7, 32),
    ("Autumn Sat 4-Act Tour",     "Dougga",           10,  5, 9,  12,  4, 13, 48),
    ("Winter Tue 0-Act Walk",     "Ariana",            1,  1, 10,  3,  0,  4, 18),
    ("Summer Fri 5-Act Night",    "Hammamet",          7,  4, 19,  6,  5, 16, 50),
    ("Spring Sat 1-Act Yoga",     "Sidi Bou Said",     4,  5, 8,   3,  1, 12, 48),
    ("Autumn Wed 3-Act Hike",     "Boukornine",        9,  2, 9,   8,  3, 11, 44),
    ("Summer Sun 6-Act Fest",     "Monastir",          8,  6, 8,  24,  6, 27, 76),
    ("Winter Thu 2-Act Run",      "Tunis",            12,  3, 7,   4,  2,  6, 26),
    ("Spring Mon 5-Act Camp",     "Tabarka",           5,  0, 8,  36,  5, 14, 52),
    ("Summer Sat 0-Act Social",   "Lac Park",          6,  5, 10,  4,  0,  8, 30),
    ("Autumn Fri 1-Act Trail",    "Zaghouan",         11,  4, 17,  5,  1,  7, 32),
    ("Spring Sun 7-Act Mega",     "Chelia",            4,  6, 7,  72,  7, 30, 80),
    ("Winter Wed 4-Act Tour",     "Cap Bon",           2,  2, 10,  8,  4,  8, 35),
    ("Summer Mon 3-Act Trek",     "Ain Drahem",        7,  0, 8,  10,  3, 12, 46),
    ("Autumn Sat 6-Act Exp",      "Dougga",           10,  5, 7,  48,  6, 22, 68),
    ("Winter Sun 1-Act Walk",     "Ariana",           12,  6, 9,   4,  1,  6, 25),
    ("Spring Fri 4-Act Hike",     "Boukornine",        3,  4, 9,  10,  4, 14, 55),
    ("Summer Wed 2-Act Swim",     "Bizerte",           8,  2, 8,   5,  2, 11, 43),
    ("Autumn Mon 5-Act Trek",     "Tabarka",           9,  0, 8,  24,  5, 13, 47),
    ("Summer Sat High Act",       "Hammamet",          7,  5, 8,  24,  6, 26, 77),
    ("Summer Sat No Act",         "Hammamet",          7,  5, 8,  24,  0,  8, 31),
    ("Winter Sat High Act",       "Chelia",            1,  5, 9,  24,  6, 10, 38),
    ("Winter Sat No Act",         "Chelia",            1,  5, 9,  24,  0,  4, 17),
    ("Summer Night 0-Act",        "Sidi Bou Said",     7,  2, 22,  3,  0,  5, 20),
    ("Summer Night 5-Act",        "Sidi Bou Said",     7,  2, 20,  5,  5, 14, 48),
    ("Peak Jul Sat 5-Act",        "Hammamet",          7,  5, 9,  16,  5, 26, 78),
    ("Peak Aug Sun 5-Act",        "Monastir",          8,  6, 9,  16,  5, 27, 79),
    ("Low Dec Mon 2-Act",         "Tunis",            12,  0, 10,  6,  2,  5, 24),
    ("Low Jan Tue 2-Act",         "Tunis",             1,  1, 10,  6,  2,  5, 23),
    ("Med Apr Sat 3-Act",         "Ariana",            4,  5, 10,  8,  3, 13, 51),
    ("Med Oct Sat 3-Act",         "Ariana",           10,  5, 10,  8,  3, 11, 44),
    ("Long 96h Summer",           "Chelia",            7,  5, 7,  96,  7, 32, 83),
    ("Short 2h Summer",           "Tunis",             7,  5, 10,  2,  1, 11, 42),
    ("Long 96h Winter",           "Ain Drahem",        1,  5, 9,  96,  7,  9, 32),
    ("Short 2h Winter",           "Tunis",             1,  5, 10,  2,  1,  4, 18),
    ("Dawn 5h Summer Sat",        "Zaghouan",          7,  5, 5,   5,  3, 17, 63),
    ("Night 22h Summer Sat",      "Sidi Bou Said",     7,  5, 22,  4,  2,  9, 35),
    ("Dawn 5h Winter Sat",        "Zaghouan",          1,  5, 5,   5,  3,  7, 27),
    ("Night 22h Winter Sat",      "Sidi Bou Said",     1,  5, 22,  4,  2,  4, 16),
    ("Jun Sat 4-Act Beach",       "Hammamet",          6,  5, 8,  12,  4, 21, 70),
    ("Sep Sat 4-Act Trail",       "Cap Bon",           9,  5, 8,  12,  4, 12, 46),
    ("Mar Sat 4-Act Spring",      "Boukornine",        3,  5, 8,  12,  4, 14, 53),
    ("Nov Sat 4-Act Autumn",      "Zaghouan",         11,  5, 8,  12,  4, 10, 42),
    ("High Density Sat Jul 7A",   "Hammamet",          7,  5, 8,  24,  7, 34, 86),
    ("High Density Sat Aug 7A",   "Monastir",          8,  5, 8,  24,  7, 33, 85),
    ("High Density Sun Jul 6A",   "Chelia",            7,  6, 8,  24,  6, 29, 81),
    ("Low Density Mon Dec 0A",    "Ariana",           12,  0, 9,   4,  0,  3, 15),
    ("Low Density Tue Jan 0A",    "Ariana",            1,  1, 9,   4,  0,  3, 14),
    ("Mid Density Fri May 3A",    "Ennahli",           5,  4, 9,   8,  3, 12, 50),
    ("Mid Density Thu Apr 3A",    "Ennahli",           4,  3, 9,   8,  3, 12, 49),
    ("Evening Jun Sat 2A",        "Sidi Bou Said",     6,  5, 18,  4,  2, 10, 37),
    ("Morning Jun Sat 2A",        "Sidi Bou Said",     6,  5, 8,   4,  2, 14, 55),
    ("Evening Dec Sat 2A",        "Sidi Bou Said",    12,  5, 18,  4,  2,  5, 22),
    ("Morning Dec Sat 2A",        "Sidi Bou Said",    12,  5, 8,   4,  2,  6, 26),
    ("Multiday Jul Sat 5A 48h",   "Chelia",            7,  5, 7,  48,  5, 25, 74),
    ("Multiday Jul Sat 5A 24h",   "Chelia",            7,  5, 7,  24,  5, 22, 71),
    ("Multiday Jul Sat 5A 8h",    "Chelia",            7,  5, 7,   8,  5, 19, 67),
    ("Multiday Dec Sat 5A 48h",   "Chelia",           12,  5, 7,  48,  5,  9, 35),
    ("Multiday Dec Sat 5A 8h",    "Chelia",           12,  5, 7,   8,  5,  7, 27),
    ("Jul Sat 1A Morning",        "Hammamet",          7,  5, 9,   6,  1, 14, 52),
    ("Jul Sat 3A Morning",        "Hammamet",          7,  5, 9,   6,  3, 19, 68),
    ("Jul Sat 5A Morning",        "Hammamet",          7,  5, 9,   6,  5, 24, 76),
    ("Dec Sat 1A Morning",        "Hammamet",         12,  5, 9,   6,  1,  6, 25),
    ("Dec Sat 3A Morning",        "Hammamet",         12,  5, 9,   6,  3,  7, 29),
    ("Dec Sat 5A Morning",        "Hammamet",         12,  5, 9,   6,  5,  9, 35),
    ("Jul Fri 3A Night",          "Boukornine",        7,  4, 20,  5,  3, 11, 40),
    ("Jul Sat 3A Night",          "Boukornine",        7,  5, 20,  5,  3, 13, 46),
    ("Dec Fri 3A Night",          "Boukornine",       12,  4, 20,  5,  3,  5, 22),
    ("Dec Sat 3A Night",          "Boukornine",       12,  5, 20,  5,  3,  6, 25),
    ("Pure Weekend Premium",      "Hammamet",          7,  5, 8,  12,  5, 25, 77),
    ("Pure Weekday Budget",       "Tunis",             7,  1, 7,   4,  1,  7, 32),
    ("Mixed Oct Weekday 4A",      "Zaghouan",         10,  2, 9,  10,  4, 12, 46),
    ("Mixed Apr Weekend 4A",      "Zaghouan",          4,  5, 9,  10,  4, 15, 56),
]

USER_IDS = list(range(1, 31))


def noise(val, pct=0.15):
    """Add ±15% random noise to a value."""
    return max(0, int(val * (1 + random.uniform(-pct, pct))))


def get_next_event_id(cur):
    cur.execute("SELECT MAX(id) FROM events")
    row = cur.fetchone()
    return (row[0] or 0) + 1


def seed():
    random.seed(42)
    conn = pymysql.connect(**DB)
    cur  = conn.cursor()

    # --- Check existing synthetic events to avoid duplicates ---
    cur.execute("SELECT title FROM events WHERE created_by_id = %s", (ADMIN_USER_ID,))
    existing_titles = {r[0] for r in cur.fetchall()}

    inserted_events  = 0
    inserted_parts   = 0
    skipped          = 0

    for (title, location, month, dow, hour, duration_h, n_act, base_parts, base_rate) in EVENTS:
        if title in existing_titles:
            skipped += 1
            continue

        # Build a deterministic date in 2025 matching month/day_of_week
        # Find the first date in 2025 that matches month + day_of_week
        d = datetime(2025, month, 1, hour, 0, 0)
        while d.weekday() != dow:
            d += timedelta(days=1)
        end_d = d + timedelta(hours=duration_h)

        cur.execute("""
            INSERT INTO events (title, description, location, start_at, end_at, created_by_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (title, f"Synthetic training event: {title}", location, d, end_d, ADMIN_USER_ID))
        event_id = cur.lastrowid

        # Activities
        for i in range(n_act):
            cur.execute(
                "INSERT INTO activities (name, description, event_id) VALUES (%s, %s, %s)",
                (f"Activity {i+1} — {title}", "Synthetic activity", event_id)
            )

        # Participations
        total_parts = noise(base_parts)
        attended    = noise(total_parts * base_rate / 100)
        cancelled   = noise(total_parts * 0.10)
        registered  = max(0, total_parts - attended - cancelled)

        shuffled = random.sample(USER_IDS, min(total_parts, len(USER_IDS)))
        for idx, uid in enumerate(shuffled):
            if idx < attended:
                status = "ATTENDED"
            elif idx < attended + cancelled:
                status = "CANCELLED"
            else:
                status = "REGISTERED"
            qr = str(uuid.uuid4())
            cur.execute("""
                INSERT IGNORE INTO event_participations (event_id, user_id, status, registered_at, qr_token)
                VALUES (%s, %s, %s, NOW(), %s)
            """, (event_id, uid, status, qr))
            inserted_parts += 1

        inserted_events += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"[OK] Inserted {inserted_events} events, {inserted_parts} participations  (skipped {skipped} already existing)")


if __name__ == "__main__":
    seed()
