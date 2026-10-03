const THEME_OPTIONS = [
  ['academic','Academic','University structure','preview-academic'],
  ['modern','Modern','Bright cards','preview-modern'],
  ['dark-focus','Dark Focus','Immersive study','preview-dark-focus'],
  ['notebook','Notebook','Warm study notes','preview-notebook'],
  ['executive','Executive','Professional brief','preview-executive']
];

let state = { apiBase: 'http://localhost:8787', course: null, previewUrl: null, styleId: 'academic', mode: 'new', courses: [] };
const $ = (id) => document.getElementById(id);

function toast(message, isError=false) {
  const el = $('toast');
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 4200);
}

function setBusy(button, busy, label) {
  if (!button.dataset.original) button.dataset.original = button.textContent;
  button.disabled = busy;
  button.textContent = busy ? label : button.dataset.original;
}

async function api(path, options={}) {
  const response = await fetch(`${state.apiBase}${path}`, options);
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { error: text }; }
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

function renderThemes() {
  $('themes').innerHTML = THEME_OPTIONS.map(([id,name,desc,preview]) => `
    <button class="theme-card ${id===state.styleId?'selected':''}" data-theme="${id}">
      <div class="theme-preview ${preview}"><i></i><i></i></div><strong>${name}</strong><small>${desc}</small>
    </button>`).join('');
  document.querySelectorAll('[data-theme]').forEach((el) => el.addEventListener('click', () => {
    state.styleId = el.dataset.theme;
    renderThemes();
  }));
}

function updateWorkflow() {
  const status = state.course?.status;
  document.querySelector('[data-step="create"]').className = `step ${state.course?'done':''}`;
  document.querySelector('[data-step="build"]').className = `step ${['ready','published'].includes(status)?'done':state.course?'active':''}`;
  document.querySelector('[data-step="publish"]').className = `step ${status==='published'?'done':status==='ready'?'active':''}`;
  $('buildBtn').disabled = !state.course || ['ready','published'].includes(status);
  $('previewBtn').disabled = !state.previewUrl && !state.course?.generatedCourse;
  $('publishBtn').disabled = !state.course || !['ready','published'].includes(status);
}

function setResult(html) {
  $('result').innerHTML = html;
  $('result').hidden = false;
}

async function checkConnection() {
  try {
    const data = await api('/api/health');
    $('statusDot').className = 'status-dot ok';
    $('connectionText').textContent = 'Platform connected';
    $('providerBadge').textContent = `${data.providers.ai}/${data.providers.render}`;
  } catch (error) {
    $('statusDot').className = 'status-dot bad';
    $('connectionText').textContent = 'API not connected';
    $('providerBadge').textContent = 'offline';
  }
}

async function loadCourses() {
  try {
    const { courses } = await api('/api/courses');
    if (!courses.length) {
      $('courses').innerHTML = '<p class="muted">No courses yet. Your first draft will appear here.</p>';
      return;
    }
    state.courses = courses;
    $('courses').innerHTML = courses.slice().reverse().slice(0,8).map((c) => `
      <div class="course-item">
        <div class="course-id">${c.publicId.slice(0,4)}</div>
        <div class="course-copy"><strong>${escapeHtml(c.courseName)}</strong><span>${escapeHtml(c.courseCode || c.publicId)} · ${escapeHtml(c.term || 'No term')}</span></div>
        <span class="status-chip">${escapeHtml(c.status)}</span>
        <button class="manage-btn" data-manage="${escapeHtml(c.id)}">Manage</button>
      </div>`).join('');
    document.querySelectorAll('[data-manage]').forEach((btn) => btn.addEventListener('click', () => selectExistingCourse(btn.dataset.manage)));
  } catch {
    $('courses').innerHTML = '<p class="muted">Connect the API to load courses.</p>';
  }
}

function escapeHtml(v='') { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }


function resetToNewCourse() {
  state.mode = 'new'; state.course = null; state.previewUrl = null; state.styleId = 'academic';
  $('courseName').value=''; $('courseCode').value=''; $('term').value='';
  $('syllabus').value=''; $('materials').value=''; $('syllabusName').textContent='Choose one file'; $('materialsName').textContent='Upload one or more weeks/modules';
  $('createBtn').textContent='Create course draft'; delete $('createBtn').dataset.original;
  $('result').hidden=true; renderThemes(); updateWorkflow();
}

function selectExistingCourse(id) {
  const course = state.courses.find((c) => c.id === id);
  if (!course) return;
  state.mode='update'; state.course=course; state.styleId=course.styleId || 'academic';
  state.previewUrl = course.generatedCourse ? `${state.apiBase}/preview/${course.publicId}` : null;
  $('courseName').value=course.courseName || ''; $('courseCode').value=course.courseCode || ''; $('term').value=course.term || '';
  $('interactiveLessons').checked=course.options?.interactiveLessons !== false; $('practice').checked=course.options?.practice !== false; $('reviews').checked=course.options?.reviews !== false; $('ontology').checked=course.options?.ontology !== false;
  $('syllabus').value=''; $('materials').value=''; $('syllabusName').textContent='Choose a replacement syllabus (optional)'; $('materialsName').textContent='Choose new weeks/modules to append';
  $('createBtn').textContent='Save files / course changes'; delete $('createBtn').dataset.original;
  renderThemes(); updateWorkflow();
  setResult(`<strong>Managing existing course</strong>${escapeHtml(course.courseName)} · ${escapeHtml(course.publicId)}<div class="mode-note">New files will be added to this same course ID and URL.<button id="newCourseMode">Start a new course instead</button></div>`);
  $('newCourseMode')?.addEventListener('click', resetToNewCourse);
}

