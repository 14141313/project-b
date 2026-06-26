import { FigmaFileStructure, FigmaNode } from '@/types'

const FIGMA_BASE = 'https://api.figma.com'

function headers() {
  return { 'X-Figma-Token': process.env.FIGMA_ACCESS_TOKEN! }
}

export function parseFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

export async function fetchFileStructure(fileKey: string): Promise<FigmaFileStructure> {
  const res = await fetch(`${FIGMA_BASE}/v1/files/${fileKey}?depth=2`, {
    headers: headers(),
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Figma API error: ${res.status} ${await res.text()}`)
  const data = await res.json()

  const pages = (data.document.children as FigmaNode[]).map((page) => ({
    id: page.id,
    name: page.name,
    frames: (page.children ?? [])
      .filter((n) => n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'SECTION')
      .map((f) => ({ id: f.id, name: f.name })),
  }))

  return { name: data.name, pages }
}

export async function fetchFrameThumbnails(
  fileKey: string,
  frameIds: string[]
): Promise<Record<string, string>> {
  const ids = frameIds.join(',')
  const res = await fetch(
    `${FIGMA_BASE}/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&scale=2&format=png`,
    { headers: headers(), next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error(`Figma images error: ${res.status}`)
  const data = await res.json()
  return data.images ?? {}
}

export async function fetchFrameNodes(
  fileKey: string,
  frameIds: string[]
): Promise<Record<string, { components: string[]; layers: string[] }>> {
  const ids = frameIds.join(',')
  const res = await fetch(
    `${FIGMA_BASE}/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(ids)}`,
    { headers: headers(), next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error(`Figma nodes error: ${res.status}`)
  const data = await res.json()

  const result: Record<string, { components: string[]; layers: string[] }> = {}
  for (const [id, nodeData] of Object.entries(data.nodes as Record<string, { document: FigmaNode }>)) {
    const components: string[] = []
    const layers: string[] = []
    traverseNode(nodeData.document, components, layers)
    result[id] = {
      components: [...new Set(components)],
      layers: [...new Set(layers)],
    }
  }
  return result
}

function traverseNode(node: FigmaNode, components: string[], layers: string[]) {
  if (node.type === 'INSTANCE' || node.type === 'COMPONENT') {
    components.push(node.name)
  }
  if (node.name) layers.push(node.name)
  for (const child of node.children ?? []) {
    traverseNode(child, components, layers)
  }
}

export function buildFigmaLink(fileKey: string, frameId: string): string {
  return `https://www.figma.com/file/${fileKey}?node-id=${encodeURIComponent(frameId)}`
}
