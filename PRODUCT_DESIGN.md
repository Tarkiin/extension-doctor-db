# Extension Doctor — Documento de Diseño de Producto

> **Versión:** 0.1 — Borrador fundacional  
> **Fecha:** 2026-04-07  
> **Autor:** Diseño colaborativo  
> **Estado:** Propuesta inicial — pendiente de validación

---

## A. Resumen Ejecutivo

**Extension Doctor** es una extensión de Chrome (MV3) que actúa como **auditor de riesgo heurístico** de las extensiones instaladas en el navegador del usuario.

**No es un antivirus. No es un escáner de malware. No promete seguridad garantizada.**

Lo que hace es:

1. Leer los metadatos de todas las extensiones instaladas vía `chrome.management`
2. Analizar sus permisos, host permissions y warnings
3. Calcular un **score de riesgo heurístico** basado en señales objetivas
4. **Explicar en lenguaje humano** qué significa cada permiso y por qué ciertos patrones son sospechosos
5. Consultar una **base de conocimiento remota** (datos, no código) para enriquecer el análisis con reputación comunitaria
6. Permitir al usuario **enviar extensiones desconocidas** a una cola de revisión voluntaria

**Propuesta de valor central:** "Entiende qué pueden hacer realmente tus extensiones, sin necesitar ser técnico."

### Posicionamiento

| Aspecto           | Definición                                                                |
| ----------------- | ------------------------------------------------------------------------- |
| **Qué es**        | Auditor heurístico de permisos de extensiones Chrome                      |
| **Qué no es**     | Scanner de malware, antivirus, herramienta de seguridad garantizada       |
| **Para quién**    | Cualquier usuario que instalan extensiones y quieren entender sus riesgos |
| **Diferenciador** | Explicación humana + base de reputación comunitaria + transparencia total |

---

## B. Qué Problema Resuelve y Por Qué Tiene Valor

### Dolores reales del usuario

1. **Opacidad total de permisos:** Chrome muestra permisos en la instalación con un lenguaje críptico ("Leer y modificar todos los datos en todos los sitios web"). El usuario acepta sin entender.

2. **Acumulación de extensiones:** Un usuario típico tiene 8-15 extensiones. Muchas se instalaron hace años y nunca se revisaron. Algunas podrían haber cambiado de propietario (venta de extensiones), añadido permisos en actualizaciones silenciosas, o directamente haber dejado de recibir mantenimiento.

3. **Cambios de permisos silenciosos:** Chrome notifica de nuevos permisos, pero el usuario no entiende qué implicaciones tiene el cambio. No hay contexto, no hay comparación, no hay historial accesible.

4. **No existe un "panel de control de riesgo" para extensiones:** La página `chrome://extensions` muestra datos técnicos sin contexto de riesgo. No hay scoring, no hay alertas, no hay explicaciones.

5. **Extensiones maliciosas pasan la revisión de Chrome Web Store:** Casos documentados año tras año de extensiones con millones de usuarios que resultaron ser maliciosas o invasivas. La revisión de Google no es infalible.

### Por qué las soluciones actuales no bastan

| Solución existente                   | Limitación                                                              |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Chrome Web Store reviews             | Los usuarios no las leen antes de instalar, y muchas son falsas         |
| `chrome://extensions`                | Solo datos técnicos, sin contexto de riesgo                             |
| CRXcavator (discontinuado)           | Era web-only, no integrado en el navegador, ya no disponible            |
| Extensiones de "seguridad" genéricas | Prometen demasiado, no explican nada, suelen ser ellas mismas invasivas |

### Valor real

- **Visibilidad inmediata:** El usuario abre la extensión y ve un dashboard de riesgo de todas sus extensiones
- **Educación:** Cada permiso se explica en lenguaje humano con ejemplos concretos
- **Control:** El usuario puede tomar decisiones informadas sobre qué mantener, desactivar o eliminar
- **Comunidad:** La base de conocimiento crece con contribuciones voluntarias

---

## C. Qué Puede Hacer Realmente y Qué No

### ✅ Puede hacer

