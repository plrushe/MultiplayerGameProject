import { PlayerLabel } from './PlayerLabel';
export function PlayerModel({name,color,isLocal=false}:{name:string;color:string;isLocal?:boolean}) {
  return <>
    <mesh position={[0,0.745,0]} castShadow><capsuleGeometry args={[0.32,0.85,6,12]}/><meshStandardMaterial color={color} roughness={0.65}/></mesh>
    <mesh position={[-0.12,1.16,-0.29]}><sphereGeometry args={[0.045,8,8]}/><meshBasicMaterial color="#20352f"/></mesh>
    <mesh position={[0.12,1.16,-0.29]}><sphereGeometry args={[0.045,8,8]}/><meshBasicMaterial color="#20352f"/></mesh>
    <PlayerLabel text={`${name}${isLocal ? ' (you)' : ''}`}/>
  </>;
}
