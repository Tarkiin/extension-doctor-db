# Extension Doctor — Checklist de Proyecto

> **Última actualización:** 2026-04-07  
> **Leyenda:** ✅ Hecho · 🚧 En progreso / parcial · ⬜ Pendiente

---

## 1. Infraestructura y Esqueleto

| Estado | Tarea | Notas |
|--------|-------|-------|
| ✅ | Proyecto WXT inicializado (React + TS) | `npx wxt@latest init` con template react |
| ✅ | Tailwind CSS configurado | `tailwind.config.js` + `postcss.config.js` |
| ✅ | `wxt.config.ts` con manifest MV3 | Permisos: `management`, `storage`, `alarms` |
| ✅ | `package.json` actualizado | Nombre, descripción, dependencias de Tailwind |
| ✅ | `tsconfig.json` configurado | Hereda de WXT |
| ✅ | Estructura de carpetas `lib/` | `types`, `analyzer`, `permissions-dictionary`, `storage`, `risk-display` |
| ✅ | `README.md` del proyecto | Stack, estructura, instrucciones de desarrollo |
| ✅ | `PRODUCT_DESIGN.md` completo | Documento de diseño de producto |
| ✅ | Iconos de la extensión (`public/icon/`) | Crear icono 16/32/48/128px |
| ✅ | `npm install` ejecutado y dependencies instaladas | Pendiente de ejecución |
| ✅ | Primera compilación exitosa (`npm run dev`) | Verificar que todo compila |
| ✅ | `.gitignore` adecuado para el proyecto | Revisar el generado por WXT |

---

## 2. Motor de Análisis Heurístico (`lib/`)

| Estado | Tarea | Notas |
|--------|-------|-------|
| ✅ | Tipos centrales definidos (`types.ts`) | `AnalyzedExtension`, `ExtensionAnalysis`, `RiskSignal`, `DangerousPattern`, `KnowledgeBaseEntry`, `ReviewSubmission`, `DashboardSummary`, `UserPreferences` |
| ✅ | Diccionario de permisos (`permissions-dictionary.ts`) | ~22 permisos documentados con explicación humana, penalización y severidad |
| ✅ | Función `analyzeExtension()` | Calcula score base 100, resta por permisos, patrones y contexto |
| ✅ | Detección de patrones peligrosos | 5 patrones de combinaciones de permisos |
| ✅ | Señales de contexto (installType, updateUrl) | Sideload, admin, development, sin update URL |
| ✅ | Señales positivas de base de conocimiento | Bonus por `trusted`, `reviewed`, `maintainer` |
| ✅ | Clasificación de riesgo por score | `low ≥80`, `medium ≥50`, `high ≥25`, `critical <25` |
| ✅ | `buildAnalyzedExtension()` | Convierte `ExtensionInfo` + warnings → `AnalyzedExtension` |
| ✅ | Helpers de storage (`storage.ts`) | CRUD para extensiones analizadas, summary, preferencias |
| ✅ | Helpers de display (`risk-display.ts`) | Colores, emojis, clases CSS por nivel de riesgo |
| ⬜ | Ampliar diccionario de permisos | Faltan permisos menos comunes (ej: `topSites`, `declarativeNetRequest`, `scripting`, `offscreen`, etc.) |
| ⬜ | Más patrones peligrosos | Añadir combinaciones adicionales documentadas |
| ⬜ | Tests unitarios del analyzer | Fundamental para validar scoring |
| ⬜ | Tests del diccionario de permisos | Verificar que todos los permisos comunes están cubiertos |

---

## 3. Background Service Worker

| Estado | Tarea | Notas |
|--------|-------|-------|
| ✅ | Estructura básica del background | `defineBackground()` con listeners |
| ✅ | `chrome.management.getAll()` para leer extensiones | Filtra self y temas |
| ✅ | `getPermissionWarningsById()` para cada extensión | Con try/catch para extensiones que no lo soportan |
| ✅ | Cálculo de `DashboardSummary` | Score global = media de scores, conteo por riesgo |
| ✅ | Actualización del badge del icono | Muestra número de extensiones critical+high en rojo |
| ✅ | Listener `onInstalled` | Primer análisis al instalar, re-análisis al actualizar |
| ✅ | Listeners `onInstalled/onUninstalled/onEnabled/onDisabled` de management | Re-análisis automático al cambiar extensiones |
| ✅ | Listener de alarmas para re-análisis periódico | Configurable vía preferencias |
| ✅ | Handler de mensaje `RUN_ANALYSIS` | Para que popup/options puedan pedir re-análisis |
| ⬜ | Consulta a base de conocimiento remota | Solo cuando `enableRemoteLookup = true` |
| ⬜ | Detección de cambios de permisos entre versiones | Comparar con snapshot anterior en storage |
| ⬜ | Notificación al usuario de cambios de permisos | Usar `chrome.notifications` |

