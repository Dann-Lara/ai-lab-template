# n8n Workflows — AI Lab Checklists

## TL;DR — Todo automático

```bash
npm run setup        # instala deps, levanta Docker, migra BD, sincroniza n8n
```

Los 3 workflows se crean o actualizan automáticamente. Lo único manual es:
1. Crear el bot de Telegram
2. Agregar las credenciales en n8n UI

Para re-sincronizar después de editar un workflow JSON:
```bash
npm run n8n:sync
```

---

## Workflows incluidos

| Archivo | Nombre | Trigger | Auto-activa |
|---|---|---|---|
| `01-checklist-reminders.json` | Recordatorios | Cada hora | ✅ |
| `02-telegram-responses.json` | Respuestas Telegram | Bot webhook | ⚠️ requiere credenciales |
| `03-weekly-feedback.json` | Feedback semanal IA | Domingo 20:00 | ✅ |

---

## Paso 1: Crear el Bot de Telegram

1. Abre Telegram → busca **@BotFather**
2. Envía `/newbot` → elige nombre y username
3. Guarda el **token** (ej. `1234567890:AABBcc...`)
4. En `apps/backend/.env`:
   ```
   TELEGRAM_BOT_TOKEN=1234567890:AABBcc...
   TELEGRAM_BOT_USERNAME=TuBotUsername
   ```

---

## Paso 2: Crear API Key en n8n (para sincronización automática)

1. Abre **http://localhost:5678** → inicia sesión (admin / admin123)
2. Ve a **Settings → n8n API → Create API Key**
3. Copia la key y agrégala a `apps/backend/.env`:
   ```
   N8N_API_KEY=n8n_api_xxxxxxxxxxxxxxxx
   ```
4. Corre `npm run n8n:sync` — los workflows se crean/actualizan automáticamente

> Si no tienes API Key, el sync usa basic auth (N8N_USER + N8N_PASSWORD) como fallback.

---

## Paso 3: Agregar credenciales en n8n UI

Después del sync, los workflows están en n8n pero necesitan credenciales para funcionar.

### A) Backend Webhook Secret
1. n8n → **Credentials → New → HTTP Header Auth**
2. Nombre: `Backend Webhook Secret`
3. Name: `x-webhook-secret`
4. Value: el valor de `N8N_WEBHOOK_SECRET` en tu `.env`

### B) Telegram Bot
1. n8n → **Credentials → New → Telegram**
2. Nombre: `Telegram Bot`
3. Token: el token de @BotFather

---

## Paso 4: Activar el workflow de Telegram

El workflow `02-telegram-responses` no se activa automáticamente porque necesita las credenciales del bot primero. Una vez agregadas:

1. n8n → **Workflows → 02 - Telegram Responses**
2. Asigna `Telegram Bot` a los nodos de Telegram
3. Activa con el toggle **ON**
4. n8n registra automáticamente el webhook con la API de Telegram

---

## Variables de entorno necesarias

En `apps/backend/.env`:
```env
# n8n
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_SECRET=tu-secreto-seguro
N8N_API_KEY=n8n_api_xxxxxxxx       # para sync automático
N8N_USER=admin                      # fallback si no hay API Key
N8N_PASSWORD=admin123               # fallback si no hay API Key

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:AABBcc...
TELEGRAM_BOT_USERNAME=TuBotUsername
BACKEND_PUBLIC_URL=http://localhost:3001  # URL que n8n usa para llamar al backend
```

En `apps/frontend/.env.local`:
```env
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=TuBotUsername
```

---

## Cómo funciona el sync (`npm run n8n:sync`)

El script `scripts/sync-n8n-workflows.js`:

1. Lee todos los `.json` de `n8n-workflows/` ordenados alfabéticamente
2. Por cada workflow busca si ya existe en n8n (por nombre exacto)
3. Si existe → `PUT /api/v1/workflows/:id` (actualiza)
4. Si no existe → `POST /api/v1/workflows` (crea)
5. Si el trigger NO es webhook/Telegram → activa automáticamente
6. Si tiene trigger de Telegram → avisa que hay que activar manualmente

**Idempotente**: seguro ejecutar varias veces.

---

## Flujo completo en producción

```
[Cada hora]
n8n scheduler
  → GET /v1/checklists/reminders/due    (x-webhook-secret)
  → Por cada tarea con telegramChatId:
    Telegram: mensaje con botones ✅ ⏳
  → PATCH item.reminderSent = true

[Usuario responde en Telegram]
Bot → n8n webhook trigger
  → Parse callback "complete:itemId" o "postpone:itemId"
  → POST /v1/webhooks/telegram-response (x-webhook-secret)
  → Backend actualiza estado de la tarea
  → n8n responde al usuario con confirmación

[Domingo 20:00]
n8n scheduler
  → GET /v1/checklists (activos)
  → Por cada checklist con telegramChatId:
    POST /v1/checklists/:id/feedback    → IA genera texto
    Telegram: envía feedback al usuario
```
