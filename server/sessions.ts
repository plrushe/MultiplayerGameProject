import { randomInt } from 'node:crypto';
import { SPRINT_SPEED, WORLD_LIMIT, type Movement, type Player, type WorldState } from '../shared/types.js';
const COLORS = ['#ee795b','#527be7','#e6b839','#a574d4','#38a89a','#e579b0','#93b442','#db8740','#65acd2','#bd586e','#5aab74','#9383df'];
interface Member { player: Player; budget: number; lastMove: number }
interface Session { code: string; members: Map<string, Member>; nextColor: number }
export class Sessions {
  worlds = new Map<string, Session>();
  membership = new Map<string, string>();
  createCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    do { code = Array.from({ length: 6 }, () => chars[randomInt(chars.length)]).join(''); } while (this.worlds.has(code));
    return code;
  }
  join(id: string, rawName: unknown, rawCode?: unknown): WorldState {
    if (typeof rawName !== 'string' || !rawName.trim() || rawName.trim().length > 24) throw new Error('Enter a display name of 1–24 characters.');
    let world: Session;
    if (rawCode === undefined) {
      const code = this.createCode();
      world = { code, members: new Map(), nextColor: 0 };
    } else {
      if (typeof rawCode !== 'string' || !/^[a-z0-9]{6}$/i.test(rawCode.trim())) throw new Error('Enter a six-character world code.');
      const found = this.worlds.get(rawCode.trim().toUpperCase());
      if (!found) throw new Error('That world no longer exists. Check the code or create a new world.');
      world = found;
      if (world.members.size >= 32 && !world.members.has(id)) throw new Error('This world is full (32 players).');
    }
    this.leave(id);
    this.worlds.set(world.code, world);
    const index = world.nextColor++;
    const angle = index * 2.39996;
    const radius = 2 + Math.sqrt(index) * 1.5;
    world.members.set(id, { player: { id, name: rawName.trim(), color: (COLORS[index] ?? `hsl(${(index * 137.508) % 360}, 65%, 55%)`), x: Math.cos(angle)*radius, z: Math.sin(angle)*radius, rotation: 0 }, budget: 0.9, lastMove: performance.now() });
    this.membership.set(id, world.code);
    return this.state(world.code)!;
  }
  leave(id: string) {
    const code = this.membership.get(id);
    if (!code) return;
    const world = this.worlds.get(code)!;
    world.members.delete(id);
    this.membership.delete(id);
    if (!world.members.size) this.worlds.delete(code);
    return code;
  }
  state(code: string): WorldState | undefined {
    const world = this.worlds.get(code);
    return world && { code, players: [...world.members.values()].map(({player}) => ({...player})) };
  }
  move(id: string, input: unknown, now = performance.now()): Movement | undefined {
    const member = this.worlds.get(this.membership.get(id) ?? '')?.members.get(id);
    if (!member) return;
    const { player } = member;
    const reject = () => ({ x: player.x, z: player.z, rotation: player.rotation });
    if (!input || typeof input !== 'object') return reject();
    const {x,z,rotation} = input as Movement;
    if (![x,z,rotation].every(v => typeof v === 'number' && Number.isFinite(v)) || Math.abs(x)>WORLD_LIMIT || Math.abs(z)>WORLD_LIMIT || Math.abs(rotation)>Math.PI*2) return reject();
    member.budget = Math.min(0.9, member.budget + Math.max(0, now-member.lastMove)/1000 * SPRINT_SPEED);
    member.lastMove = now;
    const distance = Math.hypot(x-player.x,z-player.z);
    if (distance > member.budget + 0.001) return reject();
    member.budget -= distance;
    Object.assign(player, {x,z,rotation});
  }
}
