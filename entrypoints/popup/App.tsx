/**
 * Popup principal de Extension Doctor.
 *
 * Muestra el dashboard de riesgo con:
 * - Score global
 * - Lista de extensiones agrupadas por nivel de riesgo
 * - Acciones rápidas (re-analizar, abrir opciones)
 *
 * TODO: Implementar vista de detalle por extensión
 * TODO: Implementar indicador de "sin revisar" (no en la base)
 */

import { useState, useEffect, useRef } from 'react';
import {
  getAnalyzedExtensions,
  getDashboardSummary,
  getPreferences,
  savePreferences,
} from '@/lib/storage';
import { Onboarding } from './components/Onboarding';
import type { AnalyzedExtension, DashboardSummary, RiskLevel, UserPreferences } from '@/lib/types';
import { getRiskDisplay, getScoreColor } from '@/lib/risk-display';

// Orden de severidad para mostrar en el popup
const RISK_ORDER: RiskLevel[] = ['critical', 'high', 'medium', 'low'];

export default function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [extensions, setExtensions] = useState<AnalyzedExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [sum, exts, prefs] = await Promise.all([
        getDashboardSummary(),
        getAnalyzedExtensions(),
        getPreferences(),
      ]);
      setSummary(sum);
      setExtensions(exts);
      setPrefs(prefs);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReanalyze() {
    setAnalyzing(true);
    try {
      await browser.runtime.sendMessage({ type: 'RUN_ANALYSIS' });
      // Esperar un momento para que el background termine
      await new Promise((r) => setTimeout(r, 500));
      await loadData();
    } finally {
      setAnalyzing(false);
    }
  }

  function handleOpenOptions() {
    browser.runtime.openOptionsPage();
  }

  // Removed problematic ResizeObserver that causes jitter in Chrome Popups

  // ─── Loading state ──────────────────────────────────────────
  if (loading || !prefs) {
    return (
      <div id="app-container" className="flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-doctor-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Cargando datos...</p>
        </div>
      </div>
    );
  }

  // ─── Onboarding state ───────────────────────────────────────
  if (!prefs.onboardingCompleted) {
    return (
      <Onboarding 
        onComplete={async () => {
          await handleReanalyze();
        }} 
        initialPrefs={prefs}
      />
    );
  }

  // ─── Dashboard ──────────────────────────────────────────────
  if (!summary) {
    return (
      <div id="app-container" className="flex items-center justify-center text-slate-400">
        Sin datos. Re-analiza para generar el dashboard.
        <button onClick={handleReanalyze} className="ml-2 underline text-doctor-400">Re-analizar</button>
      </div>
    );
  }

  const groupedByRisk = RISK_ORDER.map((level) => ({
    level,
    display: getRiskDisplay(level),
    extensions: extensions
      .filter((e) => e.enabled && e.analysis.riskLevel === level)
      .sort((a, b) => a.analysis.score - b.analysis.score),
  })).filter((g) => g.extensions.length > 0);

  return (
    <div 
      id="app-container" 
      ref={containerRef}
      className="flex flex-col relative h-full w-full"
    >
      <div className="flex-1 overflow-y-auto w-full">
        {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold flex items-center gap-1.5">
            🩺 Extension Doctor
          </h1>
          <div className="flex gap-1.5">
            <button
              onClick={handleReanalyze}
              disabled={analyzing}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
              title="Re-analizar"
            >
              <span className={analyzing ? 'animate-spin inline-block' : ''}>
                🔄
              </span>
            </button>
            <button
              onClick={handleOpenOptions}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Opciones"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Score global */}
      <div className="px-4 py-3">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 text-center">
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
            Score global
          </p>
          <p
            className="text-3xl font-bold"
            style={{ color: getScoreColor(summary.globalScore) }}
          >
            {summary.globalScore}
            <span className="text-base font-normal text-slate-500">/100</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {summary.enabledExtensions} extensiones activas
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-4 pb-2 grid grid-cols-4 gap-2">
        {RISK_ORDER.map((level) => {
          const display = getRiskDisplay(level);
          const count = summary.byRisk[level];
          return (
            <div
              key={level}
              className={`rounded-lg p-2 text-center ${display.bgClass} border ${display.borderClass}`}
            >
              <p className="text-lg font-bold">{count}</p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {display.emoji} {display.label.split(' ')[0]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Extension list by risk */}
      <div className="px-4 py-2 space-y-3">
        {groupedByRisk.map(({ level, display, extensions: exts }) => (
          <div key={level}>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              {display.emoji} {display.label} ({exts.length})
            </h2>
            <div className="space-y-1">
              {exts.map((ext) => (
                <ExtensionRow key={ext.id} extension={ext} />
              ))}
            </div>
          </div>
        ))}
      </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-600">
            Análisis heurístico orientativo · No sustituye a un antivirus
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Extension row component ──────────────────────────────────

function ExtensionRow({ extension }: { extension: AnalyzedExtension }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const display = getRiskDisplay(extension.analysis.riskLevel);

  async function toggleEnable(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await browser.management.setEnabled(extension.id, !extension.enabled);
      // Opcional: lanzar un evento para recargar la lista si no queremos esperar al background
    } catch (err) {
      console.error('Error toggling state', err);
    }
  }

  async function handleUninstall(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await browser.management.uninstall(extension.id, { showConfirmDialog: true });
    } catch (err) {
      console.error('Error uninstalling', err);
    }
  }

  return (
    <div className={`overflow-hidden rounded-lg bg-slate-800/30 border ${display.borderClass} transition-colors`}>
      <div
        className="flex items-center gap-3 p-2 hover:bg-slate-800/60 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
      {/* Icono */}
      <div className="w-6 h-6 flex-shrink-0 rounded overflow-hidden bg-slate-700">
        {extension.iconUrl ? (
          <img
            src={extension.iconUrl}
            alt=""
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs">
            🧩
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-medium truncate">{extension.name}</p>
          {extension.knowledgeBase?.status === 'trusted' && (
            <div className="flex-shrink-0 flex items-center bg-green-500/10 text-green-400 text-[8.5px] font-bold px-1 rounded-sm border border-green-500/20 tracking-tighter uppercase whitespace-nowrap" title="Verificado por Doctor Lab & VirusTotal">
              <span className="mr-0.5">🛡️</span> VERIFIED
            </div>
          )}
          {(extension.knowledgeBase?.status === 'malware' || (extension.knowledgeBase?.vtDetections ?? 0) > 0) && (
            <div className="flex-shrink-0 flex items-center bg-red-500/10 text-red-500 text-[8.5px] font-bold px-1 rounded-sm border border-red-500/20 tracking-tighter uppercase whitespace-nowrap" title="Detectado como MALWARE">
              <span className="mr-0.5">🚨</span> MALWARE
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-500">
          v{extension.version} · {extension.permissions.length} permisos
        </p>
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        <p
          className="text-sm font-bold"
          style={{ color: getScoreColor(extension.analysis.score) }}
        >
          {extension.analysis.score}
        </p>
      </div>
    </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/40 text-sm space-y-3">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={toggleEnable}
              className={`flex-1 py-1 px-2 rounded font-medium text-xs border ${
                extension.enabled
                  ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200'
                  : 'bg-doctor-600 hover:bg-doctor-500 border-doctor-500 text-white'
              } transition-colors`}
            >
              {extension.enabled ? 'Desactivar' : 'Activar'}
            </button>
            <button
              onClick={handleUninstall}
              className="flex-1 py-1 px-2 rounded font-medium text-xs border border-red-900/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
            >
              Desinstalar
            </button>
          </div>

          {/* Remote Knowledge Section - PREMIUM STYLE */}
          {extension.knowledgeBase && (
            <div className={`rounded-lg border p-2.5 overflow-hidden relative ${
              extension.knowledgeBase.status === 'trusted' 
                ? 'bg-green-500/5 border-green-500/20' 
                : 'bg-red-500/5 border-red-500/20'
            }`}>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                   <p className={`text-[10px] font-bold uppercase tracking-widest ${
                     extension.knowledgeBase.status === 'trusted' ? 'text-green-400' : 'text-red-400'
                   }`}>
                     Informe de Transparencia
                   </p>
                   {extension.knowledgeBase.vtDetections !== undefined && (
                     <p className={`text-[10px] font-mono px-1.5 rounded-full ${
                       extension.knowledgeBase.vtDetections === 0 
                         ? 'bg-green-500/20 text-green-300' 
                         : 'bg-red-500/20 text-red-300'
                     }`}>
                       VT: {extension.knowledgeBase.vtDetections} / {extension.knowledgeBase.vtEngines}
                     </p>
                   )}
                </div>
                <p className="text-xs text-slate-300 leading-normal mb-2">
                  {extension.knowledgeBase.reviewNotes}
                </p>
                <div className="flex flex-wrap gap-1">
                   {extension.knowledgeBase.status === 'trusted' ? (
                     <span className="text-[9px] bg-green-500/10 text-green-500/70 py-0.5 px-1.5 rounded-sm border border-green-500/10">
                       ✓ Firma CRX verificada
                     </span>
                   ) : (
                     <span className="text-[9px] bg-red-500/10 text-red-500/70 py-0.5 px-1.5 rounded-sm border border-red-500/10 font-bold">
                       ⚠ Código fuente comprometido
                     </span>
                   )}
                   <span className="text-[9px] bg-slate-500/10 text-slate-500 py-0.5 px-1.5 rounded-sm">
                     Analizado: {new Date(extension.knowledgeBase.reviewedAt).toLocaleDateString()}
                   </span>
                </div>
              </div>
              {/* Subtle background glow */}
              <div className={`absolute -right-4 -top-4 w-12 h-12 rounded-full blur-2xl opacity-20 ${
                extension.knowledgeBase.status === 'trusted' ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
            </div>
          )}

          {/* Description */}
          {extension.description && (
            <p className="text-xs text-slate-400 italic">"{extension.description}"</p>
          )}

          {/* Risk Signals */}
          {extension.analysis.signals.length > 0 && (
            <div>
              <p className="font-semibold text-xs text-slate-300 mb-1">Señales detectadas:</p>
              <ul className="space-y-1.5">
                {extension.analysis.signals.map((signal, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <span className="mt-0.5">
                      {signal.severity === 'critical' || signal.severity === 'danger' ? '🔴' 
                        : signal.severity === 'warning' ? '🟠' 
                        : '🔵'}
                    </span>
                    <div>
                      <span className="font-mono bg-slate-900 text-[10px] px-1 rounded text-slate-300 mr-1">
                        {signal.name}
                      </span>
                      <span className="text-slate-400 leading-tight">
                        {signal.explanation}
                        {signal.penalty > 0 && (
                          <span className="text-red-400 ml-1 font-medium">-{signal.penalty}</span>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dangerous Patterns */}
          {extension.analysis.dangerousPatterns.length > 0 && (
            <div>
              <p className="font-semibold text-xs text-red-400 mb-1">⚠️ Patrones de alto riesgo:</p>
              <ul className="space-y-2">
                {extension.analysis.dangerousPatterns.map((pattern, i) => (
                  <li key={i} className="text-xs bg-red-950/30 border border-red-900/30 p-2 rounded">
                    <p className="font-semibold text-red-300 mb-0.5">{pattern.name}</p>
                    <p className="text-slate-400 text-[11px] leading-tight mb-1">{pattern.explanation}</p>
                    <div className="flex flex-wrap gap-1">
                      {pattern.permissions.map((p) => (
                        <span key={p} className="font-mono bg-slate-900 text-[9px] px-1 rounded text-slate-500">
                          {p}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
