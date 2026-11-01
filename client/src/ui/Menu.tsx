import { useState } from 'react';
interface Props { connected:boolean;pending:boolean;error:string;enter:(name:string,code?:string)=>void }
export function Menu({connected,pending,error,enter}:Props) {
  const [name,setName]=useState(()=>localStorage.getItem('world-name') || '');
  const [code,setCode]=useState('');
  const [mode,setMode]=useState<'create'|'join'>('create');
  return <main className="menu-shell"><div className="landscape" aria-hidden="true"><div className="sun"/><div className="horizon"/><div className="avatar a1"/><div className="avatar a2"/><div className="avatar a3"/><span className="scene-label">A LITTLE SPACE. A LOT OF POSSIBILITY.</span></div>
    <header className="brand"><span className="brand-icon">⌘</span> COMMON GROUND <span className="edition">MULTIPLAYER SANDBOX / 001</span></header>
    <section className="intro"><div className="eyebrow"><span/> YOUR NEXT SHARED ADVENTURE</div><h1>A world of<br/><em>your own.</em></h1><p>Find your people. Make some room.<br/>A simple, open world to explore together.</p><div className="features"><span>↗ Instant worlds</span><span>◉ Real-time multiplayer</span><span>◇ No sign-up</span></div></section>
    <section className="menu-card"><div className="card-top"><span className="mini-label">STEP INTO SOMETHING NEW</span><span className={`status ${connected?'online':''}`}><i/>{connected?'Server online':'Connecting…'}</span></div><h2>Start your adventure</h2><p className="muted">Every great world starts with a hello.</p>
      <form onSubmit={e=>{e.preventDefault();localStorage.setItem('world-name',name.trim());enter(name,mode==='join'?code:undefined);}}>
        <label htmlFor="display-name">Your display name</label><input id="display-name" value={name} onChange={e=>setName(e.target.value)} maxLength={24} placeholder="What should we call you?" required autoComplete="nickname"/>
        <div className="tabs" role="tablist" aria-label="World action"><button type="button" role="tab" aria-selected={mode==='create'} onClick={()=>setMode('create')}>＋ Create World</button><button type="button" role="tab" aria-selected={mode==='join'} onClick={()=>setMode('join')}>↗ Join World</button></div>
        {mode==='join' ? <div className="code-entry"><label htmlFor="world-code">World code</label><input id="world-code" className="code-input" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} minLength={6} pattern="[A-Za-z0-9]{6}" required autoComplete="off"/><p className="hint">Ask a friend for their six-character code.</p></div> : <div className="create-description"><span>◎</span><p><strong>A fresh start, together.</strong><br/>Create a world and invite friends with a unique code.</p></div>}
        {error && <p className="error" role="alert">{error}</p>}<button className="primary" disabled={!connected||pending} type="submit">{pending?'Opening your world…':mode==='create'?'Create World':'Join World'} <span>→</span></button>
      </form><p className="card-footer">Free to explore. Better with friends.</p>
    </section><footer className="page-footer"><span>A SHARED SPACE, WITHOUT THE NOISE.</span><span>Built for the joy of being together. ✳</span></footer>
  </main>;
}
