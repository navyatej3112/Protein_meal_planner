/**
 * API client — thin wrappers around fetch for each backend endpoint.
 * All functions throw on non-OK responses so React Query can catch them.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Food search (USDA proxy)
// ---------------------------------------------------------------------------

export const searchFoods = (query, pageSize = 10) =>
  request(`/foods/search?q=${encodeURIComponent(query)}&pageSize=${pageSize}`);

export const getFoodById = (fdcId) => request(`/foods/${fdcId}`);

// ---------------------------------------------------------------------------
// Meal logs
// ---------------------------------------------------------------------------

export const getMeals = (date) =>
  request(`/meals${date ? `?date=${date}` : ''}`);

export const getMealsRange = (start, end) =>
  request(`/meals/range?start=${start}&end=${end}`);

export const logMeal = (entry) =>
  request('/meals', { method: 'POST', body: JSON.stringify(entry) });

export const deleteMeal = (id) =>
  request(`/meals/${id}`, { method: 'DELETE' });

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export const getGoals = () => request('/goals');

export const updateGoals = (goals) =>
  request('/goals', { method: 'PUT', body: JSON.stringify(goals) });
