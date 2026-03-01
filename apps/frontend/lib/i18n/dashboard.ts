import type { Locale } from './types';

export const dashboardES = {
  dashboard: {
    title: 'Panel', adminTitle: 'Panel de Administración', clientTitle: 'Panel de Cliente',
    generatorTitle: 'Generador de Texto IA',
    generatorDesc: 'Genera cualquier tipo de contenido: emails, documentos, código, ideas y más.',
    generatorUsage: 'Escribe tu instrucción, ajusta temperatura y modelo, presiona Generar. Copia el resultado.',
    summarizerTitle: 'Resumidor de Texto IA',
    summarizerDesc: 'Reduce textos largos a su esencia. Ideal para artículos y documentos extensos.',
    welcomeBack: 'Bienvenido de vuelta',
    aiTools: 'Herramientas IA', systemInfo: 'Infraestructura',
    checklistProgress: 'Progreso de Checklists', viewAll: 'Ver todos',
    noChecklistsYet: 'Sin checklists aún', startChecklist: 'Crear checklist',
    overallProgress: 'Progreso global',
    howToUse: '¿Cómo se usa?',
    myProfile: 'Mi Perfil', profileSub: 'Telegram · configuración',
    howToUse: '¿Cómo se usa?',
    // System services labels
    svcFrontend: 'Frontend', svcBackend: 'Backend', svcDatabase: 'Base de datos',
    svcCache: 'Caché', svcAutomation: 'Automatización', svcApiDocs: 'Docs API',
  },
  ai: {
    systemMessage: 'Mensaje de sistema (opcional)',
    systemMessagePlaceholder: 'Eres un asistente útil...',
    prompt: 'Prompt', promptPlaceholder: 'Escribe tu prompt aquí...',
    temperature: 'Temperatura', generate: 'Generar', generating: 'Generando...',
    result: 'Resultado', textToSummarize: 'Texto a resumir',
    textToSummarizePlaceholder: 'Pega el texto que deseas resumir...',
    summarize: 'Resumir', summarizing: 'Resumiendo...', summary: 'Resumen',
  },
  admin: {
    usersTitle: 'Usuarios', createUser: 'Crear Usuario', userCount: 'Total usuarios',
    activeUsers: 'Activos', role: 'Rol', status: 'Estado',
    actions: 'Acciones', deactivate: 'Desactivar', activate: 'Activar',
  },
} as const;

export const dashboardEN = {
  dashboard: {
    title: 'Dashboard', adminTitle: 'Admin Dashboard', clientTitle: 'Client Dashboard',
    generatorTitle: 'AI Text Generator',
    generatorDesc: 'Generate any type of content with AI: emails, documents, code, ideas and more.',
    generatorUsage: 'Write your instruction, adjust temperature and model, press Generate. Copy the result.',
    summarizerTitle: 'AI Text Summarizer',
    summarizerDesc: 'Condense long texts to their essence. Ideal for articles and extensive documents.',
    welcomeBack: 'Welcome back',
    aiTools: 'AI Tools', systemInfo: 'Infrastructure',
    checklistProgress: 'Checklist Progress', viewAll: 'View all',
    noChecklistsYet: 'No checklists yet', startChecklist: 'Create checklist',
    overallProgress: 'Overall progress',
    howToUse: 'How to use?',
    myProfile: 'My Profile', profileSub: 'Telegram · settings',
    howToUse: 'How to use?',
    svcFrontend: 'Frontend', svcBackend: 'Backend', svcDatabase: 'Database',
    svcCache: 'Cache', svcAutomation: 'Automation', svcApiDocs: 'API Docs',
  },
  ai: {
    systemMessage: 'System message (optional)',
    systemMessagePlaceholder: 'You are a helpful assistant...',
    prompt: 'Prompt', promptPlaceholder: 'Write your prompt here...',
    temperature: 'Temperature', generate: 'Generate', generating: 'Generating...',
    result: 'Result', textToSummarize: 'Text to Summarize',
    textToSummarizePlaceholder: 'Paste the text you want to summarize...',
    summarize: 'Summarize', summarizing: 'Summarizing...', summary: 'Summary',
  },
  admin: {
    usersTitle: 'Users', createUser: 'Create User', userCount: 'Total users',
    activeUsers: 'Active', role: 'Role', status: 'Status',
    actions: 'Actions', deactivate: 'Deactivate', activate: 'Activate',
  },
} as const;

export const dashboardTranslations: Record<Locale, typeof dashboardES> = { es: dashboardES, en: dashboardEN };
