# TODO collaboration frontend

React + TypeScript frontend for the CHG-TODO-002 create-only TODO slice.

## Run locally

```bash
npm ci
npm run dev
```

The app sends `POST /todos` with the approved JSON request shape:

```json
{ "title": "Buy milk" }
```

Set `VITE_API_BASE_URL` when the API is not served from the same origin. For example:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

Created TODOs are held only in the current browser session; there is intentionally no read endpoint or reload recovery in this change.

## Verification

```bash
npm test -- --run
npm run lint
npm run typecheck
npm run build
```

The component suite uses MSW contract-shaped `POST /todos` responses and covers blank-title prevention, pending duplicate prevention, keyboard submit, successful session-list append, and error retry.
