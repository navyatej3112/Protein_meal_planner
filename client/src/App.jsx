import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Recipes from './pages/Recipes'
import Settings from './pages/Settings'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'settings', label: 'Settings' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="font-bold text-gray-900 text-base">
            Protein Tracker
          </span>
          <div className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  page === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main>
        {page === 'dashboard' && <Dashboard />}
        {page === 'recipes' && <Recipes />}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  )
}
