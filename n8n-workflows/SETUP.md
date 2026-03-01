# n8n Workflows — AI Lab Checklists

## Workflows incluidos

| Archivo | Nombre | Trigger |
|---|---|---|
| `01-checklist-reminders.json` | Recordatorios diarios | Cada hora |
| `02-telegram-responses.json` | Respuestas Telegram | Webhook (bot) |
| `03-weekly-feedback.json` | Feedback semanal IA | Domingo 20:00 |

---

## Paso 1: Crear el Bot de Telegram

1. Abre Telegram → busca **@BotFather**
2. Envía `/newbot` → elige un nombre y username
3. Guarda el **token** (ej. `1234567890:AABBcc...`)
4. En `apps/backend/.env`:
   ```
   TELEGRAM_BOT_TOKEN=1234567890:AABBcc...
   ```

---

## Paso 2: Importar workflows en n8n

1. Abre **http://localhost:5678**
2. Menú → **Workflows** → **Import from file**
3. Importa los 3 JSON en orden

---

## Paso 3: Configurar credenciales en n8n

### A) Backend Webhook Secret (httpHeaderAuth)
- Nombre: `Backend Webhook Secret`
- Header name: `x-webhook-secret`
- Header value: el mismo valor de `N8N_WEBHOOK_SECRET` de tu `.env`

### B) Telegram Bot
- Nombre: `Telegram Bot`
- Token: el token de @BotFather

---

## Paso 4: Variables de entorno en n8n

En n8n → **Settings → Environment Variables** agrega:
```
BACKEND_PUBLIC_URL = http://localhost:3001
```
> En producción usa tu dominio real.

---

## Paso 5: Activar los workflows

- **Workflow 01** (Reminders): activa el toggle ON
- **Workflow 02** (Responses): activa — n8n registra el webhook automáticamente en Telegram
- **Workflow 03** (Feedback): activa el toggle ON

---

## Cómo obtiene el usuario su Chat ID

1. El usuario abre Telegram y busca tu bot (`@TuBotUsername`)
2. Envía `/start`
3. El bot responde con su **Chat ID** (workflow 02 lo maneja)
4. El usuario lo copia y lo pega en su **Perfil** en AI Lab

---

## Flujo completo

```
[Cada hora]
n8n → GET /v1/checklists/reminders/due
     → Por cada tarea: Telegram inline keyboard
     → Usuario pulsa ✅ o ⏳
     → n8n → POST /v1/webhooks/telegram-response
     → Backend actualiza estado de la tarea

[Domingo 20:00]
n8n → GET /v1/checklists (activos)
     → POST /v1/checklists/:id/feedback (IA genera texto)
     → Telegram: envía el feedback al usuario
```
