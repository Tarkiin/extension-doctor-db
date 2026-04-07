/**
 * Utilidades de almacenamiento local usando browser.storage.local (WXT).
 * Centraliza el acceso al storage para mantener consistencia.
 */

import type {
  AnalyzedExtension,
  DashboardSummary,
  UserPreferences,
} from './types';
import { DEFAULT_PREFERENCES } from './types';
import { browser } from 'wxt/browser';

const STORAGE_KEYS = {
  ANALYZED_EXTENSIONS: 'ext_doctor_analyzed',
  DASHBOARD_SUMMARY: 'ext_doctor_summary',
  USER_PREFERENCES: 'ext_doctor_preferences',
  LAST_ANALYSIS_TIMESTAMP: 'last_analysis_timestamp',
  REMOTE_DB: 'ext_doctor_remote_db',
} as const;

// ─── Extensiones analizadas ─────────────────────────────────────

export async function saveAnalyzedExtensions(
  extensions: AnalyzedExtension[]
): Promise<void> {
  await browser.storage.local.set({
    [STORAGE_KEYS.ANALYZED_EXTENSIONS]: extensions,
    [STORAGE_KEYS.LAST_ANALYSIS_TIMESTAMP]: new Date().toISOString(),
  });
}

export async function getAnalyzedExtensions(): Promise<AnalyzedExtension[]> {
  const result = await browser.storage.local.get(
    STORAGE_KEYS.ANALYZED_EXTENSIONS
  );
  return (result[STORAGE_KEYS.ANALYZED_EXTENSIONS] as AnalyzedExtension[]) ?? [];
}

// ─── Dashboard summary ─────────────────────────────────────────

export async function saveDashboardSummary(
  summary: DashboardSummary
): Promise<void> {
  await browser.storage.local.set({
    [STORAGE_KEYS.DASHBOARD_SUMMARY]: summary,
  });
}

export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  const result = await browser.storage.local.get(
    STORAGE_KEYS.DASHBOARD_SUMMARY
  );
  return (result[STORAGE_KEYS.DASHBOARD_SUMMARY] as DashboardSummary) ?? null;
}

// ─── Preferencias del usuario ───────────────────────────────────

export async function savePreferences(
  prefs: Partial<UserPreferences>
): Promise<void> {
  const current = await getPreferences();
  await browser.storage.local.set({
    [STORAGE_KEYS.USER_PREFERENCES]: { ...current, ...prefs },
  });
}

export async function getPreferences(): Promise<UserPreferences> {
  const result = await browser.storage.local.get(
    STORAGE_KEYS.USER_PREFERENCES
  );
  return {
    ...DEFAULT_PREFERENCES,
    ...((result[STORAGE_KEYS.USER_PREFERENCES] as Partial<UserPreferences>) ?? {}),
  };
}

// ─── Timestamp último análisis ──────────────────────────────────

export async function getLastAnalysisTimestamp(): Promise<string | null> {
  const result = await browser.storage.local.get(
    STORAGE_KEYS.LAST_ANALYSIS_TIMESTAMP
  );
  return (result[STORAGE_KEYS.LAST_ANALYSIS_TIMESTAMP] as string) ?? null;
}

// ─── Remote Database Storage ───────────────────────────────────

export async function getRemoteKnowledge(): Promise<Record<string, any>> {
  try {
    const data = await browser.storage.local.get(STORAGE_KEYS.REMOTE_DB);
    return data[STORAGE_KEYS.REMOTE_DB] || {};
  } catch (err) {
    console.error('Error getting remote DB from storage:', err);
    return {};
  }
}

export async function saveRemoteKnowledge(knowledge: Record<string, any>): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.REMOTE_DB]: knowledge
    });
  } catch (err) {
    console.error('Error saving remote DB to storage:', err);
  }
}
