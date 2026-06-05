import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">StoryCraft</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full capitalize">{user?.plan}</span>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/dashboard/children" className="bg-white rounded-lg border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Children</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your children profiles</p>
          </Link>
          <Link to="/templates" className="bg-white rounded-lg border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
            <p className="text-sm text-gray-500 mt-1">Browse story templates</p>
          </Link>
          <Link to="/books/new" className="bg-white rounded-lg border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Create Book</h2>
            <p className="text-sm text-gray-500 mt-1">Start a new storybook</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
