/**
 * Motor de análisis heurístico de extensiones.
 *
 * Calcula un score de riesgo basado en:
 * 1. Permisos individuales (deducciones)
 * 2. Patrones peligrosos (combinaciones de permisos)
 * 3. Señales de contexto (tipo de instalación, etc.)
 * 4. Señales positivas de la base de conocimiento (si disponible)
 *
 * Score base = 100 (todos empiezan "bien"). Se resta por cada señal de riesgo.
 */

import type {
  AnalyzedExtension,
  DangerousPattern,
  ExtensionAnalysis,
  RemoteKnowledgeEntry, // Import actualizado a la nueva tabla
  RiskLevel,
  RiskSignal,
} from './types';
import { getPermissionInfo } from './permissions-dictionary';

const BASE_SCORE = 100;

/**
 * Interfaz local para los datos de extensión que recibimos de chrome.management.
 * Evita depender directamente del namespace chrome para mantener compatibilidad
 * entre chrome-types y el wrapper browser de WXT.
 */
export interface ExtensionInfoInput {
  id: string;
  name: string;
  version: string;
  description?: string;
  enabled: boolean;
  installType: string;
  type: string;
  permissions?: string[];
  hostPermissions?: string[];
  icons?: { size: number; url: string }[];
  homepageUrl?: string;
  updateUrl?: string;
  mayDisable?: boolean;
}

// ─── Patrones peligrosos (combinaciones) ────────────────────────

interface PatternDefinition {
  name: string;
  /** Todos estos permisos deben estar presentes para que el patrón aplique */
  requiredPermissions: string[];
  explanation: string;
  penalty: number;
}

const DANGEROUS_PATTERNS: PatternDefinition[] = [
  {
    name: 'Interceptación total de tráfico',
    requiredPermissions: ['tabs', '<all_urls>', 'webRequest'],
    explanation:
      'Esta combinación permite ver tus pestañas, acceder a todo su contenido y monitorizar todo el tráfico web. Es un perfil de riesgo muy alto.',
    penalty: 15,
  },
  {
    name: 'Robo potencial de sesiones',
    requiredPermissions: ['cookies', '<all_urls>'],
    explanation:
      'Acceder a cookies de todos los sitios puede permitir suplantar sesiones de inicio de sesión en cualquier servicio.',
    penalty: 10,
  },
  {
    name: 'Espionaje de navegación completa',
    requiredPermissions: ['tabs', 'history', '<all_urls>'],
    explanation:
      'Puede ver todo lo que visitas ahora, todo lo que has visitado antes, y leer el contenido de cualquier página.',
    penalty: 12,
  },
  {
    name: 'Control de tráfico y proxy',
    requiredPermissions: ['proxy', 'webRequest'],
    explanation:
      'Puede redirigir tu tráfico a través de servidores externos y además monitorizarlo. Todo tu tráfico web está expuesto.',
    penalty: 15,
  },
  {
    name: 'Manipulación de portapapeles + acceso total',
    requiredPermissions: ['clipboardRead', '<all_urls>'],
    explanation:
      'Puede leer tu portapapeles y el contenido de toda página. Potencial para capturar contraseñas y datos copiados.',
    penalty: 10,
  },
];

// ─── Señales de contexto ────────────────────────────────────────

function getContextSignals(
  extension: ExtensionInfoInput
): RiskSignal[] {
  const signals: RiskSignal[] = [];

  if (extension.installType === 'sideload') {
    signals.push({
      type: 'install',
      name: 'sideload',
      explanation:
        'Esta extensión fue instalada por un método lateral (sideload), no desde Chrome Web Store. Esto puede indicar origen desconocido.',
      penalty: 10,
      severity: 'danger',
    });
  }

  if (extension.installType === 'admin') {
    signals.push({
      type: 'install',
      name: 'admin-installed',
      explanation:
        'Esta extensión fue instalada por un administrador de tu organización. Puede ser legítimo en entornos corporativos.',
      penalty: 5,
      severity: 'warning',
    });
  }

  if (extension.installType === 'development') {
    signals.push({
      type: 'install',
      name: 'development',
      explanation:
        'Esta extensión está cargada en modo desarrollo. No ha pasado revisión de Chrome Web Store.',
      penalty: 5,
      severity: 'warning',
    });
  }

  if (!extension.updateUrl) {
    signals.push({
      type: 'context',
      name: 'no-update-url',
      explanation:
        'Esta extensión no tiene URL de actualización, lo que puede indicar que no proviene de Chrome Web Store.',
      penalty: 5,
      severity: 'warning',
    });
  }

  return signals;
}

// ─── Análisis de host permissions ───────────────────────────────

function analyzeHostPermissions(hostPermissions: string[]): RiskSignal[] {
  const signals: RiskSignal[] = [];

  const hasAllUrls = hostPermissions.some(
    (hp) =>
      hp === '<all_urls>' ||
      hp === '*://*/*' ||
      hp === 'http://*/*' ||
      hp === 'https://*/*'
  );

  if (hasAllUrls) {
    signals.push({
      type: 'host',
      name: '<all_urls>',
      explanation:
        'Tiene acceso a TODAS las páginas web que visitas. Puede leer y modificar cualquier contenido.',
      penalty: 20,
      severity: 'critical',
    });
  } else if (hostPermissions.length > 10) {
    signals.push({
      type: 'host',
      name: 'many-hosts',
      explanation: `Tiene acceso a ${hostPermissions.length} dominios diferentes. Un número elevado puede indicar acceso excesivo.`,
      penalty: 8,
      severity: 'warning',
    });
  } else if (hostPermissions.length > 5) {
    signals.push({
      type: 'host',
      name: 'several-hosts',
      explanation: `Tiene acceso a ${hostPermissions.length} dominios específicos.`,
      penalty: 3,
      severity: 'info',
    });
  }

  return signals;
}

