import { spawn } from 'node:child_process';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is not installed. Install it with: npm i -D playwright');
  process.exit(1);
}

const port = Number(process.env.PORT || 8010);
const server = spawn(process.execPath, ['server.mjs'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
server.stdout.on('data', chunk => { output += chunk.toString(); });
server.stderr.on('data', chunk => { output += chunk.toString(); });

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return;
    } catch {}
    await wait(150);
  }
  throw new Error('Local server did not start.\n' + output);
}

try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Stage Select' }).click();
  await page.locator('.stageTile[data-stage="1"]').click();
  await page.waitForSelector('#deployBar');

  for (const id of [
    'office_cat',
    'rice_cooker_tank',
    'karaoke_uncle',
    'scooter_cat',
    'grandma_slipper',
    'sleepy_intern',
    'manager_cannon',
    'hotpot_monk'
  ]) {
    await page.locator(`.deploySlot[data-unit="${id}"]`).click();
    await wait(80);
  }

  const save = await page.evaluate(() => localStorage.getItem('cc3d_save_v1'));
  if (!save) throw new Error('Expected localStorage save key cc3d_save_v1');
  if (errors.length) throw new Error('Console errors:\n' + errors.join('\n'));
  await browser.close();
  console.log('Smoke test passed');
} finally {
  server.kill();
}
