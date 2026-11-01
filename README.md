# Common Ground

A minimal multiplayer 3D browser world. React, TypeScript, Vite, React Three Fiber / Three.js and drei on the client; Express and Socket.IO on a persistent Node server. No accounts, database, paid services, or external models. All session data is in memory.

## Run locally

Requires Node.js 22.12+ (tested with Node 24) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Enter a display name and choose **Create World**. Copy the six-character code, open another browser tab, and choose **Join World** using a different name. Codes are case-insensitive. Up to 32 players can join each world. Empty worlds disappear; restarting the backend clears all worlds.

Click the 3D view to capture the mouse. **WASD** moves relative to the camera, **mouse** rotates the camera, **Shift** sprints, and **Esc** frees the cursor so you can copy the code or leave. Desktop keyboard, mouse, and WebGL are required. Pointer lock requires localhost or HTTPS on most browsers.

For another computer on your network, open `http://<host-LAN-IP>:5173` (allow port 5173 through your firewall). The default same-origin Vite proxy forwards Socket.IO traffic to port 3001; no client address configuration is necessary. Use HTTPS for pointer lock away from localhost.

## Checks

```sh
npm test
npm run build
```

Tests use actual Socket.IO connections to an ephemeral local server: ten-player membership, case-insensitive codes, initial state, movement and orientation, invalid codes, server corrections, room isolation, disconnect removal and empty-room cleanup. Unit checks cover nonfinite/out-of-bounds movement and speed budget exhaustion. Manually verify two tabs can independently move and look around, then create a separate world and verify isolation.

For the browser smoke test (two tabs, avatar labels, clipboard, pointer lock, independent movement, and leaving):

```sh
npx playwright install chromium
npm run test:browser
```

The browser runner starts development servers automatically if needed. To use an existing system Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. The cloud checks used that option with software WebGL rendering.

## Configuration and deployment

- `PORT`: backend port (default `3001`), listening on `0.0.0.0`.
- `CLIENT_ORIGIN`: comma-separated frontend origins allowed by Socket.IO CORS (defaults to localhost and 127.0.0.1 on port 5173). Set exact production frontend origin(s), not a wildcard.
- `VITE_SERVER_URL`: frontend build-time backend URL. Leave unset in local development to use Vite's `/socket.io` HTTP/WebSocket proxy. For separate production frontend/backend hosts, set this before building.

Vite reads root variables from `client/.env.local`, or export them in the shell. The backend reads process variables; export them before `npm run dev` / `npm start` (it does not automatically load `.env`). `.env.example` documents the options; never commit secret values.

`npm run build` creates `dist/client` (static frontend) and `dist/server` + `dist/shared` (Node ESM). Serve the static frontend with any static host, and run `npm start` for the independently deployed backend. The backend does not serve frontend files. It must run on a host supporting long-lived Socket.IO connections; a serverless frontend host alone is insufficient. Terminate HTTPS at your reverse proxy and forward `/socket.io` including WebSocket upgrades. `/health` returns `{"status":"ok"}`. Install runtime npm dependencies on the backend host. A single backend process owns all sessions; multiple replicas require shared state and a Socket.IO adapter, outside this MVP.

## Architecture

- `shared/types.ts`: wire contracts, movement speeds and world bounds.
- `server/sessions.ts`: unique codes, authoritative membership/state, spawn allocation and movement validation.
- `server/app.ts`: Express health endpoint and room-scoped Socket.IO events; 15 Hz snapshots.
- `client/src/network`: connection lifecycle, session requests, corrections and local state.
- `client/src/scene`: flat world, replaceable geometric avatars, input/camera controller and remote interpolation.
- `client/src/ui`: menu and in-game overlay.

The client predicts local movement immediately and sends at 15 Hz. Remote snapshots interpolate exponentially, with shortest-arc rotation. The server bounds coordinates to ±240 units and uses a replenishing movement budget capped at 0.9 units at a maximum 9 units/second; invalid movements trigger authoritative corrections. This tolerates modest network jitter, but is an MVP validation layer rather than full cheat prevention. Background-tab keys clear on blur. Disconnections return to the menu; reconnecting requires rejoining, and the last player leaving deletes the code.
