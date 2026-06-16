# NexusChat Frontend

React + TypeScript + Vite frontend for the ChatApplication Django backend.

## Requirements

- Node.js 20+
- npm
- Django backend running on `http://localhost:8000`

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Scripts

```bash
npm run dev      # start local dev server
npm run build    # type-check and create production build
npm run lint     # run ESLint
npm run preview  # preview production build
```

## Environment

The default `.env.example` points at the local Django backend:

- `VITE_API_BASE_URL`: REST API base URL
- `VITE_MEDIA_BASE_URL`: base URL for uploaded media
- `VITE_WS_BASE_URL`: WebSocket room base URL
