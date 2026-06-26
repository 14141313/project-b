'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { FigmaFrame, FigmaFile } from '@/types'
import SearchInput from '@/components/SearchInput'
import FilterSidebar from '@/components/FilterSidebar'
import FrameGrid from '@/components/FrameGrid'
import FileImport from '@/components/FileImport'

export default function HomePage() {
  const [frames, setFrames] = useState<FigmaFrame[]>([])
  const [files, setFiles] = useState<FigmaFile[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: framesData }, { data: filesData }] = await Promise.all([
        supabase
          .from('frames')
          .select('*, page:pages(name, file:files(name, figma_file_key))')
          .order('updated_at', { ascending: false }),
        supabase.from('files').select('*').order('last_synced', { ascending: false }),
      ])
      setFrames((framesData as FigmaFrame[]) ?? [])
      setFiles((filesData as FigmaFile[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const categories = useMemo(
    () => [...new Set(frames.map((f) => (f.page as { name: string } | undefined)?.name).filter(Boolean) as string[])],
    [frames]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return frames.filter((f) => {
      const matchesCategory = !category || (f.page as { name: string } | undefined)?.name === category
      if (!matchesCategory) return false
      if (!q) return true
      return (
        f.name.toLowerCase().includes(q) ||
        f.components.some((c) => c.toLowerCase().includes(q)) ||
        f.layers.some((l) => l.toLowerCase().includes(q))
      )
    })
  }, [frames, search, category])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">Bupa Design Library</span>
          </div>
          <div className="flex-1 max-w-xl">
            <SearchInput value={search} onChange={setSearch} />
          </div>
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add file
          </button>
        </div>
        {showImport && (
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
            <div className="max-w-xl">
              <p className="text-sm text-gray-600 mb-3">Paste a Figma file URL to import it</p>
              <FileImport />
            </div>
          </div>
        )}
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-6 flex gap-8">
        <FilterSidebar categories={categories} selectedCategory={category} onCategoryChange={setCategory} />
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{filtered.length} frame{filtered.length !== 1 ? 's' : ''}</span>
              {files.length > 0 && (
                <>
                  <span className="text-gray-200">·</span>
                  <span>{files.length} file{files.length !== 1 ? 's' : ''} indexed</span>
                </>
              )}
            </div>
            {files.length > 0 && (
              <div className="flex gap-2">
                {files.slice(0, 3).map((file) => (
                  <Link
                    key={file.id}
                    href={`/files/${file.id}?key=${file.figma_file_key}`}
                    className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors truncate max-w-[160px]"
                    title={file.name}
                  >
                    {file.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : frames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-gray-900 font-semibold text-lg mb-1">No frames indexed yet</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-xs">
                Import a Figma file to start building your design library
              </p>
              <button
                onClick={() => setShowImport(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Import your first file
              </button>
            </div>
          ) : (
            <FrameGrid frames={filtered} />
          )}
        </main>
      </div>
    </div>
  )
}
