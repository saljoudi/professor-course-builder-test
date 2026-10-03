import fs from 'node:fs/promises';
import path from 'node:path';
import { renderCourseHtml } from '../packages/course-renderer/renderer.js';

const arg = process.argv.find((x) => x.startsWith('--course='));
const courseId = process.env.COURSE_ID || (arg ? arg.split('=')[1] : null);
if (!courseId) {
  console.error('Missing COURSE_ID. Set COURSE_ID or pass --course=PUBLIC_ID');
  process.exit(1);
}

const source = path.resolve('courses', courseId, 'course.json');
const outputDir = path.resolve('dist');
const output = path.join(outputDir, 'index.html');

const course = JSON.parse(await fs.readFile(source, 'utf8'));
await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(output, renderCourseHtml(course));
await fs.writeFile(path.join(outputDir, 'course.json'), JSON.stringify(course, null, 2));
console.log(`Built ${courseId} -> ${output}`);
