# Protein Meal Planner & Tracker

A single-user web app for tracking daily protein and macro intake. Search real foods from the USDA database, log them to meals, and monitor your progress against a configurable daily goal.

![Screenshot placeholder](docs/screenshot.png)

---

## Features

- **Food search** — powered by the USDA FoodData Central API (calories, protein, carbs, fat per serving)
- **Meal logging** — log food to breakfast, lunch, dinner, or snacks with adjustable serving sizes
- **Dashboard** — visual protein ring + macro progress bars for today (or any date)
- **Configurable goals** — set your daily protein and calorie targets
- **Persistent storage** — SQLite database, no external service needed

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 19 + Vite, Tailwind CSS v4, TanStack Query |
| Backend   | Node.js + Express 4                             |
| Database  | SQLite via `@libsql/client` (WASM, no native compilation) |
| Testing   | Jest + Supertest (integration tests, in-memory DB) |

---

## Project Structure

```
protein-meal-planner/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── api/             # fetch wrappers for each API endpoint
│       ├── components/      # MacroBar, MealSection, FoodSearchModal
│       ├── pages/           # Dashboard, Settings
│       └── main.jsx         # React Query provider + app entry
├── server/
│   ├── __tests__/           # Integration tests (Jest + Supertest)
│   ├── db/
│   │   ├── database.js      # DB init + singleton client
│   │   └── schema.sql       # Table definitions (reference only)
│   ├── routes/
│   │   ├── foods.js         # USDA API proxy
│   │   ├── meals.js         # Meal log CRUD
│   │   └── goals.js         # Daily goals get/set
│   └── index.js             # Express app
├── .env.example
└── package.json             # Root scripts (dev, test, install:all)
```

---

## Getting Started

### 1. Get a USDA API key

Register for a free key at [https://fdc.nal.usda.gov/api-guide.html](https://fdc.nal.usda.gov/api-guide.html) — instant, no approval required.

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set USDA_API_KEY=your_key_here
```

### 3. Install dependencies

```bash
npm run install:all
```

### 4. Run the app

```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- API server: [http://localhost:3001](http://localhost:3001)

---

## Running Tests

```bash
npm test
# or
cd server && npm test
```

Tests use an in-memory database so your real data is never touched.

---

## API Reference

| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | `/api/foods/search?q=...`       | Search USDA foods                  |
| GET    | `/api/foods/:fdcId`             | Get food detail by FDC ID          |
| GET    | `/api/meals?date=YYYY-MM-DD`    | Get meals for a date (today default) |
| GET    | `/api/meals/range?start=&end=`  | Daily totals for a date range      |
| POST   | `/api/meals`                    | Log a food to a meal               |
| DELETE | `/api/meals/:id`                | Remove a logged entry              |
| GET    | `/api/goals`                    | Get current daily goals            |
| PUT    | `/api/goals`                    | Update daily goals                 |

---

## Roadmap (V2)

- [ ] Recipe search (TheMealDB API) filtered to high-protein results
- [ ] Favorite foods for quick logging
- [ ] Weekly protein trend chart (Recharts)
- [ ] Meal planning for upcoming days
