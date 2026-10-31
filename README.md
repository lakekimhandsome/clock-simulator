# Clock Simulator

A large analog clock with play/pause, draggable hands, editable time, and fullscreen. No runtime dependencies or backend.

Movement modes: deadbeat (1 step/second), 3Hz (6 steps/second), 4Hz (8 steps/second), and continuous (default). The mode selector is hidden with the other controls in fullscreen. The selected beat rate applies to all three hands.

## Local

`npm run dev` → http://localhost:4173

`npm test` checks time parsing, midnight wrapping, and drag angle continuity.

Pause to drag any hand or enter a time. Focus a hand and use arrow keys for accessible adjustment. Time advances from the selected time at normal speed. Fullscreen requires browser support.

Press F to toggle fullscreen and Space to play/pause, including in fullscreen. These shortcuts are inactive while editing a time or selecting a movement mode.

Static files live in `dist/`. GitHub Pages deploys them automatically on every push to `main`, after tests pass. The custom domain is `clock-simulator.lakekim.com`.
