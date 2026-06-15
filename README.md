# Founders · Planificador de contenido

Herramienta interna para planificar contenido de redes sociales de **Founders / Vicky Becci**.  
Notion como backend, tablero semanal con drag & drop, y generación de captions con Claude IA.

---

## Setup rápido

### 1. Crear la integración de Notion

1. Ir a [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration**
2. Darle un nombre (ej: "Founders Contenido"), seleccionar el workspace
3. Copiar el **Internal Integration Token** → esto es tu `NOTION_API_KEY`
4. Abrir la base de datos de contenido en Notion
5. Click en `···` (arriba a la derecha) → **Add connections** → buscar la integración y agregarla

### 2. Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```env
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=6cad5775bc354a3cbacce58dada01770
NOTION_DATA_SOURCE_ID=24201b34-ecd4-4539-9d8f-e5773878de18
APP_PASSWORD=tu_contraseña_aquí
ANTHROPIC_API_KEY=sk-ant-xxxxxxx   # solo si querés generar captions con IA
```

> El `NOTION_DATABASE_ID` es el UUID que aparece en la URL de la base: `notion.so/<workspace>/<DATABASE_ID>?v=...`

### 3. Correr en desarrollo

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) y entrá con la contraseña configurada.

---

## Deploy en Vercel

1. Hacer push al repositorio en GitHub
2. Crear un proyecto en [vercel.com](https://vercel.com) conectado al repo
3. Agregar las variables de entorno en **Settings → Environment Variables**
4. Deploy automático en cada push a `main`

---

## Esquema de la base de Notion

La base debe tener estas propiedades con estos nombres exactos:

| Propiedad | Tipo | Opciones |
|---|---|---|
| `Título` | title | — |
| `Canal` | select | IG Founders, IG Vicky, LinkedIn, TikTok |
| `Formato` | select | Reel, Carrusel, Imagen/Post, Video, Texto, Story, Recorte, Testimonio |
| `Estado` | select | Idea, En producción, Listo, Programado, Publicado |
| `Pilar` | select | Claridad y decisión, Mentiras que te contás, Miedo / prudencia, Posicionamiento, Tu historia, Evolución |
| `Fecha` | date | con hora habilitada |
| `Caption` | rich_text | — |
| `Hashtags` | rich_text | — |
| `Link material` | url | — |
| `Link publicado` | url | — |
| `Notas` | rich_text | — |

---

## Features

- **Tablero semanal** con canales en filas y días en columnas. Drag & drop con mouse y touch.
- **Métricas de la semana**: cantidad por canal, barra de progreso de piezas completas.
- **Filtros**: por canal, estado, pilar, y búsqueda de texto.
- **Vistas alternativas**: kanban por estado (con drag & drop), lista por canal.
- **Editor lateral**: todos los campos, contador de caracteres por red social.
- **Generación de captions** con Claude IA (requiere `ANTHROPIC_API_KEY`).
- **Duplicar a otro canal**: copia el post a otro canal con estado "Idea".
- Responsive hasta mobile. Soporte de teclado. `prefers-reduced-motion`.

---

## Decisiones de diseño

- El login es por contraseña simple (cookie httpOnly). Para una herramienta de 2 usuarias internas es suficiente; si se escala, agregar auth con NextAuth.
- Los filtros de canal/estado/pilar filtran todas las vistas (tablero, kanban, por canal). Las métricas reflejan solo los posts de la semana visible.
- "Completo" = estado Listo, Programado o Publicado. Idea y En producción no cuentan.
- La generación de captions usa `claude-haiku-4-5-20251001` por velocidad y costo. Se puede cambiar a `claude-sonnet-4-6` en `app/api/captions/route.ts` para mayor calidad.
- Para Notion, el rate limit es ~3 req/s. Con 1-2 usuarias simultáneas no debería ser un problema. Si escala, agregar retry con backoff en `lib/notion.ts`.
