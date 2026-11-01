import { Component, useState, type ReactNode } from 'react';
import { useMultiplayer } from './network/useMultiplayer';
import { World } from './scene/World';
import { Menu } from './ui/Menu';
import { Hud } from './ui/Hud';
class SceneBoundary extends Component<{children:ReactNode;leave:()=>void},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed ? <div className="scene-error"><h2>Unable to display the 3D world</h2><p>Enable WebGL and hardware acceleration, then try again.</p><button onClick={this.props.leave}>Back to menu</button></div> : this.props.children;}
}
export default function App(){
  const game=useMultiplayer();
  const [locked,setLocked]=useState(false);
  if(!game.world) return <Menu {...game}/>;
  const leave=()=>{setLocked(false);game.leave();};
  return <div className="game"><SceneBoundary leave={leave}><World world={game.world} playerId={game.playerId} local={game.local} send={game.send} onLock={setLocked}/></SceneBoundary><Hud world={game.world} leave={leave} locked={locked}/></div>;
}
