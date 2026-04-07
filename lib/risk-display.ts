/**
 * Helpers para obtener el color y emoji/etiqueta de cada nivel de riesgo.
 * Se usan tanto en el popup como en la options page.
 */

import type { RiskLevel } from './types';

export interface RiskDisplay {
  label: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  textColorClass: string;
}

const RISK_DISPLAY: Record<RiskLevel, RiskDisplay> = {
  low: {
    label: 'Bajo riesgo',
    emoji: '🟢',
    colorClass: 'text-risk-low',
    bgClass: 'bg-risk-low/10',
    borderClass: 'border-risk-low/30',
    textColorClass: 'text-green-400',
  },
  medium: {
    label: 'Riesgo medio',
    emoji: '🟡',
    colorClass: 'text-risk-medium',
    bgClass: 'bg-risk-medium/10',
    borderClass: 'border-risk-medium/30',
    textColorClass: 'text-yellow-400',
  },
  high: {
    label: 'Riesgo alto',
    emoji: '🟠',
    colorClass: 'text-risk-high',
    bgClass: 'bg-risk-high/10',
    borderClass: 'border-risk-high/30',
    textColorClass: 'text-orange-400',
  },
  critical: {
    label: 'Riesgo crítico',
    emoji: '🔴',
    colorClass: 'text-risk-critical',
    bgClass: 'bg-risk-critical/10',
    borderClass: 'border-risk-critical/30',
    textColorClass: 'text-red-400',
  },
};

export function getRiskDisplay(level: RiskLevel): RiskDisplay {
  return RISK_DISPLAY[level];
}

/**
 * Devuelve un color de score para gradientes (0=rojo, 100=verde).
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  if (score >= 25) return '#f97316';
  return '#ef4444';
}
