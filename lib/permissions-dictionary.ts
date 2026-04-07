/**
 * Diccionario de permisos de Chrome.
 * Mapea cada permiso a una explicación humana y un nivel de riesgo base.
 *
 * Este archivo es contenido, no lógica. Se puede ampliar fácilmente.
 */

export interface PermissionInfo {
  /** Nombre técnico del permiso */
  name: string;
  /** Explicación breve y humana */
  explanation: string;
  /** Explicación detallada con ejemplo concreto */
  detailedExplanation: string;
  /** Penalización base al score (0-100) */
  basePenalty: number;
  /** Severidad visual */
  severity: 'info' | 'warning' | 'danger' | 'critical';
  /** Categoría del permiso */
  category: 'data-access' | 'browser-control' | 'system' | 'network' | 'identity' | 'low-risk';
}

/**
 * Diccionario principal de permisos.
 * Clave = nombre del permiso tal como aparece en chrome.management.
 */
export const PERMISSIONS_DICTIONARY: Record<string, PermissionInfo> = {
  // ─── Permisos de alto riesgo ────────────────────────────────
  '<all_urls>': {
    name: '<all_urls>',
    explanation: 'Puede leer y modificar TODAS las páginas web que visitas.',
    detailedExplanation:
      'Esta extensión tiene acceso completo a todas las URLs que abras. Puede leer el contenido de cualquier página, incluidas páginas de banca online, correo electrónico, redes sociales, etc.',
    basePenalty: 20,
    severity: 'critical',
    category: 'data-access',
  },
  tabs: {
    name: 'tabs',
    explanation: 'Puede ver todas tus pestañas abiertas y sus URLs.',
    detailedExplanation:
      'Puede acceder a la lista completa de pestañas abiertas, ver qué páginas estás visitando, y detectar tu actividad de navegación.',
    basePenalty: 8,
    severity: 'warning',
    category: 'browser-control',
  },
  webRequest: {
    name: 'webRequest',
    explanation: 'Puede observar todo el tráfico de red del navegador.',
    detailedExplanation:
      'Puede monitorizar todas las peticiones HTTP que hace tu navegador, incluyendo URLs, cabeceras y datos enviados a servidores.',
    basePenalty: 15,
    severity: 'danger',
    category: 'network',
  },
  webRequestBlocking: {
    name: 'webRequestBlocking',
    explanation: 'Puede interceptar y modificar el tráfico de red.',
    detailedExplanation:
      'Además de observar el tráfico, puede bloquearlo, redirigirlo o modificarlo antes de que llegue a su destino.',
    basePenalty: 15,
    severity: 'critical',
    category: 'network',
  },
  cookies: {
    name: 'cookies',
    explanation: 'Puede leer y modificar las cookies de cualquier sitio.',
    detailedExplanation:
      'Las cookies contienen sesiones de inicio de sesión, preferencias y tokens de autenticación. Acceder a cookies puede permitir suplantar sesiones.',
    basePenalty: 15,
    severity: 'danger',
    category: 'data-access',
  },
  history: {
    name: 'history',
    explanation: 'Puede leer todo tu historial de navegación.',
    detailedExplanation:
      'Acceso completo al historial de páginas visitadas, incluyendo fechas, frecuencia de visita y títulos de páginas.',
    basePenalty: 10,
    severity: 'danger',
    category: 'data-access',
  },
  bookmarks: {
    name: 'bookmarks',
    explanation: 'Puede leer y modificar tus marcadores.',
    detailedExplanation:
      'Acceso a toda tu lista de marcadores guardados, que puede revelar intereses, servicios usados y sitios frecuentes.',
    basePenalty: 5,
    severity: 'warning',
    category: 'data-access',
  },
  management: {
    name: 'management',
    explanation: 'Puede ver y gestionar otras extensiones instaladas.',
    detailedExplanation:
      'Puede listar todas las extensiones, ver sus permisos, habilitarlas o deshabilitarlas. Es un permiso potente.',
    basePenalty: 10,
    severity: 'danger',
    category: 'system',
  },
  debugger: {
    name: 'debugger',
    explanation: 'Puede usar las herramientas de depuración del navegador.',
    detailedExplanation:
      'Acceso al protocolo de depuración de Chrome. Puede inspeccionar, modificar y controlar páginas web de forma profunda. Muy potente y raro en extensiones normales.',
    basePenalty: 20,
    severity: 'critical',
    category: 'system',
  },
  nativeMessaging: {
    name: 'nativeMessaging',
    explanation: 'Puede comunicarse con programas instalados en tu ordenador.',
    detailedExplanation:
      'Permite a la extensión enviar y recibir mensajes con aplicaciones nativas del sistema operativo. Puede ser legítimo, pero amplía significativamente el alcance.',
    basePenalty: 10,
    severity: 'danger',
    category: 'system',
  },
  clipboardRead: {
    name: 'clipboardRead',
    explanation: 'Puede leer lo que tengas copiado en el portapapeles.',
    detailedExplanation:
      'Todo lo que copies (contraseñas, textos, URLs) puede ser leído por esta extensión.',
    basePenalty: 10,
    severity: 'danger',
    category: 'data-access',
  },
  clipboardWrite: {
    name: 'clipboardWrite',
    explanation: 'Puede modificar el contenido de tu portapapeles.',
    detailedExplanation:
      'Puede cambiar lo que tienes copiado sin que te des cuenta. Riesgo: cambiar una dirección de criptomoneda o un enlace.',
    basePenalty: 8,
    severity: 'warning',
    category: 'data-access',
  },
  downloads: {
    name: 'downloads',
    explanation: 'Puede gestionar las descargas del navegador.',
    detailedExplanation:
      'Puede iniciar descargas, ver el historial de descargas y acceder a archivos descargados.',
    basePenalty: 8,
    severity: 'warning',
    category: 'system',
  },
  geolocation: {
    name: 'geolocation',
    explanation: 'Puede acceder a tu ubicación geográfica.',
    detailedExplanation:
      'Puede conocer tu ubicación física aproximada o exacta dependiendo del dispositivo.',
    basePenalty: 10,
    severity: 'danger',
    category: 'identity',
  },
  identity: {
    name: 'identity',
    explanation: 'Puede acceder a tu identidad de cuenta de Google.',
    detailedExplanation:
      'Puede obtener tokens de autenticación OAuth2 vinculados a tu cuenta de Google.',
    basePenalty: 12,
    severity: 'danger',
    category: 'identity',
  },
  proxy: {
    name: 'proxy',
    explanation: 'Puede configurar el proxy del navegador.',
    detailedExplanation:
      'Puede redirigir todo tu tráfico de internet a través de un servidor externo, lo que permite interceptar comunicaciones.',
    basePenalty: 15,
    severity: 'critical',
    category: 'network',
  },
  privacy: {
    name: 'privacy',
    explanation: 'Puede modificar la configuración de privacidad del navegador.',
    detailedExplanation:
      'Puede cambiar ajustes de privacidad como el envío de datos de navegación, protección contra rastreo, etc.',
    basePenalty: 10,
    severity: 'danger',
    category: 'browser-control',
  },

  // ─── Permisos de riesgo bajo ────────────────────────────────
  storage: {
    name: 'storage',
    explanation: 'Guarda datos localmente en el navegador.',
    detailedExplanation:
      'Almacena datos de configuración y preferencias de la extensión. Es un permiso estándar y de bajo riesgo.',
    basePenalty: 0,
    severity: 'info',
    category: 'low-risk',
  },
  alarms: {
    name: 'alarms',
    explanation: 'Puede programar tareas periódicas.',
    detailedExplanation:
      'Permite ejecutar funciones en intervalos regulares. Uso habitual: actualizaciones, sincronizaciones.',
    basePenalty: 0,
    severity: 'info',
    category: 'low-risk',
  },
  notifications: {
    name: 'notifications',
    explanation: 'Puede mostrar notificaciones del sistema.',
    detailedExplanation:
      'Permite enviar notificaciones visibles al usuario. Uso normal, pero puede ser molesto si se abusa.',
    basePenalty: 2,
    severity: 'info',
    category: 'low-risk',
  },
  contextMenus: {
    name: 'contextMenus',
    explanation: 'Puede añadir opciones al menú del botón derecho.',
    detailedExplanation:
      'Añade entradas personalizadas al menú contextual. Completamente inofensivo.',
    basePenalty: 0,
    severity: 'info',
    category: 'low-risk',
  },
  activeTab: {
    name: 'activeTab',
    explanation: 'Puede acceder a la pestaña activa cuando haces clic en la extensión.',
    detailedExplanation:
      'Solo tiene acceso a la pestaña actual y solo cuando el usuario interactúa con la extensión. Es un permiso seguro y recomendado por Google como alternativa a <all_urls>.',
    basePenalty: 2,
    severity: 'info',
    category: 'low-risk',
  },
  idle: {
    name: 'idle',
    explanation: 'Puede detectar si estás usando el ordenador activamente.',
    detailedExplanation:
      'Detecta estados de inactividad del usuario. Uso habitual: pausar funcionalidades cuando no estás.',
    basePenalty: 2,
    severity: 'info',
    category: 'low-risk',
  },
};

/**
 * Obtiene la información de un permiso.
 * Si no está en el diccionario, devuelve una entrada genérica.
 */
export function getPermissionInfo(permission: string): PermissionInfo {
  return (
    PERMISSIONS_DICTIONARY[permission] ?? {
      name: permission,
      explanation: `Permiso "${permission}" — sin información detallada disponible.`,
      detailedExplanation: `Este permiso no está documentado en el diccionario de Extension Doctor. Consulta la documentación de Chrome para más información.`,
      basePenalty: 5,
      severity: 'warning' as const,
      category: 'system' as const,
    }
  );
}
