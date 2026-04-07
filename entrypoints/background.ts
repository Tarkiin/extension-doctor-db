/**
 * Background service worker para Extension Doctor.
 *
 * Responsabilidades:
 * - Escuchar eventos de instalación/actualización de extensiones
 * - Ejecutar análisis heurístico bajo demanda y periódicamente
 * - Actualizar el badge del icono con el resumen de riesgo
 * - Gestionar alarmas para re-análisis automático
 */

import { buildAnalyzedExtension, type ExtensionInfoInput } from '@/lib/analyzer';
import {
  saveAnalyzedExtensions,
  saveDashboardSummary,
  getPreferences,
  saveRemoteKnowledge,
  getRemoteKnowledge,
} from '@/lib/storage';
import type { AnalyzedExtension, DashboardSummary, RiskLevel, RemoteKnowledgeEntry } from '@/lib/types';

const ALARM_NAME = 'extension-doctor-reanalyze';
const REMOTE_DB_URL = 'https://raw.githubusercontent.com/Tarkiin/extension-doctor-db/main/extensions.json';

export default defineBackground(() => {
  // ─── Al instalar la extensión ───────────────────────────────
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      console.log('[Extension Doctor] Instalación inicial. Sincronizando BD remota y ejecutando primer análisis...');
      await fetchRemoteDB();
      await runFullAnalysis();
    }
    if (details.reason === 'update') {
      console.log('[Extension Doctor] Actualización detectada. Sincronizando BD remota y re-analizando...');
      await fetchRemoteDB();
      await runFullAnalysis();
    }
  });

  // ─── Listener: cuando se instala/desinstala una extensión ───
  if (browser.management) {
    browser.management.onInstalled?.addListener(async () => {
      console.log('[Extension Doctor] Nueva extensión detectada. Re-analizando...');
      await runFullAnalysis();
    });

    browser.management.onUninstalled?.addListener(async () => {
      console.log('[Extension Doctor] Extensión desinstalada. Re-analizando...');
      await runFullAnalysis();
    });

    browser.management.onEnabled?.addListener(async () => {
      await runFullAnalysis();
    });

    browser.management.onDisabled?.addListener(async () => {
      await runFullAnalysis();
    });
  } else {
    console.warn('[Extension Doctor] La API de management no está disponible. Asegúrate de tener el permiso en el manifest y recargar la extensión.');
  }

  // ─── Listener: alarma para re-análisis periódico ────────────
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
      console.log('[Extension Doctor] Re-análisis periódico. Actualizando BD local...');
      await fetchRemoteDB();
      await runFullAnalysis();
    }
  });

  // ─── Listener: mensajes desde el popup u options ────────────
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'RUN_ANALYSIS') {
      fetchRemoteDB().then(() => runFullAnalysis()).then(() => sendResponse({ success: true }));
      return true; // mantener el canal abierto para async
    }
  });

  // ─── Setup inicial ──────────────────────────────────────────
  setupAlarms();
});

// ─── Funciones de análisis ──────────────────────────────────────

async function fetchRemoteDB(): Promise<void> {
  try {
    console.log('[Extension Doctor] Descargando base de datos maestra desde Github...');
    const res = await fetch(REMOTE_DB_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    
    // Convertir de Array a Diccionario (hashmap) para Búsqueda Rápida (O(1))
    const arrayData = await res.json() as RemoteKnowledgeEntry[];
    const knowledgeMap: Record<string, RemoteKnowledgeEntry> = {};
    for (const entry of arrayData) {
      knowledgeMap[entry.extensionId] = entry;
    }
    
    await saveRemoteKnowledge(knowledgeMap);
    console.log(`✅ [Extension Doctor] Base Remota sincronizada: ${Object.keys(knowledgeMap).length} extensiones firmadas por VirusTotal.`);
  } catch (err) {
    console.warn('⚠️ [Extension Doctor] Error sincronizando la DB remota (¿No hay internet?):', err);
  }
}

async function runFullAnalysis(): Promise<void> {
  try {
    if (!browser.management) {
      console.warn('[Extension Doctor] La API de management no está disponible. Abortando análisis.');
      return;
    }

    const extensions = await browser.management.getAll();
    const remoteDB = await getRemoteKnowledge(); // Leemos la sabiduría asíncrona de Github

    // Filtrar: no analizarse a sí mismo, ni temas
    const filtered = extensions.filter(
      (ext) =>
        ext.id !== browser.runtime.id &&
        ext.type !== 'theme'
    );

    // Analizar cada extensión
    const analyzed: AnalyzedExtension[] = await Promise.all(
      filtered.map(async (ext) => {
        // Obtener permission warnings
        let warnings: string[] = [];
        try {
          warnings = await browser.management.getPermissionWarningsById(ext.id);
        } catch {
          // Algunos tipos de extensión no soportan esto
        }

        const knowledgeBase = remoteDB[ext.id]; // Inyectamos lo descargado si existe
        return buildAnalyzedExtension(ext as unknown as ExtensionInfoInput, warnings, knowledgeBase);
      })
    );

    // Guardar resultados
    await saveAnalyzedExtensions(analyzed);

    // Calcular y guardar summary
    const summary = buildDashboardSummary(analyzed);
    await saveDashboardSummary(summary);

    // Actualizar badge
    await updateBadge(summary);

    console.log(
      `[Extension Doctor] Análisis completado: ${analyzed.length} extensiones, score global: ${summary.globalScore}`
    );
  } catch (error) {
    console.error('[Extension Doctor] Error en análisis:', error);
  }
}

function buildDashboardSummary(
  extensions: AnalyzedExtension[]
): DashboardSummary {
  const enabled = extensions.filter((e) => e.enabled);

  const byRisk: Record<RiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  let totalScore = 0;
  for (const ext of enabled) {
    byRisk[ext.analysis.riskLevel]++;
    totalScore += ext.analysis.score;
  }

  const globalScore =
    enabled.length > 0 ? Math.round(totalScore / enabled.length) : 100;

  return {
    totalExtensions: extensions.length,
    enabledExtensions: enabled.length,
    globalScore,
    byRisk,
    unknownCount: extensions.filter((e) => !e.knowledgeBase).length,
    lastAnalyzedAt: new Date().toISOString(),
  };
}

async function updateBadge(summary: DashboardSummary): Promise<void> {
  const { critical, high } = summary.byRisk;
  const alertCount = critical + high;

  if (alertCount > 0) {
    await browser.action.setBadgeText({ text: String(alertCount) });
    await browser.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } else {
    await browser.action.setBadgeText({ text: '' });
  }
}

async function setupAlarms(): Promise<void> {
  const prefs = await getPreferences();

  // Limpiar alarma anterior
  await browser.alarms.clear(ALARM_NAME);

  if (prefs.autoAnalysisInterval > 0) {
    await browser.alarms.create(ALARM_NAME, {
      periodInMinutes: prefs.autoAnalysisInterval,
    });
  }
}
