import type { Locale } from './types';

export const checklistES = {
  checklist: {
    title: 'Mis Checklists', newChecklist: 'Nuevo Checklist', myChecklists: 'Mis Checklists',
    noChecklists: 'Aún no tienes checklists', createFirst: 'Crea tu primer checklist con IA',
    active: 'Activo', paused: 'Pausado', completed: 'Completado',

    // Form - section labels
    sectionCore: 'Core', sectionStyle: 'Estilo', sectionReminders: 'Recordatorios',
    formTitle: 'Nuevo Checklist', titleLabel: 'Título',
    titlePlaceholder: 'Ej: Mejorar mi inglés en 3 meses',
    objectiveLabel: 'Objetivo principal',
    objectivePlaceholder: 'Ej: Alcanzar nivel B2 conversacional para viajar',
    categoryLabel: 'Categoría (opcional)', categoryPlaceholder: 'Ej: Aprendizaje, Salud, Productividad',
    startDateLabel: 'Fecha de inicio', endDateLabel: 'Fecha límite',
    difficultyLabel: 'Dificultad', diffLow: 'Baja', diffMedium: 'Media', diffHigh: 'Alta',
    dailyTimeLabel: 'Tiempo disponible por día (minutos)', dailyTimePlaceholder: 'Ej: 30',
    goalMetricLabel: 'Meta cuantitativa (opcional)', goalMetricPlaceholder: 'Ej: Leer 5 libros',
    styleLabel: 'Estilo de tareas', styleMicro: 'Micro-hábitos',
    styleConcrete: 'Tareas concretas', styleMixed: 'Mixto',
    recurringLabel: '¿Checklist recurrente?', recurrencePatternLabel: 'Patrón de recurrencia',
    patternDaily: 'Diario', patternWeekly: 'Semanal', patternMonthly: 'Mensual',
    reminderTimeLabel: 'Hora de recordatorio', reminderDaysLabel: 'Días de recordatorio',
    telegramLabel: 'Telegram Chat ID (opcional)', telegramPlaceholder: 'Ej: 123456789',

    // Steps
    step1: 'Cuestionario', step2: 'Generando', step3: 'Revisar', step4: 'Confirmar', step5: 'Listo',
    generating: 'Generando tu checklist...', generatingMsg: 'La IA está creando tareas personalizadas para ti.',
    retryGenerate: 'Reintentar', createManually: 'Crear manualmente',
    rationale: 'Estrategia de la IA',

    // Validation errors
    errorEmptyTask: 'Hay tareas sin descripción',
    errorRequiredFields: 'Todos los campos son requeridos',

    // Task editing
    taskDescription: 'Descripción', taskFrequency: 'Frecuencia',
    taskDuration: 'Duración (min)', taskHack: 'Hack / Consejo',
    freqOnce: 'Una vez', freqDaily: 'Diario', freqWeekly: 'Semanal', freqCustom: 'Personalizado',
    customDays: 'Cada N días', addTask: 'Añadir tarea', deleteTask: 'Eliminar', editTask: 'Editar',
    dailySummary: 'Tiempo diario estimado', dailyExceeded: '¡Tiempo excedido!',
    regenerate: 'Regenerar', regenerateTitle: 'Feedback para la IA',
    feedbackLabel: '¿Qué deseas cambiar?',
    feedbackPlaceholder: 'Ej: Quiero tareas más cortas y en las mañanas...',
    confirmChecklist: 'Confirmar y Guardar',

    // Detail / Dashboard
    progress: 'Progreso', completionRate: 'Tasa de completado', tasksCompleted: 'Completadas',
    tasksPending: 'Pendientes', tasksSkipped: 'Omitidas', totalTime: 'Tiempo total',
    weeklyActivity: 'Actividad (14 días)', aiFeedback: 'Feedback de IA',
    generateFeedback: 'Generar feedback',
    noFeedback: 'Sin feedback aún. Genera uno para ver tu progreso.',
    complete: 'Completar', postpone: 'Aplazar', skip: 'Omitir',
    markComplete: 'Marcar como completada', postponeTask: 'Aplazar 1 día', skipTask: 'Omitir',
    hackLabel: 'Consejo', deleteChecklist: 'Eliminar checklist',
    confirmDelete: '¿Eliminar este checklist?',
    pauseChecklist: 'Pausar', resumeChecklist: 'Reanudar',
    estimatedMin: 'min estimados', mins: 'min',
    saveSuccess: '¡Checklist guardado!', deleteSuccess: 'Checklist eliminado',
    navChecklist: 'Checklists',

    // Tabs & sections
    tabTasks: 'Tareas', tabDashboard: 'Dashboard', tabGlobal: 'Global',
    pendingSection: 'Pendientes', completedSection: 'Completadas',
    globalDashboard: 'Dashboard Global',
    aiToolsTitle: 'Herramientas IA',
    aiToolsDesc: 'Genera y resume texto con inteligencia artificial',

    // Telegram send
    sendToTelegram: 'Enviar a Telegram',
    sendToTelegramTitle: 'Enviar checklist a Telegram',
    sendToTelegramDesc: 'Envía esta checklist con todas sus tareas a tu Telegram',
    telegramSending: 'Enviando...',
    telegramNoId: 'Esta checklist no tiene Telegram Chat ID configurado',
    telegramSuccess: '¡Enviado a Telegram!',
    telegramError: 'Error al enviar a Telegram',

    // Misc hardcoded strings
    tabAll: 'Todos',
    headerSubtitle: 'AI Lab — Productividad',
    tasksCount: 'tareas',
    allCompleted: '¡Todo completado!',
    minsPerDay: 'min/día',
    weekLabel: 'Semana',
    cancel: 'Cancelar',
    save: 'Guardar',
  },
} as const;

