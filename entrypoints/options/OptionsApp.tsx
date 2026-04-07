/**
 * Página de opciones de Extension Doctor.
 *
 * Panel de configuración con:
 * - Privacidad y datos (toggles)
 * - Frecuencia de análisis automático
 * - Exportar datos del análisis
 * - Información y disclaimers
 */

import { useState, useEffect } from 'react';
import {
  getPreferences,
  savePreferences,
  getAnalyzedExtensions,
  getDashboardSummary,
  getLastAnalysisTimestamp,
} from '@/lib/storage';
import type { UserPreferences, AnalyzedExtension, DashboardSummary } from '@/lib/types';
import { DEFAULT_PREFERENCES } from '@/lib/types';

const INTERVAL_OPTIONS = [
  { value: 0, label: 'Desactivado' },
  { value: 60, label: 'Cada hora' },
  { value: 360, label: 'Cada 6 horas' },
  { value: 720, label: 'Cada 12 horas' },
  { value: 1440, label: 'Cada 24 horas' },
  { value: 10080, label: 'Semanal' },
];

export default function OptionsApp() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [extensions, setExtensions] = useState<AnalyzedExtension[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'done'>('idle');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [p, exts, sum, ts] = await Promise.all([
      getPreferences(),
      getAnalyzedExtensions(),
      getDashboardSummary(),
      getLastAnalysisTimestamp(),
    ]);
    setPrefs(p);
    setExtensions(exts);
    setSummary(sum);
    setLastAnalysis(ts);
  }

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleToggle(key: keyof UserPreferences) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    await savePreferences(updated);
    showSaved();
  }

  async function handleIntervalChange(value: number) {
    const updated = { ...prefs, autoAnalysisInterval: value };
    setPrefs(updated);
    await savePreferences(updated);
    showSaved();
  }

  function handleExportJSON() {
    const data = {
      exportedAt: new Date().toISOString(),
      summary,
      extensions: extensions.map((ext) => ({
        id: ext.id,
        name: ext.name,
        version: ext.version,
        enabled: ext.enabled,
        permissions: ext.permissions,
        hostPermissions: ext.hostPermissions,
        riskLevel: ext.analysis.riskLevel,
        score: ext.analysis.score,
        signals: ext.analysis.signals.map((s) => s.name),
        verified: !!ext.knowledgeBase,
        vtDetections: ext.knowledgeBase?.vtDetections ?? null,
        vtEngines: ext.knowledgeBase?.vtEngines ?? null,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extension-doctor-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportStatus('done');
    setTimeout(() => setExportStatus('idle'), 3000);
  }

  function handleExportCSV() {
    const header = 'Nombre,ID,Versión,Habilitada,Score,Riesgo,Permisos,Verificada VT,VT Detecciones,VT Motores\n';
    const rows = extensions.map((ext) =>
      [
        `"${ext.name}"`,
        ext.id,
        ext.version,
        ext.enabled ? 'Sí' : 'No',
        ext.analysis.score,
        ext.analysis.riskLevel,
        ext.permissions.length,
        ext.knowledgeBase ? 'Sí' : 'No',
        ext.knowledgeBase?.vtDetections ?? 'N/A',
        ext.knowledgeBase?.vtEngines ?? 'N/A',
      ].join(',')
    );

    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extension-doctor-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setExportStatus('done');
    setTimeout(() => setExportStatus('idle'), 3000);
  }

  async function handleResetData() {
    if (!confirm('¿Estás seguro de que quieres borrar todos los datos de análisis? Las preferencias se mantendrán.')) return;
    await browser.storage.local.remove(['ext_doctor_analyzed', 'ext_doctor_summary', 'ext_doctor_remote_db', 'last_analysis_timestamp']);
    setExtensions([]);
    setSummary(null);
    setLastAnalysis(null);
    showSaved();
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🩺 Extension Doctor
            <span className="text-sm font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">Opciones</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Configura cómo Extension Doctor analiza y gestiona tus extensiones.
          </p>
        </div>

        {/* ── Stats rápidos ────────────────────────────────── */}
        {summary && (
          <section className="mb-8">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Extensiones" value={String(summary.enabledExtensions)} icon="🧩" />
              <StatCard label="Score Global" value={`${summary.globalScore}/100`} icon="📊" />
              <StatCard
                label="Último análisis"
                value={lastAnalysis ? formatDate(lastAnalysis) : 'Nunca'}
                icon="🕐"
                small
              />
            </div>
          </section>
        )}

        {/* ── Privacidad ──────────────────────────────────── */}
        <Section title="Privacidad y datos" icon="🔒">
          <ToggleOption
            label="Consultar base de conocimiento remota"
            description="Descarga datos de VirusTotal desde GitHub para enriquecer el análisis. No se envía ninguna información personal."
            checked={prefs.enableRemoteLookup}
            onChange={() => handleToggle('enableRemoteLookup')}
          />
          <ToggleOption
            label="Notificar cambios de permisos"
            description="Recibe una notificación cuando una extensión instalada cambie sus permisos tras una actualización."
            checked={prefs.notifyOnPermissionChange}
            onChange={() => handleToggle('notifyOnPermissionChange')}
          />
        </Section>

        {/* ── Análisis automático ─────────────────────────── */}
        <Section title="Análisis automático" icon="⏱️">
          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <p className="text-sm font-medium mb-1">Frecuencia de re-análisis</p>
            <p className="text-xs text-slate-400 mb-3">
              Extension Doctor puede re-analizar periódicamente tus extensiones en segundo plano para detectar cambios.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleIntervalChange(opt.value)}
                  className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all border ${
                    prefs.autoAnalysisInterval === opt.value
                      ? 'bg-doctor-600 border-doctor-500 text-white shadow-md shadow-doctor-600/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Exportar datos ──────────────────────────────── */}
        <Section title="Exportar datos" icon="📦">
          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <p className="text-sm font-medium mb-1">Descargar informe de análisis</p>
            <p className="text-xs text-slate-400 mb-3">
              Exporta todos los datos del análisis actual ({extensions.length} extensiones) en formato JSON o CSV.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleExportJSON}
                className="flex-1 py-2 px-3 rounded-md text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                📄 Exportar JSON
              </button>
              <button
                onClick={handleExportCSV}
                className="flex-1 py-2 px-3 rounded-md text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                📊 Exportar CSV
              </button>
            </div>
            {exportStatus === 'done' && (
              <p className="text-xs text-green-400 mt-2 text-center animate-pulse">✓ Archivo descargado con éxito</p>
            )}
          </div>
        </Section>

        {/* ── Zona peligrosa ─────────────────────────────── */}
        <Section title="Zona peligrosa" icon="⚠️">
          <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/30">
            <p className="text-sm font-medium mb-1 text-red-300">Borrar datos de análisis</p>
            <p className="text-xs text-slate-400 mb-3">
              Elimina todos los resultados almacenados localmente. Tus preferencias se mantienen. El próximo análisis regenerará los datos desde cero.
            </p>
            <button
              onClick={handleResetData}
              className="py-1.5 px-4 rounded-md text-xs font-medium bg-red-500/10 border border-red-900/50 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              🗑️ Borrar todos los datos
            </button>
          </div>
        </Section>

        {/* ── Sobre la extensión ──────────────────────────── */}
        <Section title="Sobre Extension Doctor" icon="ℹ️">
          <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 space-y-3">
            <p className="text-sm text-slate-300">
              Extension Doctor analiza los permisos declarados de tus extensiones de Chrome y calcula un nivel de riesgo orientativo. Las extensiones verificadas han sido escaneadas con VirusTotal a través de nuestro laboratorio automatizado.
            </p>
            <p className="text-xs text-slate-400">
              ⚠️ No sustituye a un antivirus ni garantiza la ausencia de software malicioso. El análisis se basa en metadatos, permisos declarados y resultados de VirusTotal.
            </p>
            <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50">
              <span className="text-[11px] text-slate-500">Versión 0.1.0</span>
              <span className="text-[11px] text-slate-600">·</span>
              <a
                href="https://github.com/Tarkiin/extension-doctor-db"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-doctor-400 hover:text-doctor-300 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </Section>

        {/* Saved toast */}
        {saved && (
          <div className="fixed bottom-6 right-6 bg-doctor-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-doctor-600/30 animate-pulse">
            ✓ Guardado
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Componentes auxiliares ──────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold mb-3 text-doctor-400 flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function StatCard({ label, value, icon, small }: { label: string; value: string; icon: string; small?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3 text-center">
      <p className="text-lg mb-0.5">{icon}</p>
      <p className={`font-bold ${small ? 'text-xs' : 'text-lg'} text-slate-100`}>{value}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
      <button
        onClick={onChange}
        className={`mt-0.5 w-10 h-5 rounded-full flex-shrink-0 transition-colors relative ${
          checked ? 'bg-doctor-500' : 'bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
