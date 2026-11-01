import { test, expect } from '@playwright/test';
import { io } from 'socket.io-client';
import type { WorldState, JoinResult } from '../../shared/types';

test('two browser tabs render avatars, move independently, copy codes and leave',async({page,context})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>{errors.push(error.message);console.log('PAGE ERROR',error.message);});
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Create World',exact:false}).last()).toBeEnabled();
  await page.getByLabel('Your display name').fill('Alice');
  await page.screenshot({path:'/tmp/common-ground-menu.png'});
  await page.getByRole('button',{name:'Create World',exact:false}).last().click();
  const code=await page.locator('.session-code').textContent();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
  await expect(page.locator('.player-label')).toContainText('Alice');
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.getByRole('button',{name:'Copy code',exact:true}).click();
  await expect(page.getByRole('button',{name:'Copied!',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(code);
  const second=await context.newPage();
  second.on('pageerror',error=>errors.push(error.message));
  await second.goto('/');
  await second.getByLabel('Your display name').fill('Bob');
  await second.getByRole('tab',{name:'Join World',exact:false}).click();
  await second.getByLabel('World code').fill('!!!!!!');
  // A syntactically valid but nonexistent code exercises the server error UI.
  await second.getByLabel('World code').fill('ZZZZZZ');
  await second.getByRole('button',{name:/^Join World/}).click();
  await expect(second.getByRole('alert')).toContainText('no longer exists');
  await second.getByLabel('World code').fill(code!.toLowerCase());
  await second.waitForTimeout(550);
  await second.getByRole('button',{name:/^Join World/}).click();
  await expect(second.locator('.player-label')).toHaveCount(2);
  await expect(page.locator('.player-label')).toHaveCount(2);
  await expect(page.getByText('2 players exploring')).toBeVisible();
  const observer=io('http://localhost:3001',{forceNew:true});
  try {
    await new Promise<void>((resolve,reject)=>{observer.on('connect',()=>resolve());observer.on('connect_error',reject);});
    const joined=await new Promise<JoinResult>(resolve=>observer.emit('world:join',{name:'Observer',code},resolve));
    expect(joined.ok).toBeTruthy();
    if(!joined.ok)throw new Error('Observer could not join');
    let state:WorldState=joined.world;
    observer.on('world:state',(next:WorldState)=>state=next);
    const before=state.players.find(p=>p.name==='Alice')!;
    await page.bringToFront();
    await page.locator('canvas').click();
    await expect.poll(()=>page.evaluate(()=>!!document.pointerLockElement)).toBe(true);
    await page.keyboard.down('w');await page.waitForTimeout(700);await page.keyboard.up('w');
    await expect.poll(()=>Math.hypot(state.players.find(p=>p.name==='Alice')!.x-before.x,state.players.find(p=>p.name==='Alice')!.z-before.z)).toBeGreaterThan(1);
    await page.mouse.move(850,450);
    await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('d');
    await expect.poll(()=>Math.abs(state.players.find(p=>p.name==='Alice')!.rotation)).toBeGreaterThan(0.1);
    await page.keyboard.press('Escape');
    // Headless Chrome does not always implement Escape's browser-level release.
    await page.evaluate(()=>document.exitPointerLock());
    const bobBefore=state.players.find(p=>p.name==='Bob')!;
    await second.bringToFront();await second.locator('canvas').click();
    await second.keyboard.down('w');await second.keyboard.down('Shift');await second.waitForTimeout(600);await second.keyboard.up('w');await second.keyboard.up('Shift');
    await expect.poll(()=>Math.hypot(state.players.find(p=>p.name==='Bob')!.x-bobBefore.x,state.players.find(p=>p.name==='Bob')!.z-bobBefore.z)).toBeGreaterThan(1);
    await second.evaluate(()=>document.exitPointerLock());
    await page.screenshot({path:'/tmp/common-ground-world.png'});
    await second.getByRole('button',{name:'Leave World'}).click();
    await expect(second.getByRole('heading',{name:'Start your adventure'})).toBeVisible();
    await expect(page.locator('.player-label')).toHaveCount(2);
  } finally { observer.disconnect(); }
  expect(errors).toEqual([]);
});
