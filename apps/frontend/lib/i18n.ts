export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';
export const LOCALE_COOKIE = 'ai_lab_locale';

export interface Messages {
  common: { appName: string; loading: string; error: string; retry: string; darkMode: string; lightMode: string; };
  nav: {
    home: string; dashboard: string; features: string; stack: string; docs: string;
    login: string; signup: string; logout: string;
    adminPanel: string; clientPanel: string; users: string;
  };
  home: {
    heroTag: string; heroTitle: string; heroSub: string; heroCta: string; heroCtaSec: string;
    featuresTitle: string; feat1Title: string; feat1Desc: string;
    feat2Title: string; feat2Desc: string; feat3Title: string; feat3Desc: string;
    stackTitle: string; docsTitle: string; docsCta: string;
  };
  auth: {
    loginTitle: string; loginSub: string; signupTitle: string; signupSub: string;
    email: string; password: string; name: string; confirmPassword: string;
    loginBtn: string; signupBtn: string; loggingIn: string; signingUp: string;
    noAccount: string; haveAccount: string; forgotPassword: string;
    passwordHint: string; successSignup: string;
  };
  dashboard: { title: string; adminTitle: string; clientTitle: string; generatorTitle: string; summarizerTitle: string; welcomeBack: string; };
  admin: { usersTitle: string; createUser: string; userCount: string; activeUsers: string; role: string; status: string; actions: string; deactivate: string; activate: string; };
  ai: { systemMessage: string; systemMessagePlaceholder: string; prompt: string; promptPlaceholder: string; temperature: string; generate: string; generating: string; result: string; textToSummarize: string; textToSummarizePlaceholder: string; summarize: string; summarizing: string; summary: string; };
  footer: { description: string; navTitle: string; stackTitle: string; statusTitle: string; statusMsg: string; location: string; rights: string; madeWith: string; };
}

