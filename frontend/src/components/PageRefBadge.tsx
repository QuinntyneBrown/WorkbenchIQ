'use client';

import React from 'react';

interface PageRefBadgeProps {
  page: number;
  onClick?: (page: number) => void;
}

export default function PageRefBadge({ page, onClick }: PageRefBadgeProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(page);
      }}
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer border border-slate-200 hover:border-indigo-200"
      title={`Go to page ${page}`}
    >
      p.{page}
    </button>
  );
}

export function PageRefBadges({
  pages,
  onClick,
}: {
  pages: number[];
  onClick?: (page: number) => void;
}) {
  if (!pages || pages.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {pages.map((p) => (
        <PageRefBadge key={p} page={p} onClick={onClick} />
      ))}
    </span>
  );
}
