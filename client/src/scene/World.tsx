import { Suspense, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Group } from 'three';
import type { Movement, Player, WorldState } from '../../../shared/types';
import { Controller } from './Controller';
import { PlayerModel } from './PlayerModel';
function RemotePlayer({player}:{player:Player}) {
  const group=useRef<Group>(null);
  const spawn=useRef<[number,number,number]>([player.x,0,player.z]);
  useFrame((_,dt)=>{if(!group.current)return;const g=group.current;const a=1-Math.exp(-14*Math.min(dt,0.1));g.position.x+=(player.x-g.position.x)*a;g.position.z+=(player.z-g.position.z)*a;g.rotation.y+=Math.atan2(Math.sin(player.rotation-g.rotation.y),Math.cos(player.rotation-g.rotation.y))*a;});
  return <group ref={group} position={spawn.current}><PlayerModel name={player.name} color={player.color}/></group>;
}
export function World({world,playerId,local,send,onLock}:{world:WorldState;playerId:string;local:RefObject<Movement>;send:(m:Movement)=>void;onLock:(v:boolean)=>void}) {
  const me=world.players.find(p=>p.id===playerId);
  return <Canvas shadows camera={{position:[0,4,8],fov:55,near:0.1,far:700}} dpr={[1,1.75]} aria-label="Multiplayer 3D world">
    <color attach="background" args={['#b9dcf0']}/><fog attach="fog" args={['#b9dcf0',90,280]}/>
    <ambientLight intensity={1.5}/><directionalLight position={[30,60,20]} intensity={2} />
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[500,500]}/><meshStandardMaterial color="#95b68e" roughness={1}/></mesh>
    <Grid position={[0,0.006,0]} args={[500,500]} cellSize={2} sectionSize={10} cellColor="#769873" sectionColor="#638a68" cellThickness={0.5} sectionThickness={0.7} fadeDistance={100} fadeStrength={1}/>
    <Suspense fallback={null}>{me && <Controller player={me} local={local} send={send} onLock={onLock}/>} {world.players.filter(p=>p.id!==playerId).map(p=><RemotePlayer key={p.id} player={p}/>)}</Suspense>
  </Canvas>;
}
