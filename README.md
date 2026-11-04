# Clock Simulator

A large analog clock with play/pause, draggable hands, editable time, and fullscreen. No runtime dependencies or backend.

Choose 12-hour or 24-hour dials. The hour hand makes one revolution every 12 or 24 hours, including when dragging; switching preserves the selected time. Time entry uses the browser’s native time control.

Movement modes: deadbeat (1 step/second), 3Hz (6 steps/second), 4Hz (8 steps/second), and continuous (default). The mode selector is hidden with the other controls in fullscreen. The selected beat rate applies to all three hands.

The theme follows your system appearance until you choose light or dark with the header button. Your choice is saved in this browser and also applies in fullscreen.

## Local

`npm run dev` → http://localhost:4173

`npm test` checks time parsing, midnight wrapping, and drag angle continuity.

Pause to drag any hand or enter a time. Focus a hand and use arrow keys for accessible adjustment. Time advances from the selected time at normal speed. Fullscreen requires browser support.

Press F to toggle fullscreen and Space to play/pause, including in fullscreen. These shortcuts are inactive while editing a time or selecting a movement mode.

Static files live in `dist/`. GitHub Pages deploys them automatically on every push to `main`, after tests pass. The custom domain is `clock-simulator.lakekim.com`.

Icons use the bundled [Lucide](https://lucide.dev/) SVGs; license notices are in `dist/lucide-LICENSE.txt`.
