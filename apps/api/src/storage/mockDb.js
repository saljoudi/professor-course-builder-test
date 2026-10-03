import fs from 'node:fs/promises';
import path from 'node:path';

const runtimeDir = path.resolve('runtime');
const dbPath = path.join(runtimeDir, 'mock-db.json');

const emptyDb = {
  users: [
    {
      id: 'usr_demo_professor',
      email: 'professor@example.edu',
      name: 'Demo Professor',
      plan: 'professor',
      subscriptionStatus: 'active'
    }
  ],
  courses: [],
  builds: []
};

async function ensureDb() {
  await fs.mkdir(runtimeDir, { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(emptyDb, null, 2));
  }
}

async function readDb() {
  await ensureDb();
  return JSON.parse(await fs.readFile(dbPath, 'utf8'));
}

async function writeDb(db) {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

export const mockDb = {
  async listCourses(ownerId = 'usr_demo_professor') {
    const db = await readDb();
    return db.courses.filter((c) => c.ownerId === ownerId);
  },

  async getCourse(id) {
    const db = await readDb();
    return db.courses.find((c) => c.id === id || c.publicId === id) || null;
  },

  async createCourse(course) {
    const db = await readDb();
    db.courses.push(course);
    await writeDb(db);
    return course;
  },

  async updateCourse(id, patch) {
    const db = await readDb();
    const index = db.courses.findIndex((c) => c.id === id || c.publicId === id);
    if (index < 0) return null;
    db.courses[index] = { ...db.courses[index], ...patch, updatedAt: new Date().toISOString() };
    await writeDb(db);
    return db.courses[index];
  },

  async createBuild(build) {
    const db = await readDb();
    db.builds.push(build);
    await writeDb(db);
    return build;
  },

  async getBuild(id) {
    const db = await readDb();
    return db.builds.find((b) => b.id === id) || null;
  }
};
