async function renderRequest(endpoint, options = {}) {
  const apiKey = process.env.RENDER_API_KEY;
  if (!apiKey || apiKey.startsWith('MOCK_')) throw new Error('RENDER_API_KEY is not configured.');
  const response = await fetch(`https://api.render.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Render API ${response.status}: ${body}`);
  }
  return response.status === 204 ? null : response.json();
}

async function createReal({ publicId, serviceName }) {
  const ownerId = process.env.RENDER_OWNER_ID;
  const repo = process.env.GITHUB_REPO_URL;
  if (!ownerId || ownerId.startsWith('MOCK_')) throw new Error('RENDER_OWNER_ID is not configured.');
  if (!repo || repo.includes('your-org') || repo.includes('your-repository')) throw new Error('GITHUB_REPO_URL is not configured.');

  const buildCommand = process.env.RENDER_BUILD_COMMAND || 'npm install && npm run build:course';
  const publishPath = process.env.RENDER_PUBLISH_PATH || 'dist';
  const branch = process.env.RENDER_BRANCH || process.env.GITHUB_BRANCH || 'main';

  const body = {
    type: 'static_site',
    name: serviceName,
    ownerId,
    repo,
    branch,
    autoDeployTrigger: 'commit',
    buildFilter: {
      paths: [
        `courses/${publicId}/**`,
        'packages/course-renderer/**',
        'scripts/build-course.js',
        'package.json',
        'package-lock.json'
      ]
    },
    envVars: [{ key: 'COURSE_ID', value: publicId }],
    serviceDetails: {
      buildCommand,
      publishPath,
      pullRequestPreviewsEnabled: 'no'
    }
  };

  const result = await renderRequest('/services', { method: 'POST', body: JSON.stringify(body) });
  const service = result.service;
  return {
    provider: 'render',
    serviceId: service.id,
    serviceName: service.name,
    url: service.serviceDetails?.url || `https://${service.slug}.onrender.com`,
    dashboardUrl: service.dashboardUrl,
    deployId: result.deployId || null
  };
}

async function triggerReal(serviceId) {
  const result = await renderRequest(`/services/${encodeURIComponent(serviceId)}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ clearCache: 'do_not_clear' })
  });
  return { provider: 'render', deployId: result?.id || null };
}

export function getRenderAdapter() {
  const provider = process.env.RENDER_PROVIDER || 'mock';
  return {
    async createCourseSite(args) {
      if (provider === 'mock') {
        return {
          provider: 'mock',
          serviceId: `srv_mock_${args.publicId}`,
          serviceName: args.serviceName,
          url: `https://${args.serviceName}.onrender.com`,
          dashboardUrl: 'https://dashboard.render.com/',
          deployId: `dep_mock_${Date.now()}`
        };
      }
      if (provider === 'render') return createReal(args);
      throw new Error(`Unsupported RENDER_PROVIDER=${provider}`);
    },

    async triggerDeploy(serviceId) {
      if (provider === 'mock') return { provider: 'mock', deployId: `dep_mock_${Date.now()}` };
      if (provider === 'render') return triggerReal(serviceId);
      throw new Error(`Unsupported RENDER_PROVIDER=${provider}`);
    }
  };
}
