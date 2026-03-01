import type { Locale } from './types';

export interface CommonMessages {
  appName: string; loading: string; error: string; retry: string;
  darkMode: string; lightMode: string; save: string; saving: string;
  saved: string; cancel: string; confirm: string; delete: string;
  edit: string; close: string; back: string; next: string;
  yes: string; no: string; or: string; required: string;
  copyCommand: string; copied: string;
}

export interface NavMessages {
  home: string; dashboard: string; features: string; stack: string;
  docs: string; login: string; signup: string; logout: string;
  adminPanel: string; clientPanel: string; users: string;
  checklist: string; profile: string;
}

export interface FooterMessages {
  description: string; navTitle: string; stackTitle: string;
  statusTitle: string; statusMsg: string; location: string;
  rights: string; madeWith: string;
}

export const commonES = {
  common: {
    appName: 'AI Lab', loading: 'Cargando...', error: 'Error',
    retry: 'Reintentar', darkMode: 'Modo oscuro', lightMode: 'Modo claro',
    save: 'Guardar', saving: 'Guardando...', saved: 'Guardado',
    cancel: 'Cancelar', confirm: 'Confirmar', delete: 'Eliminar',
    edit: 'Editar', close: 'Cerrar', back: 'Volver', next: 'Siguiente',
    yes: 'Sí', no: 'No', or: 'o', required: 'Requerido',
    copyCommand: 'Copiar', copied: 'Copiado',
  },
  nav: {
    home: 'Inicio', dashboard: 'Panel', features: 'Funciones',
    stack: 'Stack', docs: 'Docs', login: 'Entrar', signup: 'Registrarse',
    logout: 'Salir', adminPanel: 'Panel Admin', clientPanel: 'Panel Cliente',
    users: 'Usuarios', checklist: 'Checklists', profile: 'Perfil',
  },
  footer: {
    description: 'Monorepo fullstack con IA, auth robusto y automatización. Listo para producción.',
    navTitle: 'Navegación', stackTitle: 'Stack', statusTitle: 'Estado',
    statusMsg: 'Sistema operativo', location: 'Dev · Local',
    rights: 'Todos los derechos reservados', madeWith: 'Construido con',
  },
} as const;

export const commonEN = {
  common: {
    appName: 'AI Lab', loading: 'Loading...', error: 'Error',
    retry: 'Retry', darkMode: 'Dark mode', lightMode: 'Light mode',
    save: 'Save', saving: 'Saving...', saved: 'Saved',
    cancel: 'Cancel', confirm: 'Confirm', delete: 'Delete',
    edit: 'Edit', close: 'Close', back: 'Back', next: 'Next',
    yes: 'Yes', no: 'No', or: 'or', required: 'Required',
    copyCommand: 'Copy', copied: 'Copied',
  },
  nav: {
    home: 'Home', dashboard: 'Dashboard', features: 'Features',
    stack: 'Stack', docs: 'Docs', login: 'Sign In', signup: 'Sign Up',
    logout: 'Sign Out', adminPanel: 'Admin Panel', clientPanel: 'Client Panel',
    users: 'Users', checklist: 'Checklists', profile: 'Profile',
  },
  footer: {
    description: 'Fullstack monorepo with AI, robust auth and automation. Production-ready.',
    navTitle: 'Navigation', stackTitle: 'Stack', statusTitle: 'Status',
    statusMsg: 'System operational', location: 'Dev · Local',
    rights: 'All rights reserved', madeWith: 'Built with',
  },
} as const;

export const commonTranslations: Record<Locale, typeof commonES> = { es: commonES, en: commonEN };