| Capacidad                                                        | Fuente                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Leer nombre, ID, versión, descripción de cada extensión          | `chrome.management.getAll()`                                 |
| Leer permisos declarados y host permissions                      | `chrome.management` (campo `permissions`, `hostPermissions`) |
| Leer permission warnings (textos que Chrome muestra al instalar) | `chrome.management.getPermissionWarningsById()`              |
| Detectar tipo de instalación (normal, admin, sideload, etc.)     | `installType`                                                |
| Detectar si está habilitada/deshabilitada                        | `enabled`                                                    |
| Detectar si tiene acceso a todos los sitios                      | Análisis de host permissions `<all_urls>`                    |
| Calcular un score heurístico local                               | Lógica embebida en la extensión                              |
| Consultar datos remotos (JSON estático, API de datos)            | Permitido en MV3                                             |
| Explicar permisos en lenguaje humano                             | Diccionario local embebido                                   |
| Comparar con una base de extensiones previamente revisadas       | Consulta remota de datos                                     |
| Trackear cambios de permisos entre versiones                     | Storage local + datos remotos                                |

### ❌ No puede hacer

| Limitación                                         | Razón                                           |
| -------------------------------------------------- | ----------------------------------------------- |
| Inspeccionar el código fuente de otras extensiones | No hay API de Chrome que lo permita             |
| Detectar malware real con certeza                  | Requeriría análisis de código, sandboxing, etc. |
| Garantizar que una extensión es "segura"           | Imposible sin análisis profundo                 |
| Bloquear extensiones maliciosas automáticamente    | No hay API para ello; solo puede recomendar     |
| Analizar el tráfico de red de otras extensiones    | Fuera del alcance de `chrome.management`        |
| Ejecutar código remoto                             | Prohibido por MV3                               |

### Cómo comunicar los límites sin perder valor

**Lenguaje a usar:**

- "Auditoría de permisos y riesgo heurístico"
- "Análisis de señales de riesgo"
- "Evaluación basada en permisos declarados"
- "Puntuación orientativa, no garantía de seguridad"

**Lenguaje a evitar:**

- "Detección de malware"
- "Seguridad garantizada"
- "Protección total"
- "Escáner antivirus"

**Estrategia:** Incluir un disclaimer visible en el onboarding y en la UI: _"Extension Doctor analiza los permisos declarados de tus extensiones y calcula un nivel de riesgo orientativo. No sustituye a un antivirus ni garantiza la ausencia de software malicioso."_

---

## D. Arquitectura Conceptual Recomendada

### Diagrama de componentes

```
┌─────────────────────────────────────────────────────────┐
│                   USUARIO / CHROME                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           EXTENSION DOCTOR (MV3)                  │   │
│  │                                                    │   │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────────┐   │   │
│  │  │ Popup   │  │Background│  │  Options Page   │   │   │
│  │  │ (React) │  │ (SW/TS)  │  │  (React)        │   │   │
│  │  └────┬────┘  └─────┬────┘  └───────┬────────┘   │   │
│  │       │              │               │             │   │
│  │       └──────────────┼───────────────┘             │   │
│  │                      │                             │   │
│  │              ┌───────┴───────┐                     │   │
│  │              │  Motor de     │                     │   │
│  │              │  Análisis     │                     │   │
│  │              │  Heurístico   │                     │   │
│  │              └───────┬───────┘                     │   │
│  │                      │                             │   │
│  │         ┌────────────┼────────────┐                │   │
│  │         ▼            ▼            ▼                │   │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────────┐     │   │
│  │  │ chrome.  │ │ Local     │ │ Diccionario  │     │   │
│  │  │management│ │ Storage   │ │ de permisos  │     │   │
│  │  └──────────┘ └───────────┘ └──────────────┘     │   │
│  └──────────────────────┬───────────────────────────┘   │
│                          │                                │
└──────────────────────────┼────────────────────────────────┘
                           │ HTTPS (solo datos)
                           ▼
            ┌──────────────────────────────┐
            │   BASE DE CONOCIMIENTO       │
            │   (GitHub Pages / CDN /      │
            │    Supabase)                 │
            │                              │
            │  ┌────────────────────────┐  │
            │  │ extensions.json        │  │
            │  │ - extensiones revisadas│  │
            │  │ - scores de reputación │  │
            │  │ - historial versiones  │  │
            │  └────────────────────────┘  │
            │                              │
            │  ┌────────────────────────┐  │
            │  │ Cola de revisión       │  │
            │  │ - extensiones enviadas │  │
            │  │ - estado: pending/     │  │
            │  │   reviewed/rejected    │  │
            │  └────────────────────────┘  │
            └──────────────────────────────┘
```

