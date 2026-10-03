import { makeInternalId, makePublicId, makeRenderServiceName } from '../utils/id.js';
import { extractUploads } from './extract.js';
import { getAiAdapter } from '../adapters/ai.js';
import { getGitHubAdapter } from '../adapters/github.js';
import { getRenderAdapter } from '../adapters/render.js';
import { getDatabaseAdapter } from '../adapters/database.js';
import { COURSE_THEMES, normalizeTheme } from '../../../../packages/course-renderer/themes.js';

const db = getDatabaseAdapter();
const ai = getAiAdapter();
const github = getGitHubAdapter();
const render = getRenderAdapter();

function serializeUpload(file) {
  if (!file) return null;
  return {
    originalname: file.originalname,
    filename: file.filename,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size
  };
}

async function uniquePublicId() {
  for (let i = 0; i < 10; i += 1) {
    const id = makePublicId(8);
    if (!(await db.getCourse(id))) return id;
  }
  throw new Error('Could not allocate a unique course ID.');
}

export async function createCourse({ user, fields, files }) {
  const publicId = await uniquePublicId();
  const courseName = String(fields.courseName || '').trim();
  if (!courseName) throw new Error('Course name is required.');
  const styleId = normalizeTheme(fields.styleId);
  const now = new Date().toISOString();

  const course = {
    id: makeInternalId('crs'),
    publicId,
    ownerId: user.id,
    courseName,
    courseCode: String(fields.courseCode || '').trim(),
    term: String(fields.term || '').trim(),
    styleId,
    status: 'draft',
    options: {
      interactiveLessons: fields.interactiveLessons !== 'false',
      practice: fields.practice !== 'false',
      reviews: fields.reviews !== 'false',
      ontology: fields.ontology !== 'false'
    },
    uploads: {
      syllabus: serializeUpload(files.syllabus?.[0]),
      materials: (files.materials || []).map(serializeUpload)
    },
    generatedCourse: null,
    renderServiceId: null,
    renderServiceName: null,
    renderUrl: null,
    githubPath: null,
    createdAt: now,
    updatedAt: now
  };
  return db.createCourse(course);
}


export async function updateCourseInputs({ courseId, user, fields, files }) {
  const course = await db.getCourse(courseId);
  if (!course || course.ownerId !== user.id) throw new Error('Course not found.');

  const newSyllabus = files.syllabus?.[0] ? serializeUpload(files.syllabus[0]) : null;
  const newMaterials = (files.materials || []).map(serializeUpload);
  const hasChanges = newSyllabus || newMaterials.length || fields.courseName || fields.courseCode || fields.term || fields.styleId;
  if (!hasChanges) throw new Error('No course changes were supplied.');

  const patch = {
    courseName: String(fields.courseName || course.courseName).trim(),
    courseCode: fields.courseCode !== undefined ? String(fields.courseCode).trim() : course.courseCode,
    term: fields.term !== undefined ? String(fields.term).trim() : course.term,
    styleId: fields.styleId ? normalizeTheme(fields.styleId) : course.styleId,
    options: {
      interactiveLessons: fields.interactiveLessons !== undefined ? fields.interactiveLessons !== 'false' : course.options.interactiveLessons,
      practice: fields.practice !== undefined ? fields.practice !== 'false' : course.options.practice,
      reviews: fields.reviews !== undefined ? fields.reviews !== 'false' : course.options.reviews,
      ontology: fields.ontology !== undefined ? fields.ontology !== 'false' : course.options.ontology
    },
    uploads: {
      syllabus: newSyllabus || course.uploads.syllabus,
      materials: [...course.uploads.materials, ...newMaterials]
    },
    status: 'draft'
  };

  return db.updateCourse(course.id, patch);
}

export async function buildCourse(courseId) {
  const course = await db.getCourse(courseId);
  if (!course) throw new Error('Course not found.');
  if (!course.uploads.materials.length && !course.uploads.syllabus) {
    throw new Error('Upload at least one course-material file or a syllabus before building.');
  }

  const build = {
    id: makeInternalId('bld'),
    courseId: course.id,
    startedAt: new Date().toISOString(),
    status: 'running'
  };
  await db.createBuild(build);

  try {
    const extracted = await extractUploads({
      syllabus: course.uploads.syllabus,
      materials: course.uploads.materials
    });
    const generatedCourse = await ai.buildCourse({
      publicId: course.publicId,
      courseName: course.courseName,
      courseCode: course.courseCode,
      term: course.term,
      styleId: course.styleId,
      options: course.options,
      ...extracted
    });
    const updated = await db.updateCourse(course.id, {
      generatedCourse,
      status: 'ready'
    });
    return updated;
  } catch (error) {
    await db.updateCourse(course.id, { status: 'build_failed', lastError: error.message });
    throw error;
  }
}

export async function publishCourse(courseId) {
  const course = await db.getCourse(courseId);
  if (!course) throw new Error('Course not found.');
  if (!course.generatedCourse) throw new Error('Build the course before publishing.');

  const git = await github.commitCourse(course.publicId, course.generatedCourse);
  const serviceName = course.renderServiceName || makeRenderServiceName(course.courseName, course.publicId);
  let deployment;

  if (!course.renderServiceId) {
    deployment = await render.createCourseSite({
      publicId: course.publicId,
      serviceName
    });
  } else {
    deployment = {
      provider: process.env.RENDER_PROVIDER || 'mock',
      serviceId: course.renderServiceId,
      serviceName,
      url: course.renderUrl,
      deployId: null,
      note: 'Git commit created. Render auto-deploy handles this update through the course-specific build filter.'
    };
  }

  const updated = await db.updateCourse(course.id, {
    status: 'published',
    githubPath: git.path,
    githubCommitSha: git.commitSha,
    renderServiceId: deployment.serviceId || course.renderServiceId,
    renderServiceName: serviceName,
    renderUrl: deployment.url || course.renderUrl,
    lastPublishedAt: new Date().toISOString()
  });

  return { course: updated, github: git, deployment };
}

export async function listCourses(ownerId) {
  return db.listCourses(ownerId);
}

export async function getCourse(courseId) {
  return db.getCourse(courseId);
}

export function getPublicConfig() {
  return {
    appName: process.env.APP_NAME || 'Professor Course Builder',
    themes: COURSE_THEMES,
    providers: {
      ai: process.env.AI_PROVIDER || 'mock',
      database: process.env.DATABASE_PROVIDER || 'mock',
      payment: process.env.PAYMENT_PROVIDER || 'mock',
      github: process.env.GITHUB_PROVIDER || 'mock',
      render: process.env.RENDER_PROVIDER || 'mock',
      auth: process.env.AUTH_PROVIDER || 'mock'
    }
  };
}
