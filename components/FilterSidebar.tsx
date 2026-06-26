'use client'

interface Props {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (c: string) => void
}

export default function FilterSidebar({ categories, selectedCategory, onCategoryChange }: Props) {
  return (
    <aside className="w-56 shrink-0">
      <div className="sticky top-6 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">Category</p>
        <button
          onClick={() => onCategoryChange('')}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            selectedCategory === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate ${
              selectedCategory === cat ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={cat}
          >
            {cat}
          </button>
        ))}
      </div>
    </aside>
  )
}
