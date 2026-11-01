import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
// Keep the DOM label outside the Three reconciler. Its position follows the
// avatar's world transform, without rerendering React on every animation frame.
export function PlayerLabel({text}:{text:string}) {
  const anchor=useRef<Group>(null);
  const element=useRef<HTMLDivElement | null>(null);
  const point=useRef(new Vector3());
  const {gl,camera}=useThree();
  useEffect(()=>{
    const div=document.createElement('div');
    div.className='player-label';div.textContent=text;
    Object.assign(div.style,{position:'absolute',top:'0',left:'0',pointerEvents:'none',transformOrigin:'center',visibility:'hidden'});
    gl.domElement.parentElement!.appendChild(div);element.current=div;
    return ()=>{div.remove();element.current=null;};
  },[gl,text]);
  useFrame(()=>{
    if(!anchor.current||!element.current)return;
    anchor.current.getWorldPosition(point.current);
    const distance=camera.position.distanceTo(point.current);
    point.current.project(camera);
    const p=point.current,div=element.current;
    div.style.visibility=p.z < 1 && p.z > -1 && Math.abs(p.x)<1.2 && Math.abs(p.y)<1.2 ? 'visible':'hidden';
    div.style.transform=`translate(-50%,-50%) translate(${(p.x+1)*gl.domElement.clientWidth/2}px,${(1-p.y)*gl.domElement.clientHeight/2}px) scale(${Math.max(0.6,Math.min(1.4,8/distance))})`;
  });
  return <group ref={anchor} position={[0,1.85,0]}/>;
}
