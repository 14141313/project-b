export interface FigmaFile {
  id: string; figma_file_key: string; name: string; last_synced: string | null; created_at: string
}
export interface FigmaPage {
  id: string; file_id: string; figma_page_id: string; name: string
}
export interface FigmaComponent { id: string; name: string }
export interface FigmaFrame {
  id: string; page_id: string; figma_frame_id: string; name: string
  thumbnail_url: string | null; figma_link: string
  components: FigmaComponent[]; layers: string[]
  version_history_enabled: boolean; created_at: string; updated_at: string
  page?: FigmaPage; file?: FigmaFile
}
export interface FrameVersion { id: string; frame_id: string; thumbnail_url: string; snapshot_at: string }
export interface FigmaApiFile { name: string; document: FigmaNode }
export interface FigmaNode { id: string; name: string; type: string; children?: FigmaNode[] }
export interface FigmaFileStructure {
  name: string
  pages: { id: string; name: string; frames: { id: string; name: string }[] }[]
}
