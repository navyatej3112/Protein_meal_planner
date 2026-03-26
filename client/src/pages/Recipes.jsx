import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchRecipes } from '../api';

export default function Recipes() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [highProteinOnly, setHighProteinOnly] = useState(false);

  const { data, isFetching, error } = useQuery({
    queryKey: ['recipe-search', submittedQuery],
    queryFn: () => searchRecipes(submittedQuery),
    enabled: submittedQuery.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) {
      setSubmittedQuery(query.trim());
      setSelected(null);
    }
  }

  const recipes = data?.recipes ?? [];
  const displayed = highProteinOnly ? recipes.filter((r) => r.isHighProtein) : recipes;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recipe Search</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Powered by TheMealDB — high-protein recipes surfaced first
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. chicken, beef, salmon…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!query.trim() || isFetching}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFetching ? '…' : 'Search'}
        </button>
      </form>

      {/* High-protein filter toggle */}
      {recipes.length > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setHighProteinOnly((v) => !v)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              highProteinOnly
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            High Protein Only
          </button>
          <span className="text-xs text-gray-400">
            {displayed.length} of {recipes.length} recipes
          </span>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-500 mb-4">{error.message}</p>}

      {/* No results */}
      {data && displayed.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          {highProteinOnly ? 'No high-protein recipes found. Try disabling the filter.' : 'No recipes found.'}
        </p>
      )}

      {/* Recipe grid */}
      <div className="grid grid-cols-2 gap-3">
        {displayed.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isSelected={selected?.id === recipe.id}
            onClick={() => setSelected(selected?.id === recipe.id ? null : recipe)}
          />
        ))}
      </div>

      {/* Recipe detail drawer */}
      {selected && <RecipeDetail recipe={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RecipeCard({ recipe, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl overflow-hidden border transition-all ${
        isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } bg-white`}
    >
      <div className="relative">
        <img
          src={recipe.thumbnail}
          alt={recipe.name}
          className="w-full h-32 object-cover"
          loading="lazy"
        />
        {/* High-protein badge */}
        {recipe.isHighProtein && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            High Protein
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-sm text-gray-800 line-clamp-2 leading-snug">{recipe.name}</p>
        <p className="text-xs text-gray-400 mt-1">{recipe.category} · {recipe.area}</p>
        {recipe.proteinScore > 0 && (
          <p className="text-xs text-blue-500 mt-1">
            {recipe.proteinScore} protein source{recipe.proteinScore !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </button>
  );
}

function RecipeDetail({ recipe, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="relative shrink-0">
          <img
            src={recipe.thumbnail}
            alt={recipe.name}
            className="w-full h-48 object-cover rounded-t-xl"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70 text-lg leading-none"
          >
            ×
          </button>
          {recipe.isHighProtein && (
            <span className="absolute bottom-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              High Protein · {recipe.proteinScore} source{recipe.proteinScore !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{recipe.name}</h2>
          <p className="text-sm text-gray-400 mb-4">{recipe.category} · {recipe.area}</p>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {recipe.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          {/* Ingredients */}
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Ingredients</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mb-5">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-1">
                <span className="text-gray-400 shrink-0">{ing.measure}</span>
                <span>{ing.name}</span>
              </li>
            ))}
          </ul>

          {/* Instructions */}
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Instructions</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{recipe.instructions}</p>

          {/* YouTube link */}
          {recipe.youtubeUrl && (
            <a
              href={recipe.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              Watch on YouTube →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