### Componente 1: Extensión Chrome (local)

| Parte                           | Responsabilidad                                                                                           | Stack                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Background (Service Worker)** | Orquestar análisis, listeners de `chrome.management`, alarmas periódicas, comunicación con la base remota | TypeScript puro                      |
| **Popup**                       | Dashboard rápido: overview de riesgo, lista de extensiones, indicadores visuales                          | React + Tailwind                     |
| **Options Page**                | Configuración, historial de análisis, detalle de extensiones, gestión de privacidad                       | React + Tailwind                     |
| **Motor de análisis**           | Lógica heurística pura: cálculo de scores, detección de patrones, clasificación                           | TypeScript puro, módulo reutilizable |
| **Diccionario de permisos**     | Mapa estático de permiso → explicación humana + nivel de riesgo base                                      | JSON/TS embebido                     |

### Componente 2: Base de conocimiento remota

**Opción recomendada para MVP:** GitHub repo público con JSON estáticos servidos vía GitHub Pages o raw content.

**Opción para escalar (v2+):** Supabase (ya tienes el MCP server disponible) con tablas para extensiones, reviews, cola de revisión.

| Dato                  | Tipo      | Ejemplo                                   |
| --------------------- | --------- | ----------------------------------------- |
| `extensionId`         | string    | `"nkbihfbeogaeaoehlefnkodbefgpgknn"`      |
| `name`                | string    | `"MetaMask"`                              |
| `category`            | enum      | `"wallet" / "productivity" / "dev-tools"` |
| `riskLevel`           | enum      | `"low" / "medium" / "high" / "critical"`  |
| `reviewStatus`        | enum      | `"reviewed" / "pending" / "flagged"`      |
| `notes`               | string    | Notas de revisión                         |
| `lastReviewedVersion` | string    | `"11.16.0"`                               |
| `permissionHistory`   | array     | Historial de cambios de permisos          |
| `reviewedAt`          | timestamp | Fecha de última revisión                  |

### Componente 3: Sistema de ingesta (cola de revisión)

**Flujo conceptual:**

```
Usuario detecta extensión desconocida
        │
        ▼
Botón "Enviar para revisión" (opt-in explícito)
        │
        ▼
Se envía: { extensionId, name, version, permissions, hostPermissions, installType }
        │
        ▼
  ┌─────────────────────┐
  │ Endpoint de ingesta │  ← Supabase Edge Function / GitHub Actions webhook
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │ Cola de revisión    │  ← tabla pending_reviews
  │ estado: PENDING     │
  └──────────┬──────────┘
             │
     (revisión manual o semiautomática)
             │
             ▼
  ┌─────────────────────┐
  │ Base de conocimiento│  ← extensión revisada y publicada
  │ estado: REVIEWED    │
  └─────────────────────┘
```

### Qué vive localmente vs remotamente

| Local (extensión)                       | Remoto (base de conocimiento)                    |
| --------------------------------------- | ------------------------------------------------ |
| Motor de análisis heurístico completo   | Extensiones ya revisadas con reputación          |
| Diccionario de permisos                 | Cola de revisión                                 |
| Historial local de análisis del usuario | Historial de cambios de permisos entre versiones |
| Preferencias del usuario                | Estadísticas agregadas (anónimas)                |
| Score calculado localmente              | Score de reputación comunitaria                  |

**Principio clave:** El análisis local tiene valor por sí solo. La base remota **enriquece** pero no es imprescindible.

