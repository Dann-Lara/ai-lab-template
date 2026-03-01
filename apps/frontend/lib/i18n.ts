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
  checklist: {
    title: string; newChecklist: string; myChecklists: string; noChecklists: string;
    createFirst: string; active: string; paused: string; completed: string;
    // Form
    formTitle: string; titleLabel: string; titlePlaceholder: string;
    objectiveLabel: string; objectivePlaceholder: string;
    categoryLabel: string; categoryPlaceholder: string;
    startDateLabel: string; endDateLabel: string;
    difficultyLabel: string; diffLow: string; diffMedium: string; diffHigh: string;
    dailyTimeLabel: string; dailyTimePlaceholder: string;
    goalMetricLabel: string; goalMetricPlaceholder: string;
    styleLabel: string; styleMicro: string; styleConcrete: string; styleMixed: string;
    recurringLabel: string; recurrencePatternLabel: string;
    patternDaily: string; patternWeekly: string; patternMonthly: string;
    reminderTimeLabel: string; reminderDaysLabel: string;
    telegramLabel: string; telegramPlaceholder: string;
    // Steps
    step1: string; step2: string; step3: string; step4: string; step5: string;
    generating: string; generatingMsg: string; retryGenerate: string; createManually: string;
    rationale: string;
    // Task editing
    taskDescription: string; taskFrequency: string; taskDuration: string; taskHack: string;
    freqOnce: string; freqDaily: string; freqWeekly: string; freqCustom: string;
    customDays: string; addTask: string; deleteTask: string; editTask: string;
    dailySummary: string; dailyExceeded: string;
    regenerate: string; regenerateTitle: string; feedbackLabel: string;
    feedbackPlaceholder: string; confirmChecklist: string;
    // Dashboard
    progress: string; completionRate: string; tasksCompleted: string;
    tasksPending: string; tasksSkipped: string; totalTime: string;
    weeklyActivity: string; aiFeedback: string; generateFeedback: string;
    noFeedback: string; complete: string; postpone: string; skip: string;
    markComplete: string; postponeTask: string; skipTask: string;
    hackLabel: string; deleteChecklist: string; confirmDelete: string;
    pauseChecklist: string; resumeChecklist: string;
    estimatedMin: string; mins: string;
    saveSuccess: string; deleteSuccess: string;
    navChecklist: string;
  };
}