const translations: Record<Locale, Messages> = {
  es: {
    common: { appName: 'AI Lab', loading: 'Cargando...', error: 'Error', retry: 'Reintentar', darkMode: 'Modo oscuro', lightMode: 'Modo claro' },
    nav: { home: 'Inicio', dashboard: 'Panel', features: 'Funciones', stack: 'Stack', docs: 'Docs', login: 'Entrar', signup: 'Registrarse', logout: 'Salir', adminPanel: 'Panel Admin', clientPanel: 'Panel Cliente', users: 'Usuarios' },
    home: {
      heroTag: 'v1.0 — Listo para construir',
      heroTitle: 'AI Lab\nTemplate',
      heroSub: 'Monorepo fullstack con IA, automatización y auth robusto. Next.js · NestJS · LangChain · n8n',
      heroCta: 'Abrir Panel', heroCtaSec: 'Ver Docs',
      featuresTitle: 'Capacidades',
      feat1Title: 'IA Integrada', feat1Desc: 'GPT-4o-mini via LangChain con chains de generación, resumen y agentes personalizables.',
      feat2Title: 'Auth Robusto', feat2Desc: 'JWT + Refresh tokens. Roles: superadmin, admin, cliente. Guards de autorización por ruta.',
      feat3Title: 'Automatización', feat3Desc: 'n8n integrado con webhooks bidireccionales. Flujos de trabajo sin código, listos para producción.',
      stackTitle: 'Stack Tecnológico',
      docsTitle: 'Documentación API', docsCta: 'Abrir Swagger →',
    },
    auth: {
      loginTitle: 'Bienvenido', loginSub: 'Ingresa tus credenciales para continuar.',
      signupTitle: 'Crear cuenta', signupSub: 'Accede al panel de cliente con IA.',
      email: 'Email', password: 'Contraseña', name: 'Nombre completo', confirmPassword: 'Confirmar contraseña',
      loginBtn: 'Entrar', signupBtn: 'Crear cuenta', loggingIn: 'Ingresando...', signingUp: 'Creando cuenta...',
      noAccount: '¿No tienes cuenta?', haveAccount: '¿Ya tienes cuenta?',
      forgotPassword: '¿Olvidaste tu contraseña?',
      passwordHint: 'Mínimo 8 caracteres, una mayúscula, una minúscula y un número.',
      successSignup: '¡Cuenta creada! Ahora puedes ingresar.',
    },
    dashboard: { title: 'Panel', adminTitle: 'Panel de Administración', clientTitle: 'Panel de Cliente', generatorTitle: 'Generador de Texto', summarizerTitle: 'Resumidor de Texto', welcomeBack: 'Bienvenido de vuelta' },
    admin: { usersTitle: 'Usuarios', createUser: 'Crear Usuario', userCount: 'Total usuarios', activeUsers: 'Activos', role: 'Rol', status: 'Estado', actions: 'Acciones', deactivate: 'Desactivar', activate: 'Activar' },
    ai: { systemMessage: 'Mensaje de sistema (opcional)', systemMessagePlaceholder: 'Eres un asistente útil...', prompt: 'Prompt', promptPlaceholder: 'Escribe tu prompt aquí...', temperature: 'Temperatura', generate: 'Generar', generating: 'Generando...', result: 'Resultado', textToSummarize: 'Texto a resumir', textToSummarizePlaceholder: 'Pega el texto que deseas resumir...', summarize: 'Resumir', summarizing: 'Resumiendo...', summary: 'Resumen' },
    footer: { description: 'Monorepo fullstack con IA, auth robusto y automatización. Listo para producción.', navTitle: 'Navegación', stackTitle: 'Stack', statusTitle: 'Estado', statusMsg: 'Sistema operativo', location: 'Dev · Local', rights: 'Todos los derechos reservados', madeWith: 'Construido con' },
  },
  en: {
    common: { appName: 'AI Lab', loading: 'Loading...', error: 'Error', retry: 'Retry', darkMode: 'Dark mode', lightMode: 'Light mode' },
    nav: { home: 'Home', dashboard: 'Dashboard', features: 'Features', stack: 'Stack', docs: 'Docs', login: 'Sign In', signup: 'Sign Up', logout: 'Sign Out', adminPanel: 'Admin Panel', clientPanel: 'Client Panel', users: 'Users' },
    home: {
      heroTag: 'v1.0 — Ready to build',
      heroTitle: 'AI Lab\nTemplate',
      heroSub: 'Fullstack monorepo with AI, automation and robust auth. Next.js · NestJS · LangChain · n8n',
      heroCta: 'Open Dashboard', heroCtaSec: 'View Docs',
      featuresTitle: 'Capabilities',
      feat1Title: 'AI Built-in', feat1Desc: 'GPT-4o-mini via LangChain with generation, summarization chains and customizable agents.',
      feat2Title: 'Robust Auth', feat2Desc: 'JWT + Refresh tokens. Roles: superadmin, admin, client. Route-level authorization guards.',
      feat3Title: 'Automation', feat3Desc: 'n8n integrated with bidirectional webhooks. No-code workflows, production-ready.',
      stackTitle: 'Tech Stack',
      docsTitle: 'API Documentation', docsCta: 'Open Swagger →',
    },
    auth: {
      loginTitle: 'Welcome back', loginSub: 'Enter your credentials to continue.',
      signupTitle: 'Create account', signupSub: 'Get access to the AI client panel.',
      email: 'Email', password: 'Password', name: 'Full name', confirmPassword: 'Confirm password',
      loginBtn: 'Sign In', signupBtn: 'Create account', loggingIn: 'Signing in...', signingUp: 'Creating account...',
      noAccount: "Don't have an account?", haveAccount: 'Already have an account?',
      forgotPassword: 'Forgot your password?',
      passwordHint: 'Min. 8 characters, one uppercase, one lowercase and one number.',
      successSignup: 'Account created! You can now sign in.',
    },
    dashboard: { title: 'Dashboard', adminTitle: 'Admin Dashboard', clientTitle: 'Client Dashboard', generatorTitle: 'Text Generator', summarizerTitle: 'Text Summarizer', welcomeBack: 'Welcome back' },
    admin: { usersTitle: 'Users', createUser: 'Create User', userCount: 'Total users', activeUsers: 'Active', role: 'Role', status: 'Status', actions: 'Actions', deactivate: 'Deactivate', activate: 'Activate' },
    ai: { systemMessage: 'System message (optional)', systemMessagePlaceholder: 'You are a helpful assistant...', prompt: 'Prompt', promptPlaceholder: 'Write your prompt here...', temperature: 'Temperature', generate: 'Generate', generating: 'Generating...', result: 'Result', textToSummarize: 'Text to Summarize', textToSummarizePlaceholder: 'Paste the text you want to summarize...', summarize: 'Summarize', summarizing: 'Summarizing...', summary: 'Summary' },
    footer: { description: 'Fullstack monorepo with AI, robust auth and automation. Production-ready.', navTitle: 'Navigation', stackTitle: 'Stack', statusTitle: 'Status', statusMsg: 'System operational', location: 'Dev · Local', rights: 'All rights reserved', madeWith: 'Built with' },
  },
};

export function getMessages(locale: Locale): Messages {
  return translations[locale] ?? translations[defaultLocale];
}

export function getStoredLocale(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  const m = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  const s = m?.[1] as Locale | undefined;
  return s && locales.includes(s) ? s : defaultLocale;
}

export function setStoredLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}