async function createDraft() {
  const courseName = $('courseName').value.trim();
  const syllabus = $('syllabus').files[0];
  const materials = [...$('materials').files];
  if (!courseName) return toast('Enter a course name.', true);
  if (state.mode === 'new' && !syllabus && !materials.length) return toast('Upload at least one syllabus or course-material file.', true);

  const form = new FormData();
  form.append('courseName', courseName);
  form.append('courseCode', $('courseCode').value.trim());
  form.append('term', $('term').value.trim());
  form.append('styleId', state.styleId);
  form.append('interactiveLessons', $('interactiveLessons').checked);
  form.append('practice', $('practice').checked);
  form.append('reviews', $('reviews').checked);
  form.append('ontology', $('ontology').checked);
  if (syllabus) form.append('syllabus', syllabus);
  materials.forEach((file) => form.append('materials', file));

  const btn = $('createBtn');
  setBusy(btn, true, 'Uploading…');
  try {
    const endpoint = state.mode === 'update' ? `/api/courses/${encodeURIComponent(state.course.id)}/materials` : '/api/courses';
    const { course } = await api(endpoint, { method: 'POST', body: form });
    state.course = course;
    state.previewUrl = course.generatedCourse ? `${state.apiBase}/preview/${course.publicId}` : null;
    state.mode = 'update';
    $('createBtn').textContent = 'Save files / course changes'; delete $('createBtn').dataset.original;
    setResult(`<strong>${course.generatedCourse ? 'Course changes saved' : 'Draft created'}</strong>Course ID: ${escapeHtml(course.publicId)}<br>Future/current Render name: ${escapeHtml(course.courseName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))}-${course.publicId.toLowerCase()}.onrender.com`);
    updateWorkflow();
    await loadCourses();
    toast('Course saved. Build it to regenerate the interactive site.');
  } catch (error) { toast(error.message, true); }
  finally { setBusy(btn, false); updateWorkflow(); }
}

async function build() {
  if (!state.course) return;
  const btn = $('buildBtn');
  setBusy(btn, true, 'Building with AI…');
  try {
    const data = await api(`/api/courses/${encodeURIComponent(state.course.id)}/build`, { method: 'POST' });
    state.course = data.course;
    state.previewUrl = data.previewUrl;
    setResult(`<strong>Course build ready</strong>${escapeHtml(state.course.generatedCourse?.weeks?.length || 0)} modules generated.<br>Course ID: ${escapeHtml(state.course.publicId)}<br><a href="#" id="resultPreview">Open preview</a>`);
    $('resultPreview')?.addEventListener('click', (e) => { e.preventDefault(); openPreview(); });
    updateWorkflow();
    await loadCourses();
    toast('Build complete. Review the preview before publishing.');
  } catch (error) { toast(error.message, true); }
  finally { setBusy(btn, false); updateWorkflow(); }
}

function openPreview() {
  if (!state.previewUrl) return toast('Build the course first.', true);
  chrome.tabs.create({ url: state.previewUrl });
}

async function publish() {
  if (!state.course) return;
  const btn = $('publishBtn');
  setBusy(btn, true, 'Publishing…');
  try {
    const data = await api(`/api/courses/${encodeURIComponent(state.course.id)}/publish`, { method: 'POST' });
    state.course = data.course;
    state.previewUrl = data.previewUrl;
    const url = data.course.renderUrl;
    const notice = data.mockDeployment ? '<br><em>Mock mode: this is the expected Render URL, not a live deployment yet.</em>' : '';
    setResult(`<strong>Published</strong>${escapeHtml(url || '')}${notice}<br><a href="#" id="copyUrl">Copy course URL</a>`);
    $('copyUrl')?.addEventListener('click', async (e) => { e.preventDefault(); await navigator.clipboard.writeText(url || state.previewUrl); toast('Course URL copied.'); });
    updateWorkflow();
    await loadCourses();
    toast(data.mockDeployment ? 'Mock publish completed.' : 'Course published to Render.');
  } catch (error) { toast(error.message, true); }
  finally { setBusy(btn, false); updateWorkflow(); }
}

$('syllabus').addEventListener('change', () => { $('syllabusName').textContent = $('syllabus').files[0]?.name || 'Choose one file'; });
$('materials').addEventListener('change', () => {
  const files = [...$('materials').files];
  $('materialsName').textContent = files.length ? `${files.length} file${files.length===1?'':'s'} selected` : 'Upload one or more weeks/modules';
});
$('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
$('createBtn').addEventListener('click', createDraft);
$('buildBtn').addEventListener('click', build);
$('previewBtn').addEventListener('click', openPreview);
$('publishBtn').addEventListener('click', publish);

(async function init(){
  const stored = await chrome.storage.local.get(['apiBase']);
  state.apiBase = (stored.apiBase || 'http://localhost:8787').replace(/\/$/, '');
  renderThemes();
  updateWorkflow();
  await checkConnection();
  await loadCourses();
})();
