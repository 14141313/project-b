import { NextRequest, NextResponse } from 'next/server'
import { fetchFrameThumbnails, fetchFrameNodes, buildFigmaLink } from '@/lib/figma'
import { getServiceClient } from '@/lib/supabase'

interface SelectedFrame {
  figma_frame_id: string
  name: string
  page_id: string
}

export async function POST(req: NextRequest) {
  const { fileId, fileKey, frames }: { fileId: string; fileKey: string; frames: SelectedFrame[] } =
    await req.json()

  if (!frames?.length) return NextResponse.json({ error: 'No frames provided' }, { status: 400 })

  const db = getServiceClient()

  const frameIds = frames.map((f) => f.figma_frame_id)
  const [thumbnails, nodeData] = await Promise.all([
    fetchFrameThumbnails(fileKey, frameIds),
    fetchFrameNodes(fileKey, frameIds),
  ])

  const rows = frames.map((f) => ({
    page_id: f.page_id,
    figma_frame_id: f.figma_frame_id,
    name: f.name,
    thumbnail_url: thumbnails[f.figma_frame_id] ?? null,
    figma_link: buildFigmaLink(fileKey, f.figma_frame_id),
    components: nodeData[f.figma_frame_id]?.components ?? [],
    layers: nodeData[f.figma_frame_id]?.layers ?? [],
    updated_at: new Date().toISOString(),
  }))

  const { data: upsertedFrames, error } = await db
    .from('frames')
    .upsert(rows, { onConflict: 'figma_frame_id' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enabledFrameIds = upsertedFrames
    ?.filter((f: { version_history_enabled: boolean }) => f.version_history_enabled)
    .map((f: { id: string }) => f.id) ?? []

  if (enabledFrameIds.length > 0) {
    const versionRows = upsertedFrames
      ?.filter((f: { id: string; version_history_enabled: boolean; thumbnail_url: string | null }) =>
        enabledFrameIds.includes(f.id) && f.thumbnail_url
      )
      .map((f: { id: string; thumbnail_url: string }) => ({
        frame_id: f.id,
        thumbnail_url: f.thumbnail_url,
        snapshot_at: new Date().toISOString(),
      })) ?? []

    if (versionRows.length > 0) {
      await db.from('frame_versions').insert(versionRows)
    }
  }

  await db.from('files').update({ last_synced: new Date().toISOString() }).eq('id', fileId)

  return NextResponse.json({ synced: upsertedFrames?.length ?? 0 })
}
