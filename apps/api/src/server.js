import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs/promises';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { getAuthAdapter } from './adapters/auth.js';
import { getPaymentAdapter } from './adapters/payment.js';
import { createCourse, updateCourseInputs, buildCourse, publishCourse, listCourses, getCourse, getPublicConfig } from './services/courseService.js';
import { renderCourseHtml } from '../../../packages/course-renderer/renderer.js';

const app = express();
const port = Number(process.env.PORT || 8787);
const uploadDir = path.resolve('runtime', 'uploads');
await fs.mkdir(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 50 * 1024 * 1024, files: 31 }
});
const auth = getAuthAdapter();
const payments = getPaymentAdapter();

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  const config = getPublicConfig();
  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${config.appName}</title><style>body{font-family:system-ui;max-width:800px;margin:60px auto;padding:0 20px;color:#18212f}code{background:#f3f4f6;padding:3px 6px;border-radius:6px}.ok{color:#087a55}</style></head><body><h1>${config.appName} API</h1><p class="ok">● Running</p><p>Extension API base: <code>${process.env.PUBLIC_API_URL || `http://localhost:${port}`}</code></p><p>Current providers: <code>${JSON.stringify(config.providers)}</code></p><p>Use <code>/api/health</code> for health checks.</p></body></html>`);
});

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString(), ...getPublicConfig() }));
app.get('/api/config', (_req, res) => res.json(getPublicConfig()));

app.use('/api', async (req, res, next) => {
  try {
    req.user = await auth.authenticate(req);
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.get('/api/courses', async (req, res, next) => {
  try { res.json({ courses: await listCourses(req.user.id) }); } catch (e) { next(e); }
});

app.get('/api/courses/:id', async (req, res, next) => {
  try {
    const course = await getCourse(req.params.id);
    if (!course || course.ownerId !== req.user.id) return res.status(404).json({ error: 'Course not found.' });
    res.json({ course });
  } catch (e) { next(e); }
});

app.post('/api/courses', upload.fields([{ name: 'syllabus', maxCount: 1 }, { name: 'materials', maxCount: 30 }]), async (req, res, next) => {
  try {
    const allowance = await payments.assertCanBuild(req.user);
    if (!allowance.allowed) return res.status(402).json({ error: allowance.reason || 'Plan does not allow course creation.' });
    const course = await createCourse({ user: req.user, fields: req.body, files: req.files || {} });
    res.status(201).json({ course, allowance });
  } catch (e) { next(e); }
});


app.post('/api/courses/:id/materials', upload.fields([{ name: 'syllabus', maxCount: 1 }, { name: 'materials', maxCount: 30 }]), async (req, res, next) => {
  try {
    const allowance = await payments.assertCanBuild(req.user);
    if (!allowance.allowed) return res.status(402).json({ error: allowance.reason || 'Plan does not allow course updates.' });
    const course = await updateCourseInputs({ courseId: req.params.id, user: req.user, fields: req.body, files: req.files || {} });
    res.json({ course, allowance });
  } catch (e) { next(e); }
});

app.post('/api/courses/:id/build', async (req, res, next) => {
  try {
    const allowance = await payments.assertCanBuild(req.user);
    if (!allowance.allowed) return res.status(402).json({ error: allowance.reason || 'Plan does not allow generation.' });
    const current = await getCourse(req.params.id);
    if (!current || current.ownerId !== req.user.id) return res.status(404).json({ error: 'Course not found.' });
    const course = await buildCourse(req.params.id);
    const base = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ course, previewUrl: `${base}/preview/${course.publicId}` });
  } catch (e) { next(e); }
});

app.post('/api/courses/:id/publish', async (req, res, next) => {
  try {
    const current = await getCourse(req.params.id);
    if (!current || current.ownerId !== req.user.id) return res.status(404).json({ error: 'Course not found.' });
    const result = await publishCourse(req.params.id);
    const base = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ ...result, previewUrl: `${base}/preview/${result.course.publicId}`, mockDeployment: (process.env.RENDER_PROVIDER || 'mock') === 'mock' });
  } catch (e) { next(e); }
});

app.get('/preview/:id', async (req, res, next) => {
  try {
    const course = await getCourse(req.params.id);
    if (!course?.generatedCourse) return res.status(404).send('Course preview not found.');
    res.type('html').send(renderCourseHtml(course.generatedCourse));
  } catch (e) { next(e); }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error instanceof multer.MulterError ? 400 : 500;
  res.status(status).json({ error: error.message || 'Unexpected error.' });
});

app.listen(port, () => {
  console.log(`Professor Course Builder API running on http://localhost:${port}`);
  console.log(`Providers: ${JSON.stringify(getPublicConfig().providers)}`);
});
