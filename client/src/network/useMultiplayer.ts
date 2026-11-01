import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ClientEvents, JoinResult, Movement, ServerEvents, WorldState } from '../../../shared/types';
export function useMultiplayer() {
  const socket = useRef<Socket<ServerEvents, ClientEvents> | null>(null);
  const [world,setWorld] = useState<WorldState | null>(null);
  const [playerId,setPlayerId] = useState('');
  const [connected,setConnected] = useState(false);
  const [pending,setPending] = useState(false);
  const [error,setError] = useState('');
  const local = useRef<Movement>({x:0,z:0,rotation:0});
  const active = useRef(false);
  useEffect(() => {
    const client: Socket<ServerEvents,ClientEvents> = io(import.meta.env.VITE_SERVER_URL || undefined, { autoConnect:true });
    socket.current = client;
    client.on('connect',()=>{setConnected(true);setError('');});
    client.on('connect_error',()=>setError('Cannot reach the world server. Check your connection and try again.'));
    client.on('disconnect',()=>{setConnected(false);setPending(false);setWorld(null);active.current=false;setError('Connection lost. Rejoin your world when connected.');document.exitPointerLock?.();});
    client.on('world:state',state=>{if(active.current) setWorld(state);});
    client.on('player:correct',movement=>Object.assign(local.current,movement));
    return () => { active.current=false;client.disconnect();socket.current=null; };
  },[]);
  const enter = (name: string, code?: string) => {
    const client = socket.current;
    if(!client?.connected || pending) return;
    setPending(true);setError('');
    const done = (err: Error | null, result: JoinResult) => {
      setPending(false);
      if(err) {setError('The server did not respond. Please try again.');return;}
      if(!result.ok) {setError(result.error);return;}
      const me = result.world.players.find(p=>p.id===result.playerId)!;
      Object.assign(local.current,{x:me.x,z:me.z,rotation:me.rotation});
      active.current=true;setPlayerId(result.playerId);setWorld(result.world);
    };
    if(code===undefined) client.timeout(5000).emit('world:create',name,done);
    else client.timeout(5000).emit('world:join',{name,code},done);
  };
  const leave = () => {
    // The server processes leave before subsequent join events on this connection.
    socket.current?.emit('world:leave',()=>{});
    active.current=false;setWorld(null);document.exitPointerLock?.();
  };
  const send = (movement: Movement) => socket.current?.volatile.emit('player:move',movement);
  return {world,playerId,connected,pending,error,enter,leave,local,send};
}