---

## 4. Popup (Dashboard)

| Estado | Tarea | Notas |
|--------|-------|-------|
| ✅ | Estructura HTML + React + Tailwind | Dark theme, Inter font |
| ✅ | Score global prominente con color dinámico | Color cambia según score |
| ✅ | Quick stats por categoría de riesgo | 4 tarjetas: critical, high, medium, low |
| ✅ | Lista de extensiones agrupada por riesgo | Ordenada de más peligrosa a menos |
| ✅ | `ExtensionRow` con icono, nombre, versión, score | Iconos de las extensiones reales |
| ✅ | Botón re-analizar | Envía mensaje al background |
| ✅ | Botón abrir opciones | `browser.runtime.openOptionsPage()` |
| ✅ | Loading state | Spinner |
| ✅ | Empty state (primer uso) | Botón para ejecutar primer análisis |
| ✅ | Disclaimer en footer | "Análisis heurístico orientativo" |
| ✅ | Vista de detalle de extensión (expandir fila) | Mostrar permisos, warnings, señales, acciones |
| ✅ | Acciones: desactivar / desinstalar extensión | `browser.management.setEnabled()`, `browser.management.uninstall()` |
| ✅ | Escudo VirusTotal | Mostrar "Verificado por VT (0/X Antivirus)" si `vtDetections: 0` |
| ✅ | Badge de Riesgo Dinámico | Colores (Verde, Amarillo, Naranja, Rojo) y alerta roja si malware |
| ✅ | Indicador de extensiones "sin revisar" | Se omite inteligentemente el escudo de VT si no está en base remota |
| ❌ | Botón "Enviar para revisión" | Descartado por requerir backend externo o login de GitHub |
| 🚧 | Animaciones y transiciones | Expandir/colapsar grupos, hover effects |
| ✅ | Responsive scroll y overflow | Verificar con muchas extensiones |

---

## 5. Options Page

| Estado | Tarea | Notas |
|--------|-------|-------|
| ✅ | Estructura HTML + React + Tailwind | Misma paleta que el popup |
| ✅ | Toggle: consultar base remota | Opt-in, desactivado por defecto |
| ✅ | Toggle: notificar cambios de permisos | Activado por defecto |
| ✅ | Sección "Sobre Extension Doctor" | Con disclaimer y link a GitHub |
| ✅ | Toast de confirmación "Guardado" | Feedback visual animado |
| ✅ | Configuración de frecuencia de re-análisis | Selector visual con 6 opciones (Desactivado → Semanal) |
| ✅ | Export de datos JSON | Descarga archivo con análisis completo |
| ✅ | Export de datos CSV | Formato tabular para hojas de cálculo |
| ✅ | Tarjetas de estadísticas rápidas | Extensiones, Score Global, Último análisis |
| ✅ | Zona peligrosa: borrar datos | Botón con confirmación para limpiar storage |
| ⬜ | Vista expandida de extensiones con detalle completo | Permisos, explicaciones, señales, historial |
| ⬜ | Historial de análisis pasados | Timeline con scores anteriores |
| ⬜ | Link a privacy policy | Cuando se publique |
| ⬜ | Sección de onboarding re-mostrable | "Volver a ver la introducción" |

---

## 6. Onboarding (Primera Instalación)

| Estado | Tarea | Notas |
|--------|-------|-------|
| ✅ | Flujo de 3 pasos | Paso 1: qué es, Paso 2: qué datos usa, Paso 3: primer análisis |
| ✅ | Paso 1: explicación del producto + disclaimer | "Auditor de permisos, no antivirus" |
| ✅ | Paso 2: configuración de privacidad | Toggles de opt-in |
| ✅ | Paso 3: ejecutar primer análisis | Con resultado inmediato |
| ✅ | Guardar `onboardingCompleted` en preferencias | Para no repetir |
| ✅ | Redirigir a onboarding si no completado | Al abrir popup por primera vez |

---

## 7. Base de Conocimiento Remota

