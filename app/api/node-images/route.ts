import { NextRequest, NextResponse } from 'next/server'
export async function GET(req: NextRequest) {
  const fileKey = req.nextUrl.searchParams.get('fileKey')
  const ids = req.nextUrl.searchParams.get('ids')
  if (!fileKey || !ids) return NextResponse.json({ error: 'Missing fileKey or ids' }, { status: 400 })
  const res = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&scale=2&format=png`, { headers: { 'X-Figma-Token': process.env.FIGMA_ACCESS_TOKEN! } })
  if (!res.ok) return NextResponse.json({ error: `Figma error: ${res.status}` }, { status: 502 })
  const data = await res.json()
  return NextResponse.json(data.images ?? {})
}
