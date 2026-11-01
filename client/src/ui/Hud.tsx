import { useState } from 'react';
import type { WorldState } from '../../../shared/types';
export function Hud({world,leave,locked}:{world:WorldState;leave:()=>void;locked:boolean}) {
  const [copy,setCopy]=useState('Copy code');
  async function copyCode(){try{await navigator.clipboard.writeText(world.code);setCopy('Copied!');}catch{setCopy('Select code to copy');}setTimeout(()=>setCopy('Copy code'),2500);}
  return <div className="hud"><div className="hud-top"><div className="world-title glass"><span className="brand-icon">⌘</span><div><strong>Common Ground</strong><small><i className="live-dot"/>{world.players.length} {world.players.length===1?'player':'players'} exploring</small></div></div><div className="session glass"><div><small>WORLD CODE</small><strong className="session-code">{world.code}</strong></div><button onClick={copyCode}>{copy}</button><button className="leave" onClick={leave}>Leave World ↗</button></div></div>
    {!locked&&<div className="lock-prompt"><span>◎</span><strong>You're in good company.</strong><p>Click the world to look around and explore.</p><small>Desktop keyboard and mouse required</small></div>}
    {locked&&<div className="crosshair" aria-hidden="true">·</div>}
    <div className="controls glass"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</span><span>Mouse Look</span><span><kbd>Shift</kbd> Sprint</span><span><kbd>Esc</kbd> Free cursor</span></div>
  </div>;
}
