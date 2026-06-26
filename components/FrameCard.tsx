'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FigmaFrame } from '@/types'

interface Props {
  frame: FigmaFrame & { page?: { name: string } }
}

export default function FrameCard({ frame }: Props) {
  return (
    <Link
      href={`/frames/${frame.id}`}
      className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200"
    >
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {frame.thumbnail_url ? (
          <Image
            src={frame.thumbnail_url}
            alt={frame.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
        <a
          href={frame.figma_link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 shadow-sm hover:bg-gray-50"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 38 57" fill="none">
            <path d="M19 28.5A9.5 9.5 0 1128.5 19 9.5 9.5 0 0119 28.5z" fill="#1ABCFE"/>
            <path d="M9.5 57A9.5 9.5 0 019.5 38H19v9.5A9.5 9.5 0 019.5 57z" fill="#0ACF83"/>
            <path d="M19 0H9.5A9.5 9.5 0 009.5 19H19z" fill="#FF7262"/>
            <path d="M28.5 0H19v19h9.5A9.5 9.5 0 0028.5 0z" fill="#F24E1E"/>
            <path d="M38 9.5A9.5 9.5 0 0128.5 19H19V0h9.5A9.5 9.5 0 0138 9.5z" fill="#FF7262"/>
          </svg>
          Open
        </a>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate">{frame.name}</p>
        {frame.page && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{frame.page.name}</p>
        )}
        {frame.components.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">{frame.components.length} components</p>
        )}
      </div>
    </Link>
  )
}