| Estado | Tarea | Notas |
|--------|-------|-------|
| ✅ | Definir formato del JSON de extensiones revisadas | Schema basado en `KnowledgeBaseEntry` de types.ts |
| ✅ | Crear repo de GitHub para la base de datos | JSON estáticos en GitHub Pages |
| ✅ | Corpus inicial: 50 extensiones populares curadas | Top 50 de Chrome Web Store |
| ✅ | Función `fetchKnowledgeBase()` en el background | Fetch + cache local |
| ✅ | Cacheo local de datos remotos | Para no hacer fetch en cada análisis |
| ✅ | Manejo de errores de red (offline, timeout) | Graceful degradation implementada con base de datos local (cache) |
| 🚧 | Política de actualización / cache invalidation | Intervalos implementados en prefs, falta ETags para optimizar red |

---

## ❌ 8. Sistema de Revisión (DESCARTADO)

*Al evaluar la arquitectura, se decidió prescindir de esta funcionalidad ya que requeriría forzosamente la creación de un backend proxy gratuito (ej. Supabase) o forzar al usuario a tener cuenta de Github. Se apuesta por la simplicidad y el menor mantenimiento.*

| Estado | Tarea | Notas |
| :---: | :--- | :--- |
| ❌ | Modelo de datos | Definido pero no implementado |
| ❌ | Modal de confirmación de envío | Preview de datos exactos que se enviarán |
| ❌ | Endpoint de ingesta | Hubiera requerido Supabase Edge Function |
| ❌ | Función `submitForReview()` | POST al background con payload |
| ❌ | Dashboard de cola de revisión (admin) | Para gestionar extensiones pendientes |

---

## 9. Privacidad y Confianza

| Estado | Tarea | Notas |
|--------|-------|-------|
| ✅ | Todo opt-in por defecto (base remota, envío revisión) | Desactivados en `DEFAULT_PREFERENCES` |
| ✅ | Disclaimer visible en popup y options | Texto claro |
| ✅ | Privacy policy completa (Markdown → GitHub Pages) | Para Chrome Web Store |
| ✅ | Explicación in-app de qué datos se envían y cuáles no | Sección dedicada en options |
| ✅ | Código abierto publicado en GitHub | Transparencia total |

---

## 10. Publicación en Chrome Web Store

| Estado | Tarea | Notas |
|--------|-------|-------|
| ⬜ | Icono y assets gráficos | 128x128 icono, screenshots, banner promo |
| ⬜ | Descripción para la store | Basada en el PRODUCT_DESIGN.md |
| ⬜ | Single purpose statement | "Auditar y explicar permisos de extensiones instaladas" |
| ⬜ | Privacy policy publicada con URL | En GitHub Pages |
| ⬜ | Justificación del permiso `management` | Texto preparado para el review |
| ⬜ | Vídeo demostrativo (opcional pero recomendado) | Para acelerar la review |
| ⬜ | Build de producción y empaquetado ZIP | `npm run zip` |
| ⬜ | Submit a Chrome Web Store | Developer account necesaria |

---

## 11. Nice-to-have (Post-MVP)

| Estado | Tarea | Notas |
|--------|-------|-------|
| ⬜ | Historial de cambios de permisos entre versiones | Requiere snapshots versionados |
| ⬜ | Notificaciones push de cambios detectados | `chrome.notifications` |
| ⬜ | Dark/light mode toggle | Actualmente solo dark |
| ⬜ | Multilengua (español + inglés) | i18n con archivos `_locales/` |
| ⬜ | Base de conocimiento en Supabase | Migrar de JSON estáticos a DB real |
| ⬜ | Semiautomatización de revisiones | GitHub Actions + heurísticos automáticos |
| ⬜ | API pública de la base de conocimiento | Para que otros proyectos la usen |
| ⬜ | Gamificación ligera ("mejora tu score") | UX engagement |
| ⬜ | Export de informe PDF/HTML | Para usuarios avanzados |
| ⬜ | Comparación antes/después (re-scan delta) | "Desde tu último análisis..." |

---

| Sección | ✅ Hecho | ⬜ Pendiente | % |
|---------|----------|-------------|---|
| Infraestructura | 12 | 0 | 100% |
| Motor de análisis | 10 | 4 | 71% |
| Background | 9 | 3 | 75% |
| Popup | 16 | 1 | 94% |
| Options | 11 | 3 | 78% |
| Onboarding | 6 | 0 | 100% |
| Base remota | 6 | 1 | 85% |
| Sistema revisión | 0 | 0 | Can. |
| Privacidad | 5 | 0 | 100% |
| Publicación | 0 | 8 | 0% |
| **TOTAL** | **75** | **20** | **79%** |

> El proyecto avanza increíblemente rápido (~79%). El MVP funcional ya está construido. Resta rematar la conectividad Background-Github, preparar los materiales gráficos a partir del icono principal y confeccionar los avisos para pasar los exigentes filtros de publicación de la Chrome Web Store.
