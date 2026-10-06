import fs from 'node:fs/promises';
import path from 'node:path';
import { renderCourseHtml } from './renderer.js';

const arg = process.argv.find((x) => x.startsWith('--course='));
const courseId = process.env.COURSE_ID || (arg ? arg.split('=')[1] : null);
if (!courseId) {
  console.error('Missing COURSE_ID. Set COURSE_ID or pass --course=PUBLIC_ID');
  process.exit(1);
}

const courseDir = path.resolve('courses', courseId);
const manifest = JSON.parse(await fs.readFile(path.join(courseDir, 'course.json'), 'utf8'));
const ontology = JSON.parse(await fs.readFile(path.join(courseDir, 'ontology', 'course_ontology.json'), 'utf8'));
const weeks = [];
for (const weekId of manifest.weekOrder || []) {
  weeks.push(JSON.parse(await fs.readFile(path.join(courseDir, 'weeks', `${weekId}.json`), 'utf8')));
}
const course = { schemaVersion: manifest.schemaVersion || '2.0', metadata: manifest.metadata, privacy: manifest.privacy, ontology, weeks };
const outputDir = path.resolve('dist');
await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, 'index.html'), renderCourseHtml(course));
console.log(`Built ${courseId} with isolated runtime ${manifest.runtimeVersion || 'unknown'} (${weeks.length} ${manifest.metadata?.contentLabel || 'Week'}${weeks.length === 1 ? '' : 's'}) -> ${path.join(outputDir, 'index.html')}`);
