import type { ChildData } from '../api/children'

interface Props {
  child: ChildData
  onEdit: (child: ChildData) => void
  onDelete: (id: number) => void
}

export function ChildCard({ child, onEdit, onDelete }: Props) {
  const initials = child.name.slice(0, 2).toUpperCase()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{child.name}</p>
          <p className="text-sm text-gray-500">Age {child.age}{child.gender ? ` · ${child.gender}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(child)} className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
          <button onClick={() => onDelete(child.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
        </div>
      </div>
      {child.interests && <p className="mt-2 text-sm text-gray-600">Interests: {child.interests}</p>}
      {child.petName && <p className="text-sm text-gray-600">Pet: {child.petName}</p>}
    </div>
  )
}