---

## E. Flujo de Producto Ideal

### 1. Primera instalación

```
Instalar extensión → Onboarding (3 pasos máximo)
  │
  ├─ Paso 1: "¿Qué es Extension Doctor?"
  │   - Explicación clara: auditor de permisos, no antivirus
  │   - Disclaimer visible
  │
  ├─ Paso 2: "¿Qué datos usamos?"
  │   - Solo metadatos de extensiones
  │   - Nunca historial, URLs, texto
  │   - Toggle opt-in para consultar base remota
  │   - Toggle opt-in para enviar extensiones a revisión
  │
  └─ Paso 3: "Tu primer análisis"
      - Ejecutar análisis automáticamente
      - Mostrar resultado inmediato
```

### 2. Primer análisis (y análisis posteriores)

```
Background service worker:
  1. chrome.management.getAll()
  2. Para cada extensión:
     a. Extraer permisos, hostPermissions, warnings
     b. Calcular score heurístico local
     c. (si opt-in) Consultar base remota por extensionId
     d. Combinar score local + reputación remota
  3. Guardar resultado en chrome.storage.local
  4. Actualizar badge del icono con resumen
```

### 3. Popup — Vista general (Dashboard)

```
┌─────────────────────────────────┐
│  🩺 Extension Doctor            │
│                                  │
│  ╔══════════════════════════╗   │
│  ║  12 extensiones activas  ║   │
│  ║  Score global: 72/100    ║   │
│  ╚══════════════════════════╝   │
│                                  │
│  🔴 Alto riesgo (2)             │
│  ├─ Extensión X — Score: 25    │
│  └─ Extensión Y — Score: 31    │
│                                  │
│  🟡 Riesgo medio (3)            │
│  ├─ Extensión Z — Score: 55    │
│  ├─ ...                         │
│  └─ ...                         │
│                                  │
│  🟢 Bajo riesgo (7)             │
│  └─ (colapsado por defecto)     │
│                                  │
│  ⚪ Sin revisar (2)             │
│  └─ (extensiones no en la base) │
│                                  │
│  [⚙️ Opciones]  [🔄 Re-analizar]│
└─────────────────────────────────┘
```

### 4. Vista de detalle de una extensión

```
┌─────────────────────────────────┐
│  ← Volver                       │
│                                  │
│  🔴 Extensión X                 │
│  v2.3.1 · Score: 25/100         │
│  Instalación: normal             │
│                                  │
│  ── PERMISOS ──                  │
│  ⚠️ tabs — Puede ver todas tus  │
│     pestañas abiertas y su URL   │
│  ⚠️ <all_urls> — Puede leer y   │
│     modificar TODAS las páginas  │
│  ⚠️ webRequest — Puede          │
│     interceptar todo tu tráfico  │
│  ℹ️ storage — Guarda datos       │
│     localmente (normal)          │
│                                  │
│  ── SEÑALES DE RIESGO ──        │
│  🔴 Acceso total a todas las    │
│     páginas web                   │
│  🔴 Combinación peligrosa:      │
│     tabs + webRequest + <all_urls>│
│  🟡 Extensión no revisada en    │
│     la base comunitaria           │
│                                  │
│  ── REPUTACIÓN ──                │
│  ⚪ No encontrada en la base     │
│  [📤 Enviar para revisión]       │
│                                  │
│  [🗑️ Desinstalar]  [⏸️ Desactivar]│
└─────────────────────────────────┘
```

### 5. Envío a revisión (extensión desconocida)

```
Usuario pulsa "Enviar para revisión"
        │
        ▼
Modal de confirmación:
"Se enviarán estos datos (y solo estos):
 - ID: abc123
 - Nombre: Extensión X
 - Versión: 2.3.1
 - Permisos: [tabs, <all_urls>, webRequest, storage]
 - Tipo de instalación: normal

 No se envía: historial, URLs, datos personales.

 [Cancelar]  [Enviar]"
        │
        ▼
Envío → confirmación visual → "Recibido ✓"
```

---

## F. Base de Conocimiento y Sistema de Revisión

