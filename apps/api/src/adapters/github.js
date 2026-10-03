import fs from 'node:fs/promises';
import path from 'node:path';

function coursePath(publicId) {
  return `courses/${publicId}/course.json`;
}

async function githubRequest(endpoint, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token.startsWith('MOCK_')) throw new Error('GITHUB_TOKEN is not configured.');
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }
  return response.status === 204 ? null : response.json();
}

async function commitReal(publicId, courseData) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!owner || !repo || owner.startsWith('your-') || repo.startsWith('your-')) {
    throw new Error('GITHUB_OWNER/GITHUB_REPO are not configured.');
  }

  const filePath = coursePath(publicId);
  const endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath}`;
  let sha;
  try {
    const current = await githubRequest(`${endpoint}?ref=${encodeURIComponent(branch)}`);
    sha = current.sha;
  } catch (error) {
    if (!String(error.message).includes('404')) throw error;
  }

  const content = Buffer.from(JSON.stringify(courseData, null, 2)).toString('base64');
  const body = {
    message: `${sha ? 'Update' : 'Create'} course ${publicId}`,
    content,
    branch,
    ...(sha ? { sha } : {})
  };
  const result = await githubRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  return {
    provider: 'github',
    path: filePath,
    commitSha: result.commit?.sha || null,
    htmlUrl: result.content?.html_url || null
  };
}

async function commitMock(publicId, courseData) {
  const dir = path.resolve('courses', publicId);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'course.json');
  await fs.writeFile(file, JSON.stringify(courseData, null, 2));
  return { provider: 'mock', path: coursePath(publicId), commitSha: `mock-${Date.now()}`, localFile: file };
}

export function getGitHubAdapter() {
  const provider = process.env.GITHUB_PROVIDER || 'mock';
  return {
    async commitCourse(publicId, courseData) {
      if (provider === 'mock') return commitMock(publicId, courseData);
      if (provider === 'github') return commitReal(publicId, courseData);
      throw new Error(`Unsupported GITHUB_PROVIDER=${provider}`);
    }
  };
}
