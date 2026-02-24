'use client';

import { useMemo, useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, FileText, Layers } from 'lucide-react';
import type { MarkdownPage, BatchSummary } from '@/lib/types';

interface ExtractedTextPaneProps {
  page: MarkdownPage | null;
  batchSummary: BatchSummary | null;
  searchQuery: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Highlight search matches in text with <mark> tags */
function highlightText(text: string, query: string): React.ReactNode[] {
  if (!query || query.length < 2) return [text];
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/** Simple markdown renderer - converts basic markdown to React elements */
function renderMarkdown(text: string, searchQuery: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    const h3Match = line.match(/^###\s+(.*)/);
    const h2Match = line.match(/^##\s+(.*)/);
    const h1Match = line.match(/^#\s+(.*)/);

    if (h1Match) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-gray-900 mt-4 mb-2">
          {highlightText(h1Match[1], searchQuery)}
        </h2>
      );
    } else if (h2Match) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-gray-900 mt-3 mb-1.5">
          {highlightText(h2Match[1], searchQuery)}
        </h3>
      );
    } else if (h3Match) {
      elements.push(
        <h4 key={i} className="text-sm font-semibold text-gray-800 mt-2 mb-1">
          {highlightText(h3Match[1], searchQuery)}
        </h4>
      );
    } else if (line.match(/^\s*[-*]\s+/)) {
      // List items
      const content = line.replace(/^\s*[-*]\s+/, '');
      elements.push(
        <li key={i} className="text-sm text-gray-700 ml-4 list-disc">
          {highlightInline(content, searchQuery)}
        </li>
      );
    } else if (line.match(/^\s*\d+\.\s+/)) {
      // Numbered list items
      const content = line.replace(/^\s*\d+\.\s+/, '');
      elements.push(
        <li key={i} className="text-sm text-gray-700 ml-4 list-decimal">
          {highlightInline(content, searchQuery)}
        </li>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      // Regular paragraph
      elements.push(
        <p key={i} className="text-sm text-gray-700 leading-relaxed">
          {highlightInline(line, searchQuery)}
        </p>
      );
    }
  }

  return elements;
}

/** Process inline markdown (bold, italic) and search highlighting */
function highlightInline(text: string, searchQuery: string): React.ReactNode[] {
  // First apply bold/italic, then search highlighting
  // Process **bold** patterns
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const segment = text.slice(lastIndex, match.index);
      parts.push(...highlightText(segment, searchQuery));
    }
    parts.push(
      <strong key={`b-${match.index}`} className="font-semibold text-gray-900">
        {highlightText(match[1], searchQuery)}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(...highlightText(text.slice(lastIndex), searchQuery));
  }

  return parts.length > 0 ? parts : highlightText(text, searchQuery);
}

export default function ExtractedTextPane({
  page,
  batchSummary,
  searchQuery,
}: ExtractedTextPaneProps) {
  const [copied, setCopied] = useState(false);
  const [batchExpanded, setBatchExpanded] = useState(false);

  const handleCopy = async () => {
    if (page?.markdown) {
      await navigator.clipboard.writeText(page.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortFileName = (file: string) => {
    const parts = file.split('/');
    return parts[parts.length - 1] || file;
  };

  if (!page) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        <div className="text-center">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Select a page to view extracted text</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200">
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">Page {page.page_number}</span>
          {' — '}
          <span>{shortFileName(page.file)}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 bg-white">
        {/* Contextual batch summary card — shown above extracted text */}
        {batchSummary && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div
              className="border border-blue-200 bg-blue-50 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setBatchExpanded(!batchExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    AI Summary — Batch {batchSummary.batch_num}
                  </span>
                  <span className="text-xs text-blue-600">
                    (Pages {batchSummary.page_start}–{batchSummary.page_end})
                  </span>
                </div>
                {batchExpanded ? (
                  <ChevronUp className="w-4 h-4 text-blue-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-blue-400" />
                )}
              </button>

              {batchExpanded && (
                <div className="px-4 pb-4 text-sm text-blue-900 space-y-0">
                  {renderMarkdown(batchSummary.summary, searchQuery)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Extracted text rendered as prose */}
        <div className="space-y-0">
          {renderMarkdown(page.markdown, searchQuery)}
        </div>
      </div>
    </div>
  );
}
