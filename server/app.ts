import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Sessions } from './sessions.js';
import type { ClientEvents, ServerEvents } from '../shared/types.js';
export function createGameServer(origins = ['http://localhost:5173']) {
  const app = express();
  app.get('/health', (_req,res) => res.json({ status: 'ok' }));
  const http = createServer(app);
  const io = new Server<ClientEvents, ServerEvents>(http, { cors: { origin: origins }, maxHttpBufferSize: 4096 });
  const sessions = new Sessions();
  const broadcast = (code?: string) => { if (code) { const state = sessions.state(code); if (state) io.to(code).emit('world:state',state); } };
  io.on('connection', socket => {
    let lastJoin = -Infinity;
    let correctionAt = -Infinity;
    const join = (name: unknown, code: unknown, reply: unknown) => {
      if (typeof reply !== 'function') return;
      if (performance.now()-lastJoin < 500) return reply({ok:false,error:'Please wait a moment before trying again.'});
      lastJoin = performance.now();
      const old = sessions.membership.get(socket.id);
      try {
        const state = sessions.join(socket.id,name,code);
        if (old) socket.leave(old);
        socket.join(state.code);
        reply({ok:true,world:state,playerId:socket.id});
        broadcast(old); broadcast(state.code);
      } catch(error) { reply({ok:false,error:error instanceof Error ? error.message : 'Unable to join world.'}); }
    };
    socket.on('world:create',(name,reply) => join(name,undefined,reply));
    socket.on('world:join',(data,reply) => { if(typeof data?.code!=='string') { if(typeof reply==='function') reply({ok:false,error:'Enter a six-character world code.'}); return; } join(data?.name,data.code,reply); });
    const leave = () => { const old = sessions.leave(socket.id); if(old) socket.leave(old); broadcast(old); };
    socket.on('world:leave',reply => { leave(); if(typeof reply==='function') reply(); });
    socket.on('disconnect',leave);
    socket.on('player:move',movement => { const correction = sessions.move(socket.id,movement); if(correction && performance.now()-correctionAt>100) { correctionAt=performance.now(); socket.emit('player:correct',correction); } });
  });
  const timer = setInterval(() => { for (const code of sessions.worlds.keys()) broadcast(code); }, 66);
  timer.unref();
  http.on('close',() => clearInterval(timer));
  return { app, http, io, sessions };
}
