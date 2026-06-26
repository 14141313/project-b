import { NextRequest, NextResponse } from 'next/server'
import { fetchFileStructure, parseFileKey } from '@/lib/figma'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  const fileKey = parseFileKey(url)
  if (!fileKey) return NextResponse.json({ error: 'Invalid Figma URL' }, { status: 400 })

  const structure = await fetchFileStructure(fileKey)

  const db = getServiceClient()
  const { data: file, error } = await db
    .from('files')
    .upsert({ figma_file_key: fileKey, name: structure.name }, { onConflict: 'figma_file_key' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ file, structure })
}
