require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/database');

const foodsRouter = require('./routes/foods');
const mealsRouter = require('./routes/meals');
const goalsRouter = require('./routes/goals');
const favoritesRouter = require('./routes/favorites');

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors({ origin: 'http://localhost:5173' })); // Vite dev server
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/foods', foodsRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/favorites', favoritesRouter);

// Health check — useful for confirming the server is up
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ---------------------------------------------------------------------------
// Error handling middleware
// ---------------------------------------------------------------------------

// 404 — no route matched
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler — catches anything passed to next(err)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);

  // Surface validation/client errors as 400, everything else as 500
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  res.status(status).json({ error: message });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

// Only start listening when this file is run directly (not during tests)
if (require.main === module) {
  initDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

module.exports = { app, initDb }; // exported so tests can import without starting the server
