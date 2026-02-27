'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, Download, Sparkles, RefreshCw, Loader2, Users } from 'lucide-react';
import BodyDiagram from './BodyDiagram';
import PendingInvestigationsCard from './PendingInvestigationsCard';
import LastOfficeVisitCard from './LastOfficeVisitCard';
import BodySystemCard from './BodySystemCard';
import AbnormalLabsCard from './AbnormalLabsCard';
import LatestVitalsCard from './LatestVitalsCard';
import { PageRefBadges } from './PageRefBadge';
import type { ApplicationMetadata, DeepDiveData, ParsedOutput } from '@/lib/types';
import { getDeepDiveData, runDeepDiveAnalysis, pollForDeepDiveCompletion } from '@/lib/api';

interface BodySystemDeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicationMetadata;
  onNavigateToPage?: (page: number) => void;
  onRerunAnalysis?: () => Promise<void>;
  onApplicationUpdate?: (app: ApplicationMetadata) => void;
}

export default function BodySystemDeepDiveModal({
  isOpen,
  onClose,
  application,
  onNavigateToPage,
  onRerunAnalysis,
  onApplicationUpdate,
}: BodySystemDeepDiveModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const systemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);
  const [rerunStatus, setRerunStatus] = useState<string>('');
  const [currentApp, setCurrentApp] = useState<ApplicationMetadata>(application);
  
  // Update current app when prop changes
  useEffect(() => {
    setCurrentApp(application);
  }, [application]);
  
  // Cleanup timeout on unmount or close
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handlePageClick = useCallback(
    (page: number) => {
      onNavigateToPage?.(page);
    },
    [onNavigateToPage]
  );

  const handleRegionClick = useCallback((systemCode: string) => {
    const el = systemRefs.current.get(systemCode);
    if (el && detailPanelRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
  
  const handleDeepDiveRerun = async () => {
    if (isRerunning) return;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsRerunning(true);
    setRerunStatus('Starting deep dive analysis...');
    
    try {
      // Start deep dive in background
      await runDeepDiveAnalysis(currentApp.id, true);
      setRerunStatus('Deep dive analysis running...');
      
      // Poll for completion (checks for processing_status !== 'analyzing')
      const updatedApp = await pollForDeepDiveCompletion(currentApp.id);
      setRerunStatus('Deep dive complete!');
      setCurrentApp(updatedApp);
      onApplicationUpdate?.(updatedApp);
      
      timeoutRef.current = setTimeout(() => {
        setRerunStatus('');
        setIsRerunning(false);
        timeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to run deep dive:', err);
      setRerunStatus('Deep dive failed. Please try again.');
      timeoutRef.current = setTimeout(() => {
        setRerunStatus('');
        setIsRerunning(false);
        timeoutRef.current = null;
      }, 3000);
    }
  };

  if (!isOpen) return null;

  const deepDive: DeepDiveData = getDeepDiveData(currentApp);
  const hasAnalysis = currentApp.status === 'completed' || !!currentApp.llm_outputs;
  const caseRef = currentApp.external_reference || currentApp.id;

  // Family history from existing analysis
  const familyHistory = deepDive.familyHistory as (ParsedOutput & { relatives?: Array<{ relationship: string; condition: string; age_at_onset?: string; age_at_death?: string; notes?: string; page_references?: number[] }> }) | null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-[95vw] h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Body System Deep Dive
            </h2>
            <span className="text-sm text-slate-500">— {caseRef}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-3 h-3" />
              AI Analysis
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Simple print for PDF export
                window.print();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!hasAnalysis ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-500 mb-4">No analysis has been run for this application.</p>
              <p className="text-sm text-slate-400">Run analysis to generate the body system deep dive.</p>
            </div>
          </div>
        ) : !deepDive.hasData ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <p className="text-slate-500 mb-4">
                This application was analyzed before the Deep Dive feature was available.
              </p>
              {rerunStatus && (
                <div className="mb-4 p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm flex items-center gap-2 justify-center">
                  {isRerunning && <Loader2 className="w-4 h-4 animate-spin" />}
                  {rerunStatus}
                </div>
              )}
              <button
                onClick={handleDeepDiveRerun}
                disabled={isRerunning}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRerunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isRerunning ? 'Analyzing...' : 'Run Deep Dive Analysis'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel — Body Diagram */}
            <div className="w-72 flex-shrink-0 border-r border-slate-200 overflow-y-auto p-4 bg-slate-50/50">
              <BodyDiagram
                bodySystems={deepDive.bodySystemReview?.body_systems || []}
                onRegionClick={handleRegionClick}
              />

              {/* Quick stats */}
              <div className="mt-4 space-y-2">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Pending Investigations</div>
                  <div className="text-lg font-semibold text-slate-800">
                    {deepDive.pendingInvestigations?.pending_investigations?.length || 0}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Abnormal Labs</div>
                  <div className="text-lg font-semibold text-slate-800">
                    {deepDive.abnormalLabs?.abnormal_labs?.length || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel — Detail sections */}
            <div ref={detailPanelRef} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Pending Investigations */}
              <PendingInvestigationsCard
                investigations={deepDive.pendingInvestigations?.pending_investigations || []}
                summary={deepDive.pendingInvestigations?.summary}
                onPageClick={handlePageClick}
              />

              {/* Last Office Visit & Labs */}
              <LastOfficeVisitCard
                lov={deepDive.lastOfficeVisit?.last_office_visit || null}
                lastLabs={deepDive.lastOfficeVisit?.last_labs || null}
                onPageClick={handlePageClick}
              />

              {/* Body System Cards */}
              {deepDive.bodySystemReview?.body_systems?.map((sys) => (
                <div
                  key={sys.system_code}
                  ref={(el) => {
                    if (el) systemRefs.current.set(sys.system_code, el);
                  }}
                >
                  <BodySystemCard system={sys} onPageClick={handlePageClick} />
                </div>
              ))}

              {/* Abnormal Labs */}
              <AbnormalLabsCard
                labs={deepDive.abnormalLabs?.abnormal_labs || []}
                onPageClick={handlePageClick}
              />

              {/* Latest Vitals */}
              <LatestVitalsCard
                vitals={deepDive.latestVitals?.latest_vitals || null}
                onPageClick={handlePageClick}
              />

              {/* Family History */}
              {familyHistory && (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-purple-500" /> Family History
                  </h3>
                  {familyHistory.summary && (
                    <p className="text-sm text-slate-700 mb-3">{familyHistory.summary}</p>
                  )}
                  {familyHistory.relatives && familyHistory.relatives.length > 0 ? (
                    <ul className="space-y-1.5">
                      {familyHistory.relatives.map((rel, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-slate-400">•</span>
                          <span>
                            <span className="font-medium">{rel.relationship}</span>
                            {' — '}
                            {rel.condition}
                            {rel.age_at_onset && ` (age ${rel.age_at_onset})`}
                            {rel.age_at_death && `, deceased (age ${rel.age_at_death})`}
                            {rel.notes && <span className="text-slate-500"> — {rel.notes}</span>}
                          </span>
                          {rel.page_references && (
                            <PageRefBadges pages={rel.page_references} onClick={handlePageClick} />
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No family history details available.</p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="text-center py-4">
                <span className="text-xs text-slate-400">Powered by AI Analysis</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