// ─── Detección de patrones peligrosos ───────────────────────────

function detectDangerousPatterns(
  allPermissions: string[]
): DangerousPattern[] {
  return DANGEROUS_PATTERNS.filter((pattern) =>
    pattern.requiredPermissions.every((perm) => allPermissions.includes(perm))
  ).map((pattern) => ({
    name: pattern.name,
    permissions: pattern.requiredPermissions,
    explanation: pattern.explanation,
    penalty: pattern.penalty,
  }));
}

// ─── Señales positivas (base de conocimiento) ──────────────────

// ─── Señales positivas/negativas (Base de conocimiento) ──────────

function getRemoteSignalImpact(kb?: RemoteKnowledgeEntry): { bonus: number, penalty: number, overrides: Partial<ExtensionAnalysis> | null } {
  if (!kb) return { bonus: 0, penalty: 0, overrides: null };

  let bonus = 0;
  let penalty = 0;
  let overrides: Partial<ExtensionAnalysis> | null = null;
  
  if (kb.status === 'trusted') {
    bonus += 40; // Mega bono si VirusTotal la da por 100% limpia
    overrides = {
       riskLevel: 'low',
       score: 100
    };
  } else if (kb.status === 'malware' || kb.status === 'flagged') {
    penalty += 100; // Penalización definitiva
    overrides = {
       riskLevel: 'critical',
       score: 0
    };
  }

  return { bonus, penalty, overrides };
}

// ─── Clasificación de riesgo por score ──────────────────────────

function classifyRisk(score: number): RiskLevel {
  if (score >= 80) return 'low';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'high';
  return 'critical';
}

// ─── Función principal de análisis ──────────────────────────────

export function analyzeExtension(
  extension: ExtensionInfoInput,
  knowledgeBase?: RemoteKnowledgeEntry
): ExtensionAnalysis {
  const allPermissions = [
    ...(extension.permissions ?? []),
    ...(extension.hostPermissions ?? []),
  ];

  // 1. Señales de permisos individuales
  const permissionSignals: RiskSignal[] = (extension.permissions ?? []).map(
    (perm) => {
      const info = getPermissionInfo(perm);
      return {
        type: 'permission' as const,
        name: perm,
        explanation: info.explanation,
        penalty: info.basePenalty,
        severity: info.severity,
      };
    }
  );

  // 2. Señales de host permissions
  let hostSignals = analyzeHostPermissions(extension.hostPermissions ?? []);

  // 3. Señales de contexto
  let contextSignals = getContextSignals(extension);

  // 4. Patrones peligrosos
  let dangerousPatterns = detectDangerousPatterns(allPermissions);

  // 5. Señales Remotas (VirusTotal DB)
  const remoteImpact = getRemoteSignalImpact(knowledgeBase);
  if (remoteImpact.bonus > 0 && knowledgeBase?.status === 'trusted') {
     contextSignals.push({
        type: 'context',
        name: 'trusted_remote',
        explanation: knowledgeBase.reviewNotes,
        penalty: 0,
        severity: 'info'
     });
     // Reducir la severidad de patterns si es confiable
     dangerousPatterns.forEach(p => p.penalty = Math.max(0, p.penalty - 10));
  } else if (remoteImpact.penalty > 0) {
      contextSignals.push({
        type: 'context',
        name: 'malware_remote',
        explanation: knowledgeBase?.reviewNotes || 'Detectado como malicioso remotamente.',
        penalty: 100,
        severity: 'critical'
     });
  }

  // 6. Calcular score resultante
  const allSignals = [...permissionSignals, ...hostSignals, ...contextSignals];
  const totalPenalty =
    allSignals.reduce((sum, s) => sum + s.penalty, 0) +
    dangerousPatterns.reduce((sum, p) => sum + p.penalty, 0) + 
    remoteImpact.penalty;

  const rawScore = BASE_SCORE - totalPenalty + remoteImpact.bonus;
  let finalScore = Math.max(0, Math.min(100, rawScore));
  let finalRiskLevel = classifyRisk(finalScore);

  // 7. Sobrescrituras definitivas (ej. es malware seguro => 0)
  if (remoteImpact.overrides) {
     finalScore = remoteImpact.overrides.score ?? finalScore;
     finalRiskLevel = remoteImpact.overrides.riskLevel ?? finalRiskLevel;
  }

  return {
    score: finalScore,
    riskLevel: finalRiskLevel,
    signals: allSignals.filter((s) => s.penalty > 0 || s.severity !== 'info'),
    dangerousPatterns,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Convierte un ExtensionInfo en un AnalyzedExtension completo.
 */
export function buildAnalyzedExtension(
  extension: ExtensionInfoInput,
  permissionWarnings: string[],
  knowledgeBase?: RemoteKnowledgeEntry
): AnalyzedExtension {
  const analysis = analyzeExtension(extension, knowledgeBase);

  return {
    id: extension.id,
    name: extension.name,
    version: extension.version,
    description: extension.description ?? '',
    enabled: extension.enabled,
    installType: extension.installType,
    type: extension.type,
    permissions: extension.permissions ?? [],
    hostPermissions: extension.hostPermissions ?? [],
    permissionWarnings,
    iconUrl: extension.icons?.at(-1)?.url,
    homepageUrl: extension.homepageUrl,
    mayDisable: extension.mayDisable ?? true,
    analysis,
    knowledgeBase,
  };
}
