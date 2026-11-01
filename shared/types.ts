export const WORLD_LIMIT = 240;
export const WALK_SPEED = 5;
export const SPRINT_SPEED = 9;
export interface Movement { x: number; z: number; rotation: number }
export interface Player extends Movement { id: string; name: string; color: string }
export interface WorldState { code: string; players: Player[] }
export type JoinResult = { ok: true; world: WorldState; playerId: string } | { ok: false; error: string };
export interface ClientEvents {
  'world:create': (name: string, reply: (result: JoinResult) => void) => void;
  'world:join': (data: { name: string; code: string }, reply: (result: JoinResult) => void) => void;
  'world:leave': (reply: () => void) => void;
  'player:move': (movement: Movement) => void;
}
export interface ServerEvents {
  'world:state': (state: WorldState) => void;
  'player:correct': (movement: Movement) => void;
}
