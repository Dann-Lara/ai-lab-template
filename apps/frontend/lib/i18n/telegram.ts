import type { Locale } from './types';

export const telegramES = {
  telegram: {
    // Modal title & subtitle
    modalTitle: '¿Cómo obtengo mi Chat ID?',
    modalSubtitle: 'Telegram · 5 pasos',

    // Steps
    step1Title: 'Abre Telegram',
    step1Desc: 'En tu teléfono o en telegram.org desde el navegador.',
    step2Title: 'Busca el bot',
    step2Desc: 'En el buscador escribe el nombre de nuestro bot y ábreplo.',
    step2BotLabel: 'Nombre del bot:',
    step3Title: 'Envía /start',
    step3Desc: 'Escribe /start y envíalo. El bot responderá con tu Chat ID.',
    step4Title: 'Copia el número',
    step4Desc: 'El bot te mostrará un número como 123456789. Cópialo.',
    step5Title: 'Pégalo aquí',
    step5Desc: 'Pega el número en el campo "Tu Telegram Chat ID" y guarda.',

    // UI
    previewTitle: 'Vista previa de la respuesta del bot',
    previewGreeting: '¡Hola! Soy el bot de AI Lab.',
    previewChatIdLabel: 'Tu Telegram Chat ID es:',
    previewHint: 'Cópialo y pégalo en tu perfil 🔔',
    confirmBtn: 'Entendido, ya sé cómo obtenerlo',
  },
} as const;

export const telegramEN = {
  telegram: {
    modalTitle: 'How do I get my Chat ID?',
    modalSubtitle: 'Telegram · 5 steps',

    step1Title: 'Open Telegram',
    step1Desc: 'On your phone or at telegram.org in the browser.',
    step2Title: 'Search for the bot',
    step2Desc: 'In the search bar type the name of our bot and open it.',
    step2BotLabel: 'Bot name:',
    step3Title: 'Send /start',
    step3Desc: 'Type /start and send it. The bot will reply with your Chat ID.',
    step4Title: 'Copy the number',
    step4Desc: 'The bot will show you a number like 123456789. Copy it.',
    step5Title: 'Paste it here',
    step5Desc: 'Paste the number in the "Your Telegram Chat ID" field and save.',

    previewTitle: 'Bot response preview',
    previewGreeting: 'Hi! I am the AI Lab bot.',
    previewChatIdLabel: 'Your Telegram Chat ID is:',
    previewHint: 'Copy and paste it in your profile 🔔',
    confirmBtn: 'Got it, I know how to get it',
  },
} as const;

export const telegramTranslations: Record<Locale, typeof telegramES> = { es: telegramES, en: telegramEN };
