/**
 * Tipos centrales del proyecto Extension Doctor.
 * Definen el modelo de datos para extensiones, análisis y la base de conocimiento.
 */

// ─── Extensión analizada localmente ─────────────────────────────

export interface AnalyzedExtension {
  /** ID único de la extensión en Chrome Web Store */
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  installType: string;
  type: string;
  /** Permisos declarados (API permissions) */
  permissions: string[];
  /** Host permissions (<all_urls>, dominios específicos, etc.) */
  hostPermissions: string[];
  /** Textos de warning que Chrome mostraría al usuario */
  permissionWarnings: string[];
  /** URL del icono de la extensión */
  iconUrl?: string;
  /** URL de la página de Chrome Web Store */
  homepageUrl?: string;
  /** Si la extensión se puede desinstalar por el usuario */
  mayDisable: boolean;
  /** Resultado del análisis heurístico */
  analysis: ExtensionAnalysis;
  /** Datos de la base de conocimiento remota (si existe) */
  knowledgeBase?: RemoteKnowledgeEntry;
}

// ─── Resultado del análisis heurístico ──────────────────────────

export interface ExtensionAnalysis {
  /** Score final: 0-100 (100 = menor riesgo) */
  score: number;
  /** Clasificación de riesgo */
  riskLevel: RiskLevel;
  /** Señales de riesgo detectadas */
  signals: RiskSignal[];
  /** Patrones peligrosos detectados (combinaciones) */
  dangerousPatterns: DangerousPattern[];
  /** Timestamp del análisis */
  analyzedAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskSignal {
  /** Tipo de señal */
  type: 'permission' | 'host' | 'install' | 'context';
  /** Nombre técnico del permiso o señal */
  name: string;
  /** Explicación humana de lo que implica */
  explanation: string;
  /** Puntos que resta al score */
  penalty: number;
  /** Severidad de la señal */
  severity: 'info' | 'warning' | 'danger' | 'critical';
}

export interface DangerousPattern {
  /** Nombre del patrón */
  name: string;
  /** Permisos involucrados */
  permissions: string[];
  /** Explicación clara del riesgo */
  explanation: string;
  /** Penalización adicional */
  penalty: number;
}

// ─── Base de conocimiento remota ────────────────────────────────

export interface PermissionHistoryEntry {
  version: string;
  permissions: string[];
  hostPermissions: string[];
  changedAt: string;
}

// ─── Cola de revisión ───────────────────────────────────────────

export interface ReviewSubmission {
  extensionId: string;
  name: string;
  version: string;
  permissions: string[];
  hostPermissions: string[];
  installType: string;
  /** Score heurístico local calculado al enviar */
  localScore: number;
  submittedAt: string;
}

// ─── Dashboard / resumen global ─────────────────────────────────

export interface DashboardSummary {
  totalExtensions: number;
  enabledExtensions: number;
  globalScore: number;
  byRisk: Record<RiskLevel, number>;
  unknownCount: number;
  lastAnalyzedAt: string;
}

// ─── Preferencias del usuario ───────────────────────────────────

export interface UserPreferences {
  /** Consultar base de conocimiento remota */
  enableRemoteLookup: boolean;
  /** Permitir envío de extensiones a revisión */
  enableReviewSubmission: boolean;
  /** Ha completado el onboarding */
  onboardingCompleted: boolean;
  /** Notificar cuando cambian permisos de una extensión */
  notifyOnPermissionChange: boolean;
  /** Frecuencia de re-análisis automático (minutos, 0 = desactivado) */
  autoAnalysisInterval: number;
  /** Tamaño guardado del popup */
  popupSize: { width: number; height: number };
}

// ─── Remote Knowledge Base ──────────────────────────────────────────

export interface RemoteKnowledgeEntry {
  extensionId: string;
  name: string;
  publisherName: string;
  riskLevel: RiskLevel;
  riskScore: number;
  reviewNotes: string;
  flags: string[];
  permissions: string[];
  hostPermissions: string[];
  category: string;
  lastReviewedVersion: string;
  crxHash?: string;
  reviewedAt: string;
  status: 'trusted' | 'flagged' | 'malware' | 'unknown';
  vtDetections?: number;
  vtEngines?: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  enableRemoteLookup: false,
  enableReviewSubmission: false,
  onboardingCompleted: false,
  notifyOnPermissionChange: true,
  autoAnalysisInterval: 1440, // 24 horas
  popupSize: { width: 420, height: 550 },
};
