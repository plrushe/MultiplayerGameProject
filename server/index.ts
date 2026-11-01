import { createGameServer } from './app.js';
const port = Number(process.env.PORT || 3001);
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s=>s.trim());
const { http, io } = createGameServer(origins);
http.listen(port,'0.0.0.0',() => console.log(`World server listening on port ${port}`));
for(const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>io.close(()=>process.exit(0)));