const translations: Record<Locale, Messages> = {
  es: {
    common: { appName: 'AI Lab', loading: 'Cargando...', error: 'Error', retry: 'Reintentar', darkMode: 'Modo oscuro', lightMode: 'Modo claro' },
    nav: { home: 'Inicio', dashboard: 'Panel', features: 'Funciones', stack: 'Stack', docs: 'Docs', login: 'Entrar', signup: 'Registrarse', logout: 'Salir', adminPanel: 'Panel Admin', clientPanel: 'Panel Cliente', users: 'Usuarios', checklist: 'Checklists' },
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
    checklist: {
      title: 'Mis Checklists', newChecklist: 'Nuevo Checklist', myChecklists: 'Mis Checklists',
      noChecklists: 'Aún no tienes checklists', createFirst: 'Crea tu primer checklist con IA',
      active: 'Activo', paused: 'Pausado', completed: 'Completado',
      formTitle: 'Nuevo Checklist', titleLabel: 'Título', titlePlaceholder: 'Ej: Mejorar mi inglés en 3 meses',
      objectiveLabel: 'Objetivo principal', objectivePlaceholder: 'Ej: Alcanzar nivel B2 conversacional para viajar',
      categoryLabel: 'Categoría (opcional)', categoryPlaceholder: 'Ej: Aprendizaje, Salud, Productividad',
      startDateLabel: 'Fecha de inicio', endDateLabel: 'Fecha límite',
      difficultyLabel: 'Dificultad', diffLow: 'Baja', diffMedium: 'Media', diffHigh: 'Alta',
      dailyTimeLabel: 'Tiempo disponible por día (minutos)', dailyTimePlaceholder: 'Ej: 30',
      goalMetricLabel: 'Meta cuantitativa (opcional)', goalMetricPlaceholder: 'Ej: Leer 5 libros',
      styleLabel: 'Estilo de tareas', styleMicro: 'Micro-hábitos', styleConcrete: 'Tareas concretas', styleMixed: 'Mixto',
      recurringLabel: '¿Checklist recurrente?', recurrencePatternLabel: 'Patrón de recurrencia',
      patternDaily: 'Diario', patternWeekly: 'Semanal', patternMonthly: 'Mensual',
      reminderTimeLabel: 'Hora de recordatorio', reminderDaysLabel: 'Días de recordatorio',
      telegramLabel: 'Telegram Chat ID (opcional)', telegramPlaceholder: 'Ej: 123456789',
      step1: 'Cuestionario', step2: 'Generando', step3: 'Revisar', step4: 'Confirmar', step5: 'Listo',
      generating: 'Generando tu checklist...', generatingMsg: 'La IA está creando tareas personalizadas para ti.',
      retryGenerate: 'Reintentar', createManually: 'Crear manualmente',
      rationale: 'Estrategia de la IA',
      taskDescription: 'Descripción', taskFrequency: 'Frecuencia', taskDuration: 'Duración (min)', taskHack: 'Hack / Consejo',
      freqOnce: 'Una vez', freqDaily: 'Diario', freqWeekly: 'Semanal', freqCustom: 'Personalizado',
      customDays: 'Cada N días', addTask: 'Añadir tarea', deleteTask: 'Eliminar', editTask: 'Editar',
      dailySummary: 'Tiempo diario estimado', dailyExceeded: '¡Tiempo excedido!',
      regenerate: 'Regenerar', regenerateTitle: 'Feedback para la IA', feedbackLabel: '¿Qué deseas cambiar?',
      feedbackPlaceholder: 'Ej: Quiero tareas más cortas y en las mañanas...',
      confirmChecklist: 'Confirmar y Guardar',
      progress: 'Progreso', completionRate: 'Tasa de completado', tasksCompleted: 'Completadas',
      tasksPending: 'Pendientes', tasksSkipped: 'Omitidas', totalTime: 'Tiempo total',
      weeklyActivity: 'Actividad (14 días)', aiFeedback: 'Feedback de IA', generateFeedback: 'Generar feedback',
      noFeedback: 'Sin feedback aún. Genera uno para ver tu progreso.',
      complete: 'Completar', postpone: 'Aplazar', skip: 'Omitir',
      markComplete: 'Marcar como completada', postponeTask: 'Aplazar 1 día', skipTask: 'Omitir',
      hackLabel: 'Consejo', deleteChecklist: 'Eliminar checklist', confirmDelete: '¿Eliminar este checklist?',
      pauseChecklist: 'Pausar', resumeChecklist: 'Reanudar',
      estimatedMin: 'min estimados', mins: 'min',
      saveSuccess: '¡Checklist guardado!', deleteSuccess: 'Checklist eliminado',
      navChecklist: 'Checklists',
    },
  },
  en: {
    common: { appName: 'AI Lab', loading: 'Loading...', error: 'Error', retry: 'Retry', darkMode: 'Dark mode', lightMode: 'Light mode' },
    nav: { home: 'Home', dashboard: 'Dashboard', features: 'Features', stack: 'Stack', docs: 'Docs', login: 'Sign In', signup: 'Sign Up', logout: 'Sign Out', adminPanel: 'Admin Panel', clientPanel: 'Client Panel', users: 'Users', checklist: 'Checklists' },
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
    checklist: {
      title: 'My Checklists', newChecklist: 'New Checklist', myChecklists: 'My Checklists',
      noChecklists: 'No checklists yet', createFirst: 'Create your first AI-powered checklist',
      active: 'Active', paused: 'Paused', completed: 'Completed',
      formTitle: 'New Checklist', titleLabel: 'Title', titlePlaceholder: 'E.g. Improve my English in 3 months',
      objectiveLabel: 'Main objective', objectivePlaceholder: 'E.g. Reach B2 conversational level for travel',
      categoryLabel: 'Category (optional)', categoryPlaceholder: 'E.g. Learning, Health, Productivity',
      startDateLabel: 'Start date', endDateLabel: 'End date',
      difficultyLabel: 'Difficulty', diffLow: 'Low', diffMedium: 'Medium', diffHigh: 'High',
      dailyTimeLabel: 'Daily available time (minutes)', dailyTimePlaceholder: 'E.g. 30',
      goalMetricLabel: 'Quantitative goal (optional)', goalMetricPlaceholder: 'E.g. Read 5 books',
      styleLabel: 'Task style', styleMicro: 'Micro-habits', styleConcrete: 'Concrete tasks', styleMixed: 'Mixed',
      recurringLabel: 'Recurring checklist?', recurrencePatternLabel: 'Recurrence pattern',
      patternDaily: 'Daily', patternWeekly: 'Weekly', patternMonthly: 'Monthly',
      reminderTimeLabel: 'Reminder time', reminderDaysLabel: 'Reminder days',
      telegramLabel: 'Telegram Chat ID (optional)', telegramPlaceholder: 'E.g. 123456789',
      step1: 'Questionnaire', step2: 'Generating', step3: 'Review', step4: 'Confirm', step5: 'Done',
      generating: 'Generating your checklist...', generatingMsg: 'AI is creating personalized tasks for you.',
      retryGenerate: 'Retry', createManually: 'Create manually',
      rationale: 'AI strategy',
      taskDescription: 'Description', taskFrequency: 'Frequency', taskDuration: 'Duration (min)', taskHack: 'Hack / Tip',
      freqOnce: 'Once', freqDaily: 'Daily', freqWeekly: 'Weekly', freqCustom: 'Custom',
      customDays: 'Every N days', addTask: 'Add task', deleteTask: 'Delete', editTask: 'Edit',
      dailySummary: 'Estimated daily time', dailyExceeded: 'Time exceeded!',
      regenerate: 'Regenerate', regenerateTitle: 'Feedback for AI', feedbackLabel: 'What would you like to change?',
      feedbackPlaceholder: 'E.g. I want shorter tasks in the mornings...',
      confirmChecklist: 'Confirm & Save',
      progress: 'Progress', completionRate: 'Completion rate', tasksCompleted: 'Completed',
      tasksPending: 'Pending', tasksSkipped: 'Skipped', totalTime: 'Total time',
      weeklyActivity: 'Activity (14 days)', aiFeedback: 'AI Feedback', generateFeedback: 'Generate feedback',
      noFeedback: 'No feedback yet. Generate one to see your progress.',
      complete: 'Complete', postpone: 'Postpone', skip: 'Skip',
      markComplete: 'Mark as complete', postponeTask: 'Postpone 1 day', skipTask: 'Skip',
      hackLabel: 'Tip', deleteChecklist: 'Delete checklist', confirmDelete: 'Delete this checklist?',
      pauseChecklist: 'Pause', resumeChecklist: 'Resume',
      estimatedMin: 'est. min', mins: 'min',
      saveSuccess: 'Checklist saved!', deleteSuccess: 'Checklist deleted',
      navChecklist: 'Checklists',
    },
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