### Datos a guardar por extensión revisada

```typescript
interface ReviewedExtension {
  // Identificación
  extensionId: string; // ID único de Chrome Web Store
  name: string;
  publisherName?: string;

  // Análisis
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number; // 0-100
  reviewNotes: string; // Explicación del revisor
  flags: string[]; // Señales específicas detectadas

  // Permisos
  permissions: string[];
  hostPermissions: string[];
  permissionHistory: {
    version: string;
    permissions: string[];
    hostPermissions: string[];
    changedAt: string;
  }[];

  // Meta
  category: string;
  lastReviewedVersion: string;
  reviewedAt: string;
  reviewedBy: string; // "auto" | "community" | "maintainer"
  status: "reviewed" | "flagged" | "trusted" | "deprecated";
}
```

### Estrategia de crecimiento de la base

**Fase 1 — Corpus inicial curado (MVP)**

- 50-100 extensiones populares revisadas manualmente
- Las top 50 de Chrome Web Store por usuarios
- Extensiones conocidas como problemáticas (histórico de noticias)
- Extensiones del propio desarrollador como baseline

**Fase 2 — Crecimiento orgánico**

- Los usuarios envían extensiones desconocidas → cola de revisión
- Priorización de la cola por:
  1. Número de envíos (muchos usuarios piden la misma = más prioritaria)
  2. Score heurístico local alto (más sospechosa = mayor prioridad)
  3. Permisos peligrosos combinados
  4. Recencia del envío

**Fase 3 — Semiautomatización**

- GitHub Actions que ejecutan análisis heurísticos automáticos sobre la cola
- Revisión humana solo para casos ambiguos o flagged
- Publicación automática de extensiones "low risk" autoverificadas

### No intentar analizar todo Chrome Web Store

**Esto es clave.** La base crece desde la demanda real de los usuarios, no desde un scraping masivo. Esto es viable, defendible y sostenible.

---

## G. Privacidad, Confianza y Publicación

### Datos que SÍ se envían (cuando el usuario lo permite)

| Dato                        | Justificación                       |
| --------------------------- | ----------------------------------- |
| Extension ID                | Identificar la extensión            |
| Nombre                      | Contexto humano                     |
| Versión                     | Detectar cambios entre versiones    |
| Permisos y host permissions | Core del análisis                   |
| Tipo de instalación         | Detectar sideloading / admin-forced |

### Datos que NUNCA se envían

| Dato                                          | Razón                  |
| --------------------------------------------- | ---------------------- |
| Historial de navegación                       | No necesario, invasivo |
| URLs visitadas                                | No necesario, invasivo |
| Texto escrito por el usuario                  | No necesario, invasivo |
| Datos de otras extensiones sin consentimiento | Opt-in por extensión   |
| Cookies, passwords, tokens                    | Nunca                  |
| IP del usuario (si posible, anonimizar)       | Minimización           |

### Consentimiento y UX

1. **Onboarding claro:** 3 pasos, lenguaje humano, sin dark patterns
2. **Todo opt-in:** La base remota se consulta solo si el usuario lo activa
3. **Envío a revisión explícito:** Cada envío requiere confirmación con preview de datos
4. **Página de privacidad in-app:** Accesible desde Options, explica todo en lenguaje claro
5. **No telemetría oculta:** Si se añade analytics, debe ser opt-in y transparente

### Publicación en Chrome Web Store

#### Permisos necesarios y justificación

| Permiso                           | Justificación para la review                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `management`                      | Core del producto: leer metadatos de extensiones instaladas para mostrar análisis de permisos al usuario |
| `storage`                         | Guardar preferencias, historial de análisis y resultados locales                                         |
| `alarms`                          | Programar re-análisis periódicos en background                                                           |
| `host_permission` para API propia | Consultar base de conocimiento remota (solo datos JSON)                                                  |

#### Riesgos en la revisión

1. **`management` es un permiso sensible.** Google lo revisa con más escrutinio.
   - **Mitigación:** Justificación de "single purpose" muy clara. La extensión SOLO audita extensiones. No hace nada más.
