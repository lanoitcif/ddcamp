import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import playwrightPkg from '../dnd-engine/node_modules/playwright/index.js';

const { chromium } = playwrightPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const duration = Number(process.argv[2]) || 90;
const outputPath = path.join(__dirname, duration === 90 ? 'creative_llm_demo.webm' : `creative_llm_demo_${duration}s.webm`);
const port = 8765;

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${port}`).pathname);
      const safePath = path.normalize(path.join(rootDir, pathname === '/' ? '/demo/trailer.html' : pathname));
      if (!safePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }
      const data = await fs.readFile(safePath);
      res.writeHead(200, { 'Content-Type': contentType(safePath) });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
}

async function main() {
  const server = createServer();
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  console.log(`Serving trailer assets on http://127.0.0.1:${port}/demo/trailer.html`);

  let browser;
  let browserSource = 'playwright';
  try {
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    browserSource = 'cdp';
  } catch {
    browser = await chromium.launch({
      headless: true,
      args: ['--autoplay-policy=no-user-gesture-required'],
    });
  }

  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('recording') || text.includes('done')) {
      console.log(`page:${text}`);
    }
  });

  try {
    await page.goto(`http://127.0.0.1:${port}/demo/trailer.html?duration=${duration}`, { waitUntil: 'networkidle' });
    await page.mouse.click(40, 40);
    console.log(`Rendering ${duration}-second demo trailer with ${browserSource} browser...`);
    const base64 = await page.evaluate(() => window.startRender());
    await fs.writeFile(outputPath, Buffer.from(base64, 'base64'));
    console.log(`Wrote ${outputPath}`);
  } finally {
    await page.close();
    await browser.close();
    server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
