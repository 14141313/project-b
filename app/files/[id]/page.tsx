'use client'

import { useEffect, useState, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { FigmaFileStructure, FigmaFile } from '@/types'
import { formatDate } from '@/lib/utils'

interface FrameSelection {
  figma_frame_id: string
  name: string
  page_id: string
}

interface PageData {
  id: string
  figma_page_id: string
  name: string
}

export default function FilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const fileKey = searchParams.get('key') ?? ''
  const router = useRouter()

  const [file, setFile] = useState<FigmaFile | null>(null)
  const [structure, setStructure] = useState<FigmaFileStructure | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [syncing, setSyncing] = useState(false)
  const [loadingStructure, setLoadingStructure] = useState(true)
  const [syncMsg, setSyncMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: fileData } = await supabase.from('files').select('*').eq('id', id).single()
      setFile(fileData)

      try {
        const res = await fetch('/api/figma', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `https://www.figma.com/file/${fileKey}` }),
        })
        const data = await res.json()
        if (res.ok) setStructure(data.structure)
        else setError(data.error)
      } catch {
        setError('Failed to fetch Figma structure')
      }

      setLoadingStructure(false)
    }
    if (fileKey) load()
  }, [id, fileKey])

  function toggleFrame(frameId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(frameId) ? next.delete(frameId) : next.add(frameId)
      return next
    })
  }

  function togglePage(pageFrameIds: string[]) {
    const allSelected = pageFrameIds.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      pageFrameIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)))
      return next
    })
  }

  async function handleSync() {
    if (!structure || selected.size === 0) return
    setSyncing(true)
    setSyncMsg('')
    setError('')

    const pageRows = structure.pages.map((p) => ({
      file_id: id,
      figma_page_id: p.id,
      name: p.name,
    }))
    const { data: upsertedPages, error: pageError } = await supabase
      .from('pages')
      .upsert(pageRows, { onConflict: 'figma_page_id' })
      .select()

    if (pageError) {
      setError(pageError.message)
      setSyncing(false)
      return
    }

    const pageMap = new Map((upsertedPages ?? []).map((p: PageData) => [p.figma_page_id, p.id]))

    const frames: FrameSelection[] = []
    for (const page of structure.pages) {
      for (const frame of page.frames) {
        if (selected.has(frame.id)) {
          const dbPageId = pageMap.get(page.id)
          if (dbPageId) frames.push({ figma_frame_id: frame.id, name: frame.name, page_id: dbPageId })
        }
      }
    }

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: id, fileKey, frames }),
    })
    const data = await res.json()
    if (res.ok) {
      setSyncMsg(`Synced ${data.synced} frames successfully`)
      setTimeout(() => router.push('/'), 1500)
    } else {
      setError(data.error)
    }
    setSyncing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900">{file?.name ?? 'Loading…'}</h1>
            {file?.last_synced && (
              <p className="text-xs text-gray-400 mt-0.5">Last synced {formatDate(file.last_synced)}</p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loadingStructure ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse space-y-3">
                <div className="h-4 bg-gray-100 rounded w-1/4" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        ) : structure ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {selected.size} of {structure.pages.reduce((acc, p) => acc + p.frames.length, 0)} frames selected
              </p>
              <div className="flex items-center gap-3">
                {syncMsg && <p className="text-green-600 text-sm">{syncMsg}</p>}
                <button
                  onClick={handleSync}
                  disabled={selected.size === 0 || syncing}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {syncing ? 'Syncing…' : `Sync ${selected.size} frame${selected.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {structure.pages.map((page) => {
                const frameIds = page.frames.map((f) => f.id)
                const allSelected = frameIds.length > 0 && frameIds.every((id) => selected.has(id))
                const someSelected = frameIds.some((id) => selected.has(id))

                return (
                  <div key={page.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                      onClick={() => togglePage(frameIds)}
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                        onChange={() => togglePage(frameIds)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{page.name}</p>
                        <p className="text-xs text-gray-400">{page.frames.length} frames</p>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {page.frames.map((frame) => (
                        <label
                          key={frame.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(frame.id)}
                            onChange={() => toggleFrame(frame.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{frame.name}</span>
                        </label>
                      ))}
                      {page.frames.length === 0 && (
                        <p className="px-4 py-3 text-sm text-gray-400 italic">No top-level frames</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