2. **Google podría considerar que "auditar extensiones" compite con su propia funcionalidad.**
   - **Mitigación:** El producto no bloquea ni modifica extensiones. Solo informa y recomienda. Es educativo.

3. **Envío de datos remotos podría generar preguntas.**
   - **Mitigación:** Solo metadatos públicos de extensiones, opt-in explícito, privacy policy detallada.

#### Cómo estructurar la submission

- **Single purpose statement:** "Auditar y explicar los permisos de las extensiones de Chrome instaladas, mostrando un análisis de riesgo heurístico al usuario."
- **Privacy policy:** Publicar en GitHub Pages, enlazar desde la Web Store.
- **Vídeo demostrativo:** Recomendable para acelerar la review.

---

## H. MVP Realista

### Lo que incluye el MVP

| Feature                                      | Prioridad | Complejidad       |
| -------------------------------------------- | --------- | ----------------- |
| Lectura de todas las extensiones instaladas  | MUST      | Baja              |
| Motor de scoring heurístico local            | MUST      | Media             |
| Diccionario de permisos → explicación humana | MUST      | Media (contenido) |
| Popup con dashboard de riesgo                | MUST      | Media             |
| Vista de detalle por extensión               | MUST      | Media             |
| Página de opciones con ajustes básicos       | MUST      | Baja              |
| Onboarding de 3 pasos                        | MUST      | Baja              |
| Almacenamiento local de resultados           | MUST      | Baja              |
| Badge del icono con indicador de riesgo      | SHOULD    | Baja              |
| Consulta a base remota (JSON estático)       | SHOULD    | Baja              |
| Envío a revisión básico                      | COULD     | Media             |

### Lo que NO incluye el MVP

- Dashboard web externo
- Sistema de revisión semiautomático
- Notifications push
- Análisis de cambios entre versiones (requiere historial)
- Integración con GitHub para la cola
- Multilengua (lanzar en español primero, luego inglés)
- Modo dark/light toggle (elegir uno para MVP)

### Roadmap

| Versión        | Contenido                                                               | Timeframe estimado |
| -------------- | ----------------------------------------------------------------------- | ------------------ |
| **MVP (v0.1)** | Análisis local + popup + explicaciones + base estática                  | 2-3 semanas        |
| **v0.2**       | Envío a revisión + consulta remota + onboarding                         | +1-2 semanas       |
| **v1.0**       | Publicación Chrome Web Store + privacy policy + base curada de ~100 ext | +1 semana          |
| **v1.5**       | Historial de cambios de permisos + notificaciones de cambios            | +2 semanas         |
| **v2.0**       | Base en Supabase + cola de revisión real + dashboard de estado          | +3-4 semanas       |
| **v3.0**       | Semiautomatización de revisiones + API pública + multilengua            | Futuro             |

---

## I. Riesgos y Puntos Débiles

### Técnicos

| Riesgo                                                 | Severidad | Mitigación                                                       |
| ------------------------------------------------------ | --------- | ---------------------------------------------------------------- |
| `chrome.management` no devuelve suficiente información | Media     | Diseñar el scoring para trabajar con lo que hay; no prometer más |
| Google rechaza la extensión en review                  | Alta      | Preparar justificación detallada, privacy policy, vídeo demo     |
| La base remota se vuelve obsoleta rápidamente          | Media     | Diseñar la base para crecimiento orgánico, no estático           |
| Rate limiting de GitHub Pages / CDN                    | Baja      | Cachear datos localmente, consultar solo cuando hay cambios      |

### De producto

| Riesgo                                                                                       | Severidad | Mitigación                                                                         |
| -------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------- |
| El scoring puede generar falsos positivos (extensiones legítimas flaggeadas como peligrosas) | Alta      | Diferenciar "riesgo por permisos" de "extensión maliciosa"; lenguaje muy cuidadoso |
| Los usuarios esperan detección de malware real                                               | Alta      | Disclaimer explícito en onboarding, UI y store listing                             |
| Extensión con pocos users = base de conocimiento pequeña = menos valor percibido             | Media     | Asegurar que el análisis local sea útil por sí solo                                |

