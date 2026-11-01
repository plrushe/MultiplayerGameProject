import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',timeout:30000,workers:1,
  use:{baseURL:'http://localhost:5173',headless:true,viewport:{width:1440,height:1000},launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--enable-unsafe-swiftshader']}},
  webServer:{command:'npm run dev',url:'http://localhost:5173',reuseExistingServer:!process.env.CI,timeout:30000},
});
