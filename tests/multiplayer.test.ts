import { test } from 'node:test';
import assert from 'node:assert/strict';
import { io, type Socket } from 'socket.io-client';
import { createGameServer } from '../server/app.js';
import { Sessions } from '../server/sessions.js';
import type { ClientEvents, ServerEvents, WorldState, JoinResult } from '../shared/types.js';

test('movement validation rejects malformed data, teleporting, and sustained excess speed',()=>{
  const sessions=new Sessions();
  const state=sessions.join('one','Alice');
  const p=state.players[0];
  for(const bad of [null,{}, {x:NaN,z:0,rotation:0},{x:0,z:Infinity,rotation:0},{x:241,z:0,rotation:0},{x:0,z:0,rotation:1e9},{x:'0',z:0,rotation:0}, {x:p.x+100,z:p.z,rotation:0}]) assert.ok(sessions.move('one',bad));
  const now=performance.now();
  assert.equal(sessions.move('one',{x:p.x+0.5,z:p.z,rotation:1},now),undefined);
  assert.ok(sessions.move('one',{x:p.x+1,z:p.z,rotation:1},now));
  assert.equal(sessions.move('one',{x:p.x+1,z:p.z,rotation:1},now+100),undefined);
  assert.equal(sessions.state(state.code)!.players[0].x,p.x+1);
  sessions.leave('one');assert.equal(sessions.worlds.size,0);
});

test('real Socket.IO clients create, join, synchronize, isolate, disconnect and clean up',async t=>{
  const game=createGameServer();
  await new Promise<void>(resolve=>game.http.listen(0,'127.0.0.1',resolve));
  const address=game.http.address();assert.ok(address&&typeof address!=='string');
  const port=address.port;
  const sockets:Socket<ServerEvents,ClientEvents>[]=[];
  t.after(async()=>{sockets.forEach(s=>s.disconnect());await new Promise<void>(resolve=>game.io.close(()=>resolve()));});
  async function connect(){const s:Socket<ServerEvents,ClientEvents>=io(`http://127.0.0.1:${port}`,{transports:['websocket'],forceNew:true,reconnection:false});sockets.push(s);await new Promise<void>((resolve,reject)=>{s.once('connect',resolve);s.once('connect_error',reject);});return s;}
  const create=(s:Socket<ServerEvents,ClientEvents>,name:string)=>new Promise<JoinResult>(resolve=>s.emit('world:create',name,resolve));
  const join=(s:Socket<ServerEvents,ClientEvents>,name:string,code:string)=>new Promise<JoinResult>(resolve=>s.emit('world:join',{name,code},resolve));
  function waitState(s:Socket<ServerEvents,ClientEvents>,predicate:(state:WorldState)=>boolean){return new Promise<WorldState>((resolve,reject)=>{const timeout=setTimeout(()=>{s.off('world:state',listener);reject(new Error('Timed out waiting for world state'));},3000);const listener=(state:WorldState)=>{if(predicate(state)){clearTimeout(timeout);s.off('world:state',listener);resolve(state);}};s.on('world:state',listener);});}
  const host=await connect();
  const created=await create(host,'Alice');assert.ok(created.ok);assert.match(created.world.code,/^[A-Z0-9]{6}$/);
  const {code}=created.world;
  const clients=[];
  for(let i=0;i<9;i++){const client=await connect();clients.push(client);const result=await join(client,`Guest ${i}`,code.toLowerCase());assert.ok(result.ok);assert.equal(result.world.players.length,i+2);}
  const full=await waitState(host,s=>s.players.length===10);
  assert.equal(new Set(full.players.map(p=>p.color)).size,10);
  const other=await connect();const separate=await create(other,'Solo');assert.ok(separate.ok);assert.notEqual(separate.world.code,code);
  const isolated=await waitState(other,s=>s.players.length===1);assert.equal(isolated.players[0].name,'Solo');
  const invalid=await connect();const failure=await join(invalid,'Invalid','!!!!!!');assert.equal(failure.ok,false);
  const missing=await connect();const missingResult=await join(missing,'Missing','ZZZZZZ');assert.equal(missingResult.ok,false);
  const p=full.players.find(p=>p.id===host.id)!;
  const movement=waitState(clients[0],s=>s.players.some(v=>v.id===host.id&&v.x===p.x+0.25&&v.rotation===1));
  host.emit('player:move',{x:p.x+0.25,z:p.z,rotation:1});await movement;
  const corrected=new Promise<void>(resolve=>host.once('player:correct',state=>{assert.equal(state.x,p.x+0.25);resolve();}));
  host.emit('player:move',{x:200,z:200,rotation:0});await corrected;
  const gone=waitState(host,s=>s.players.length===9);clients[0].disconnect();await gone;
  assert.equal(game.sessions.state(separate.world.code)!.players.length,1);
  const left=new Promise<void>(resolve=>other.emit('world:leave',resolve));await left;assert.equal(game.sessions.worlds.has(separate.world.code),false);
  host.disconnect();clients.slice(1).forEach(s=>s.disconnect());
  await new Promise(resolve=>setTimeout(resolve,100));assert.equal(game.sessions.worlds.size,0);
});