### De confianza

| Riesgo                                                              | Severidad | Mitigación                                                           |
| ------------------------------------------------------------------- | --------- | -------------------------------------------------------------------- |
| "Una extensión que audita extensiones suena sospechosa en sí misma" | Alta      | Open source, permisos mínimos, transparencia total, README detallado |
| Ironía: Extension Doctor podría ser percibida como invasiva         | Alta      | Demostrar con código abierto que solo lee metadatos vía API oficial  |

### De escalado

| Riesgo                                       | Severidad | Mitigación                                           |
| -------------------------------------------- | --------- | ---------------------------------------------------- |
| Mantener la base de conocimiento actualizada | Media     | Priorizar extensiones populares, crecer bajo demanda |
| Gestionar una cola de revisión que crece     | Media     | Semiautomatización desde v2                          |

---

## J. Recomendación Final

### Para lanzar esto de forma realista

1. **Construir el MVP enfocado en el análisis local.** El valor debe existir sin la base remota.
2. **Publicar open source desde el día 1.** Es la mejor carta de confianza.
3. **Curar un corpus inicial de 50-100 extensiones populares.** Esto da profundidad percibida.
4. **Publicar en Chrome Web Store con una justificación impecable.** La review es el primer gate real.
5. **Validar demanda antes de construir el backend complejo.** Si el MVP con JSON estático funciona, escalar.

### Para validar demanda

- Publicar en Product Hunt, Reddit (r/chrome, r/privacy, r/extensions)
- Compartir en Twitter/X con enfoque de seguridad
- Escribir un post explicando el proyecto y su filosofía de transparencia
- Medir: instalaciones, uso del análisis, envíos a revisión

### Para conseguir utilidad real con base pequeña

- **El scoring local ES el producto.** La base remota es un bonus.
- Mostrar valor inmediato: "Tienes 3 extensiones con acceso a TODAS tus páginas web. ¿Lo sabías?"
- Gamificar ligeramente: "Tu score de higiene es 72/100. Puedes mejorarlo."

### Diferenciación real

No hay ninguna extensión activa en Chrome Web Store que haga esto bien:

1. **CRXcavator** era el referente, pero fue discontinuado
2. **Las alternativas existentes** son genéricas, no explican nada, o son ellas mismas sospechosas
3. **El hueco está abierto** para una herramienta transparente, open source, con explicaciones humanas

**Extension Doctor no necesita ser revolucionario. Necesita ser claro, honesto y útil.**

---

## Apéndice: Sistema de Scoring Heurístico (Diseño Inicial)

### Señales y pesos

```
Score base = 100 (todos empiezan "bien")

Deducciones:
─────────────────────────────────────────────
PERMISOS DE ALTO RIESGO (cada uno resta)
  <all_urls>                    → -20
  webRequest / webRequestBlocking → -15
  tabs + history                → -10
  cookies                       → -15
  management                    → -10
  debugger                      → -20
  nativeMessaging                → -10

PATRONES PELIGROSOS (combinaciones)
  tabs + <all_urls> + webRequest → -15 adicional
  cookies + <all_urls>           → -10 adicional

SEÑALES DE CONTEXTO
  installType = "sideload"       → -10
  installType = "admin"          → -5 (puede ser legítimo)
  No está en Chrome Web Store    → -5

SEÑALES POSITIVAS (suman score o reducen deducción)
  Extensión en base con status "trusted"  → +10
  Extensión con review comunitaria buena  → +5
  Publisher conocido/verificado            → +5

Score final = max(0, score calculado)
Clasificación:
  80-100: 🟢 Bajo riesgo
  50-79:  🟡 Riesgo medio
  25-49:  🟠 Riesgo alto
  0-24:   🔴 Riesgo crítico
```

### Importante

- Este scoring es **orientativo**, no científico
- Los pesos deben ser **ajustables y versionados**
- La explicación al usuario SIEMPRE debe acompañar al número
- El score debe mostrar **por qué** se calculó así, no solo el resultado
