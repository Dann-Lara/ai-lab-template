import type { Locale } from './types';

export const profileES = {
  profile: {
    title: 'Mi Perfil', subtitle: 'Configuración de cuenta',
    section: 'Panel Admin',
    personalInfo: 'Información personal',
    fullName: 'Nombre completo', emailLabel: 'Email',
    emailReadonly: 'El email no se puede cambiar',
    roleLabel: 'Rol', saveChanges: 'Guardar cambios',
    saveSuccess: 'Perfil guardado exitosamente',
    activitySection: 'Actividad de cuenta',
    emailField: 'Email', roleField: 'Rol',
    accountStatus: 'Estado', accountActive: 'Activo',

    // Telegram section
    telegramTitle: 'Telegram',
    telegramConnected: 'Conectado ✓', telegramDisconnected: 'Sin conectar',
    telegramActive: 'Activo', telegramInactive: 'Inactivo',
    telegramChatIdLabel: 'Tu Telegram Chat ID',
    telegramChatIdPlaceholder: 'Ej: 123456789',
    telegramChatIdHint: 'Los alertas del sistema llegarán a este chat.',
    telegramHowTo: '¿Cómo obtenerlo?',
    telegramConnectedStatus: 'Conectado', telegramNotConfigured: 'No configurado',
    saveTelegramId: 'Guardar Telegram ID',

    // Superadmin alerts
    systemAlertsTitle: 'Alertas de sistema (Superadmin)',
    systemAlertsDesc: 'Como superadmin, recibirás notificaciones de sistema en tu Telegram: errores críticos, tasa de error de IA elevada y resúmenes del estado de la plataforma. Asegúrate de tener tu Chat ID configurado.',
  },
} as const;

export const profileEN = {
  profile: {
    title: 'My Profile', subtitle: 'Account settings',
    section: 'Admin Panel',
    personalInfo: 'Personal information',
    fullName: 'Full name', emailLabel: 'Email',
    emailReadonly: 'Email cannot be changed',
    roleLabel: 'Role', saveChanges: 'Save changes',
    saveSuccess: 'Profile saved successfully',
    activitySection: 'Account activity',
    emailField: 'Email', roleField: 'Role',
    accountStatus: 'Status', accountActive: 'Active',

    telegramTitle: 'Telegram',
    telegramConnected: 'Connected ✓', telegramDisconnected: 'Not connected',
    telegramActive: 'Active', telegramInactive: 'Inactive',
    telegramChatIdLabel: 'Your Telegram Chat ID',
    telegramChatIdPlaceholder: 'E.g. 123456789',
    telegramChatIdHint: 'System alerts will be sent to this chat.',
    telegramHowTo: 'How to get it?',
    telegramConnectedStatus: 'Connected', telegramNotConfigured: 'Not configured',
    saveTelegramId: 'Save Telegram ID',

    systemAlertsTitle: 'System Alerts (Superadmin)',
    systemAlertsDesc: 'As superadmin, you will receive system notifications on Telegram: critical errors, high AI error rate, and platform status summaries. Make sure your Chat ID is configured.',
  },
} as const;

export const profileTranslations: Record<Locale, typeof profileES> = { es: profileES, en: profileEN };
