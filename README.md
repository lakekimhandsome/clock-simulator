# Clock Simulator

A large analog clock with play/pause, draggable hands, editable time, and fullscreen. No runtime dependencies or backend.

## Local

`npm run dev` → http://localhost:4173

`npm test` checks time parsing, midnight wrapping, and drag angle continuity.

Pause to drag any hand or enter a time. Focus a hand and use arrow keys for accessible adjustment. Time advances from the selected time at normal speed. Fullscreen requires browser support.

Static files live in `dist/`. GitHub Pages deploys them automatically on every push to `main`, after tests pass. The custom domain is `clock-simulator.lakekim.com`.
