-- Daily protein/calorie goal (single row — app is single-user)
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- enforce single row
  protein_g INTEGER NOT NULL DEFAULT 150,
  calories INTEGER NOT NULL DEFAULT 2000,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed the default goal row on first run
INSERT OR IGNORE INTO goals (id, protein_g, calories) VALUES (1, 150, 2000);

-- Logged meals
CREATE TABLE IF NOT EXISTS meal_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,          -- ISO date string: YYYY-MM-DD
  meal_type TEXT NOT NULL,     -- 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  food_name TEXT NOT NULL,
  serving_size TEXT NOT NULL,  -- human-readable, e.g. "1 cup (240g)"
  calories REAL NOT NULL,
  protein_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
