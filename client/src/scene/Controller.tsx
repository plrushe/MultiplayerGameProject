import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { SPRINT_SPEED, WALK_SPEED, WORLD_LIMIT, type Movement, type Player } from '../../../shared/types';
import { PlayerModel } from './PlayerModel';
export function Controller({player,local,send,onLock}:{player:Player;local:RefObject<Movement>;send:(m:Movement)=>void;onLock:(locked:boolean)=>void}) {
  const model = useRef<Group>(null);
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const look = useRef({yaw:0,pitch:0.35});
  const elapsed = useRef(0);
  const initialized = useRef(false);
  const desired = useRef(new Vector3());
  const target = useRef(new Vector3());
  useEffect(()=>{
    const canvas = gl.domElement;
    const down = (e:KeyboardEvent) => { if(document.pointerLockElement===canvas) {if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)) e.preventDefault(); keys.current.add(e.code);} };
    const up = (e:KeyboardEvent) => keys.current.delete(e.code);
    const clear = () => keys.current.clear();
    const change = () => {clear();onLock(document.pointerLockElement===canvas);};
    const mouse = (e:MouseEvent) => {if(document.pointerLockElement===canvas){look.current.yaw-=e.movementX*0.0025;look.current.pitch=Math.max(-0.1,Math.min(1.1,look.current.pitch+e.movementY*0.0025));}};
    const lock = () => { if(document.pointerLockElement!==canvas) { const promise=canvas.requestPointerLock(); promise?.catch(()=>onLock(false)); } };
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);
    document.addEventListener('pointerlockchange',change);document.addEventListener('mousemove',mouse);canvas.addEventListener('click',lock);
    return ()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);document.removeEventListener('pointerlockchange',change);document.removeEventListener('mousemove',mouse);canvas.removeEventListener('click',lock);};
  },[gl,onLock]);
  useFrame((_,delta)=>{
    const dt=Math.min(delta,0.05);
    const p=local.current;
    const k=keys.current;
    let forward=Number(k.has('KeyW'))-Number(k.has('KeyS'));
    let side=Number(k.has('KeyD'))-Number(k.has('KeyA'));
    const length=Math.hypot(forward,side);
    const {yaw,pitch}=look.current;
    if(length){forward/=length;side/=length;const dx=side*Math.cos(yaw)-forward*Math.sin(yaw);const dz=-forward*Math.cos(yaw)-side*Math.sin(yaw);const speed=k.has('ShiftLeft')||k.has('ShiftRight') ? SPRINT_SPEED : WALK_SPEED;p.x=Math.max(-WORLD_LIMIT,Math.min(WORLD_LIMIT,p.x+dx*speed*dt));p.z=Math.max(-WORLD_LIMIT,Math.min(WORLD_LIMIT,p.z+dz*speed*dt));p.rotation=Math.atan2(-dx,-dz);}
    if(model.current){model.current.position.set(p.x,0,p.z);const diff=Math.atan2(Math.sin(p.rotation-model.current.rotation.y),Math.cos(p.rotation-model.current.rotation.y));model.current.rotation.y+=diff*(1-Math.exp(-18*dt));}
    const distance=6.5;
    desired.current.set(p.x+Math.sin(yaw)*Math.cos(pitch)*distance,1.3+Math.sin(pitch)*distance,p.z+Math.cos(yaw)*Math.cos(pitch)*distance);
    if(!initialized.current){camera.position.copy(desired.current);initialized.current=true;}else camera.position.lerp(desired.current,1-Math.exp(-10*dt));
    target.current.set(p.x,1.25,p.z);camera.lookAt(target.current);
    elapsed.current+=delta;if(elapsed.current>=1/15){elapsed.current=0;send({...p});}
  });
  return <group ref={model}><PlayerModel name={player.name} color={player.color} isLocal/></group>;
}
