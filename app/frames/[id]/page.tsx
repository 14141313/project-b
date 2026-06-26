'use client'

import { useEffect, useState, use, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { FigmaFrame, FigmaComponent, FrameVersion } from '@/types'
import { formatDate } from '@/lib/utils'

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" aria-label="Close">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className="w-full h-full object-contain" />
      </div>
    </div>
  )
}

function ComponentPreview({ component, fileKey }: { component: FigmaComponent; fileKey: string }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const load = useCallback(async () => {
    if (thumbnailUrl || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/node-images?fileKey=${fileKey}&ids=${encodeURIComponent(component.id)}`)
      const data = await res.json()
      setThumbnailUrl(data[component.id] ?? null)
    } catch { } finally { setLoading(false) }
  }, [thumbnailUrl, loading, fileKey, component.id])

  return (
    <>
      {lightbox && thumbnailUrl && <Lightbox src={thumbnailUrl} alt={component.name} onClose={() => setLightbox(false)} />}
      <div className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
        <button className="w-full text-left" onClick={() => { if (thumbnailUrl) setLightbox(true); else load().then(() => setLightbox(true)) }} onMouseEnter={load}>
          <div className="relative aspect-[4/3] bg-gray-100 flex items-center justify-center">
            {loading && <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
            {thumbnailUrl && !loading && <Image src={thumbnailUrl} alt={component.name} fill className="object-contain" sizes="200px" unoptimized />}
            {!thumbnailUrl && !loading && (
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="px-2 py-1.5">
            <p className="text-xs text-gray-700 truncate" title={component.name}>{component.name}</p>
          </div>
        </button>
      </div>
    </>
  )
}

export default function FrameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [frame, setFrame] = useState<FigmaFrame | null>(null)
  const [versions, setVersions] = useState<FrameVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingVersion, setTogglingVersion] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: frameData }, { data: versionData }] = await Promise.all([
        supabase.from('frames').select('*, page:pages(name, file:files(id, name, figma_file_key))').eq('id', id).single(),
        supabase.from('frame_versions').select('*').eq('frame_id', id).order('snapshot_at', { ascending: false }),
      ])
      setFrame(frameData as FigmaFrame)
      setVersions(versionData ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  async function toggleVersionHistory() {
    if (!frame) return
    setTogglingVersion(true)
    const { data } = await supabase.from('frames').update({ version_history_enabled: !frame.version_history_enabled }).eq('id', id).select().single()
    if (data) setFrame(data as FigmaFrame)
    setTogglingVersion(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-white border-b border-gray-200 h-16" />
      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-8">
        <div className="col-span-2 aspect-[4/3] bg-gray-100 rounded-xl" />
        <div className="space-y-4"><div className="h-6 bg-gray-100 rounded w-3/4" /><div className="h-4 bg-gray-100 rounded w-1/2" /></div>
      </div>
    </div>
  )

  if (!frame) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Frame not found</p>
    </div>
  )

  const page = frame.page as { name: string; file: { id: string; name: string; figma_file_key: string } } | undefined
  const fileKey = page?.file?.figma_file_key ?? ''
  const components: FigmaComponent[] = frame.components.map((c) => typeof c === 'string' ? { id: '', name: c as unknown as string } : c)

  return (
    <>
      {lightbox && frame.thumbnail_url && <Lightbox src={frame.thumbnail_url} alt={frame.name} onClose={() => setLightbox(false)} />}
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-gray-900 truncate">{frame.name}</h1>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                {page?.file?.name && <><span>{page.file.name}</span><span>·</span></>}
                {page?.name && <span>{page.name}</span>}
              </div>
            </div>
            <a href={frame.figma_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 38 57" fill="none">
                <path d="M19 28.5A9.5 9.5 0 1128.5 19 9.5 9.5 0 0119 28.5z" fill="#1ABCFE"/>
                <path d="M9.5 57A9.5 9.5 0 019.5 38H19v9.5A9.5 9.5 0 019.5 57z" fill="#0ACF83"/>
                <path d="M19 0H9.5A9.5 9.5 0 009.5 19H19z" fill="#FF7262"/>
                <path d="M28.5 0H19v19h9.5A9.5 9.5 0 0028.5 0z" fill="#F24E1E"/>
                <path d="M38 9.5A9.5 9.5 0 0128.5 19H19V0h9.5A9.5 9.5 0 0138 9.5z" fill="#FF7262"/>
              </svg>
              Open in Figma
            </a>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <div className="relative aspect-[4/3] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm cursor-zoom-in group" onClick={() => frame.thumbnail_url && setLightbox(true)}>
              {frame.thumbnail_url ? (
                <>
                  <Image src={frame.thumbnail_url} alt={frame.name} fill className="object-contain" sizes="(max-width: 1200px) 66vw" unoptimized />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                    <div className="bg-white/90 rounded-full p-2.5 shadow">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {versions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Version history</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {versions.map((v) => (
                    <div key={v.id} className="shrink-0 w-48">
                      <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <Image src={v.thumbnail_url} alt={`Snapshot ${formatDate(v.snapshot_at)}`} fill className="object-cover" sizes="200px" unoptimized />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">{formatDate(v.snapshot_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {components.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Components ({components.length})
                  {fileKey && components.some(c => !c.id) && <span className="ml-2 text-xs font-normal text-gray-400">Re-sync to enable previews</span>}
                </h3>
                {fileKey ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {components.map((c, i) => c.id
                      ? <ComponentPreview key={c.id} component={c} fileKey={fileKey} />
                      : <div key={i} className="border border-gray-100 rounded-lg bg-gray-50 px-2 py-2"><p className="text-xs text-gray-700 truncate" title={c.name}>{c.name}</p></div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {components.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <span className="text-xs text-gray-700 truncate" title={c.name}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Frame</p><p className="text-sm text-gray-900 mt-0.5">{frame.name}</p></div>
              {page?.name && <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Category</p><p className="text-sm text-gray-900 mt-0.5">{page.name}</p></div>}
              {page?.file?.name && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">File</p>
                  <Link href={`/files/${page.file.id}?key=${page.file.figma_file_key}`} className="text-sm text-blue-600 hover:underline mt-0.5 block">{page.file.name}</Link>
                </div>
              )}
              <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Last updated</p><p className="text-sm text-gray-900 mt-0.5">{formatDate(frame.updated_at)}</p></div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-900">Version history</p><p className="text-xs text-gray-400 mt-0.5">Save a snapshot on each sync</p></div>
                <button onClick={toggleVersionHistory} disabled={togglingVersion} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${frame.version_history_enabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${frame.version_history_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
