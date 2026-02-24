'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, ExternalLink, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMediaUrl } from '@/lib/api';

interface InlinePdfViewerProps {
  applicationId: string;
  fileName: string;
  pageNumber: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function InlinePdfViewer({
  applicationId,
  fileName,
  pageNumber,
  totalPages,
  onPrevPage,
  onNextPage,
}: InlinePdfViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const prevFileName = useRef(fileName);

  const handleZoomIn = () => setZoom(Math.min(zoom + 25, 200));
  const handleZoomOut = () => setZoom(Math.max(zoom - 25, 50));

  // Construct full URL pointing directly to the API backend
  const pdfBaseUrl = useMemo(
    () => getMediaUrl(`/api/applications/${applicationId}/files/${fileName}`),
    [applicationId, fileName]
  );
  const pdfUrl = `${pdfBaseUrl}#page=${pageNumber}&toolbar=1&navpanes=0&view=FitH`;

  // When file name changes reset error/loading state
  useEffect(() => {
    if (prevFileName.current !== fileName) {
      setLoadError(false);
      setLoading(true);
      prevFileName.current = fileName;
    }
  }, [fileName]);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
            title="Zoom out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 min-w-[3rem] text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
            title="Zoom in (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <a
          href={pdfBaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Tab</span>
        </a>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-2">
        {loadError ? (
          <div className="bg-white rounded-lg shadow p-8 text-center max-w-sm mt-8">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-gray-900 mb-1">PDF preview unavailable</h4>
            <p className="text-xs text-gray-500 mb-4">
              The PDF cannot be displayed inline for this page.
            </p>
            <a
              href={pdfBaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Full PDF
            </a>
          </div>
        ) : (
          <div
            className="bg-white shadow rounded-lg overflow-hidden w-full h-full"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Loading PDF...</p>
                </div>
              </div>
            )}
            <iframe
              key={`${fileName}-${pageNumber}`}
              src={pdfUrl}
              className="w-full h-full min-h-[600px] border-0"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoadError(true);
                setLoading(false);
              }}
              title={`PDF preview — ${fileName} page ${pageNumber}`}
            />
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 px-3 py-2 bg-white border-t border-gray-200">
        <button
          onClick={onPrevPage}
          disabled={pageNumber <= 1}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Prev
        </button>
        <span className="text-xs text-gray-500">
          Page {pageNumber} / {totalPages}
        </span>
        <button
          onClick={onNextPage}
          disabled={pageNumber >= totalPages}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