export const checklistEN = {
  checklist: {
    title: 'My Checklists', newChecklist: 'New Checklist', myChecklists: 'My Checklists',
    noChecklists: 'No checklists yet', createFirst: 'Create your first AI-powered checklist',
    active: 'Active', paused: 'Paused', completed: 'Completed',

    sectionCore: 'Core', sectionStyle: 'Style', sectionReminders: 'Reminders',
    formTitle: 'New Checklist', titleLabel: 'Title',
    titlePlaceholder: 'E.g. Improve my English in 3 months',
    objectiveLabel: 'Main objective',
    objectivePlaceholder: 'E.g. Reach B2 conversational level for travel',
    categoryLabel: 'Category (optional)', categoryPlaceholder: 'E.g. Learning, Health, Productivity',
    startDateLabel: 'Start date', endDateLabel: 'End date',
    difficultyLabel: 'Difficulty', diffLow: 'Low', diffMedium: 'Medium', diffHigh: 'High',
    dailyTimeLabel: 'Daily available time (minutes)', dailyTimePlaceholder: 'E.g. 30',
    goalMetricLabel: 'Quantitative goal (optional)', goalMetricPlaceholder: 'E.g. Read 5 books',
    styleLabel: 'Task style', styleMicro: 'Micro-habits',
    styleConcrete: 'Concrete tasks', styleMixed: 'Mixed',
    recurringLabel: 'Recurring checklist?', recurrencePatternLabel: 'Recurrence pattern',
    patternDaily: 'Daily', patternWeekly: 'Weekly', patternMonthly: 'Monthly',
    reminderTimeLabel: 'Reminder time', reminderDaysLabel: 'Reminder days',
    telegramLabel: 'Telegram Chat ID (optional)', telegramPlaceholder: 'E.g. 123456789',

    step1: 'Questionnaire', step2: 'Generating', step3: 'Review', step4: 'Confirm', step5: 'Done',
    generating: 'Generating your checklist...', generatingMsg: 'AI is creating personalized tasks for you.',
    retryGenerate: 'Retry', createManually: 'Create manually',
    rationale: 'AI strategy',

    errorEmptyTask: 'Some tasks have no description',
    errorRequiredFields: 'All fields are required',

    taskDescription: 'Description', taskFrequency: 'Frequency',
    taskDuration: 'Duration (min)', taskHack: 'Hack / Tip',
    freqOnce: 'Once', freqDaily: 'Daily', freqWeekly: 'Weekly', freqCustom: 'Custom',
    customDays: 'Every N days', addTask: 'Add task', deleteTask: 'Delete', editTask: 'Edit',
    dailySummary: 'Estimated daily time', dailyExceeded: 'Time exceeded!',
    regenerate: 'Regenerate', regenerateTitle: 'Feedback for AI',
    feedbackLabel: 'What would you like to change?',
    feedbackPlaceholder: 'E.g. I want shorter tasks in the mornings...',
    confirmChecklist: 'Confirm & Save',

    progress: 'Progress', completionRate: 'Completion rate', tasksCompleted: 'Completed',
    tasksPending: 'Pending', tasksSkipped: 'Skipped', totalTime: 'Total time',
    weeklyActivity: 'Activity (14 days)', aiFeedback: 'AI Feedback',
    generateFeedback: 'Generate feedback',
    noFeedback: 'No feedback yet. Generate one to see your progress.',
    complete: 'Complete', postpone: 'Postpone', skip: 'Skip',
    markComplete: 'Mark as complete', postponeTask: 'Postpone 1 day', skipTask: 'Skip',
    hackLabel: 'Tip', deleteChecklist: 'Delete checklist',
    confirmDelete: 'Delete this checklist?',
    pauseChecklist: 'Pause', resumeChecklist: 'Resume',
    estimatedMin: 'est. min', mins: 'min',
    saveSuccess: 'Checklist saved!', deleteSuccess: 'Checklist deleted',
    navChecklist: 'Checklists',

    tabTasks: 'Tasks', tabDashboard: 'Dashboard', tabGlobal: 'Global',
    pendingSection: 'Pending', completedSection: 'Completed',
    globalDashboard: 'Global Dashboard',
    aiToolsTitle: 'AI Tools',
    aiToolsDesc: 'Generate and summarize text with artificial intelligence',

    // Telegram send
    sendToTelegram: 'Send to Telegram',
    sendToTelegramTitle: 'Send checklist to Telegram',
    sendToTelegramDesc: 'Send this checklist with all its tasks to your Telegram',
    telegramSending: 'Sending...',
    telegramNoId: 'This checklist has no Telegram Chat ID configured',
    telegramSuccess: 'Sent to Telegram!',
    telegramError: 'Error sending to Telegram',

    // Misc hardcoded strings
    tabAll: 'All',
    headerSubtitle: 'AI Lab — Productivity',
    tasksCount: 'tasks',
    allCompleted: 'All done!',
    minsPerDay: 'min/day',
    weekLabel: 'Week',
    cancel: 'Cancel',
    save: 'Save',
  },
} as const;

export const checklistTranslations: Record<Locale, typeof checklistES> = { es: checklistES, en: checklistEN };
