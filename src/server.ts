import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { RenderQueue } from './queue';
import { COMPOSITION_ID, FPS, CANVAS_MAP } from './config';
import type { RenderProps } from './config';

const app = express();
app.use(express.json({ limit: '10mb' }));

const renderQueue = new RenderQueue();
let bundleLocation: string | null = null;
let bundling = false;

const PORT = parseInt(process.env.PORT || '3000', 10);
const API_KEY = process.env.REMOTION_API_KEY || '';
const RENDER_TIMEOUT_MS = parseInt(process.env.RENDER_TIMEOUT_MS || '180000', 10);
const OUT_DIR = path.join(os.tmpdir(), 'remotion-renders');

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// --- Auth middleware for /render ---
function authGuard(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!API_KEY) {
    next();
    return;
  }
  const token = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (token !== API_KEY) {
    res.status(401).json({ error: 'Unauthorized. Provide x-api-key header.' });
    return;
  }
  next();
}

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    bundleReady: bundleLocation !== null,
    queuePending: renderQueue.pending,
    queueProcessing: renderQueue.isProcessing,
    currentJob: renderQueue.currentJob,
    uptime: process.uptime(),
    memoryMB: Math.round(process.memoryUsage.rss() / 1024 / 1024),
  });
});

// --- Render endpoint ---
app.post('/render', authGuard, async (req, res) => {
  const startTime = Date.now();
  const jobId = uuidv4();

  // Validate bundle is ready
  if (!bundleLocation) {
    res.status(503).json({ error: 'Bundle not ready. Server is still starting.' });
    return;
  }

  // Validate required fields
  const { canvas, comportamiento, animacion, duracion_segundos, imageUrl, copy, plataforma, modelo_imagen } = req.body;

  const missing: string[] = [];
  if (!canvas) missing.push('canvas');
  if (!comportamiento) missing.push('comportamiento');
  if (!animacion) missing.push('animacion');
  if (!duracion_segundos) missing.push('duracion_segundos');
  if (!imageUrl) missing.push('imageUrl');
  if (!plataforma) missing.push('plataforma');
  if (!modelo_imagen) missing.push('modelo_imagen');

  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    return;
  }

  // Validate canvas exists
  if (!CANVAS_MAP[canvas]) {
    res.status(400).json({
      error: `Invalid canvas: ${canvas}. Valid: ${Object.keys(CANVAS_MAP).join(', ')}`,
    });
    return;
  }

  // Validate duration
  if (typeof duracion_segundos !== 'number' || duracion_segundos < 3 || duracion_segundos > 120) {
    res.status(400).json({ error: 'duracion_segundos must be a number between 3 and 120' });
    return;
  }

  const inputProps: RenderProps = {
    canvas,
    comportamiento,
    animacion,
    duracion_segundos,
    imageUrl,
    copy: copy || null,
    plataforma,
    modelo_imagen,
  };

  const outputFileName = `${jobId}_${plataforma}.mp4`;
  const outputPath = path.join(OUT_DIR, outputFileName);

  console.log(`[Render] Job ${jobId} received for ${plataforma} (${canvas}, ${comportamiento}, ${animacion}, ${duracion_segundos}s)`);

  try {
    const renderWithTimeout = <T>(promise: Promise<T>): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Render timed out after ${RENDER_TIMEOUT_MS}ms`)), RENDER_TIMEOUT_MS)
        ),
      ]);
    };

    const result = await renderWithTimeout(renderQueue.enqueue(jobId, async () => {
      // Select composition with dynamic metadata (dimensions, duration)
      const composition = await selectComposition({
        serveUrl: bundleLocation!,
        id: COMPOSITION_ID,
        inputProps,
      });

      // Render the video
      await renderMedia({
        composition,
        serveUrl: bundleLocation!,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps,
        chromiumOptions: {
          disableWebSecurity: true,
        },
        jpegQuality: 85,
        onProgress: ({ progress }) => {
          if (Math.round(progress * 100) % 25 === 0) {
            console.log(`[Render] Job ${jobId}: ${Math.round(progress * 100)}%`);
          }
        },
      });

      return outputPath;
    }));

    const elapsedMs = Date.now() - startTime;
    const stats = fs.statSync(result);

    console.log(`[Render] Job ${jobId} done in ${elapsedMs}ms (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);

    // Send the file
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
    res.setHeader('X-Job-Id', jobId);
    res.setHeader('X-Render-Time-Ms', String(elapsedMs));
    res.setHeader('X-File-Size-Bytes', String(stats.size));

    const stream = fs.createReadStream(result);
    stream.pipe(res);
    stream.on('end', () => {
      // Cleanup temp file after sending
      fs.unlink(result, (err) => {
        if (err) console.error(`[Cleanup] Failed to delete ${result}:`, err.message);
        else console.log(`[Cleanup] Deleted ${result}`);
      });
    });
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Render] Job ${jobId} failed after ${elapsedMs}ms:`, errMsg);

    // Cleanup on error
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    res.status(500).json({
      error: 'Render failed',
      detail: errMsg,
      jobId,
      elapsedMs,
    });
  }
});

// --- Startup: bundle once ---
async function startServer() {
  console.log('[Server] Starting Remotion server...');
  console.log(`[Server] Node.js ${process.version}, PID ${process.pid}`);
  console.log(`[Server] Memory limit: ${Math.round((process.memoryUsage.rss() / 1024 / 1024))}MB current`);

  // Start Express immediately so health check works during bundling
  app.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
    console.log(`[Server] Health: http://localhost:${PORT}/health`);
    console.log(`[Server] Render: POST http://localhost:${PORT}/render`);
  });

  // Bundle in background
  console.log('[Bundle] Starting Webpack bundle...');
  bundling = true;
  const bundleStart = Date.now();

  try {
    // Entry point must be the source .ts file, not the compiled .js
    const entryPoint = path.resolve(__dirname, '..', 'src', 'remotion', 'index.ts');
    bundleLocation = await bundle({
      entryPoint,
      webpackOverride: (config) => config,
      onProgress: (progress) => {
        if (Math.round(progress * 100) % 25 === 0) {
          console.log(`[Bundle] ${Math.round(progress * 100)}%`);
        }
      },
    });

    const bundleTime = Date.now() - bundleStart;
    console.log(`[Bundle] Ready in ${bundleTime}ms at ${bundleLocation}`);
    bundling = false;
  } catch (error) {
    console.error('[Bundle] FATAL: Bundle failed:', error);
    process.exit(1);
  }
}

startServer();
