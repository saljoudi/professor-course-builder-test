import { normalizeTheme } from './themes.js';

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function js(value) { return JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\>'); }
function initials(value = 'Course') { return String(value).split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('') || 'C'; }
function relationLabel(type = 'relatedTo') {
  return ({
    prerequisiteOf: 'Prerequisite for', dependsOn: 'Builds on', supports: 'Supports',
    supportsUnderstandingOf: 'Supports understanding of', contrastsWith: 'Contrasts with',
    oftenConfusedWith: 'Do not confuse with', relatedTo: 'Related to', reviewedIn: 'Reviewed in',
    introducedIn: 'Introduced in', assessedBy: 'Assessed by', threatens: 'Can threaten',
    protects: 'Protects', mitigates: 'Mitigates', precedes: 'Precedes', appliedIn: 'Applied in',
    partOf: 'Part of', isSubtypeOf: 'Type of'
  })[type] || 'Related to';
}
function activityLabel(type = '') {
  return ({
    classification: 'Classify', matching: 'Match', ordering: 'Sequence', scenario: 'Decision lab',
    choice: 'Check understanding', retrieval: 'Retrieve', calculator: 'Calculate', comparison: 'Compare',
    reflection: 'Reflect', practice: 'Practice'
  })[String(type || '').toLowerCase()] || 'Practice';
}
function activityCode(type = '') {
  return ({ classification: 'CL', matching: 'MT', ordering: 'SQ', scenario: 'DL', choice: 'CH', retrieval: 'RT', calculator: 'FX', comparison: 'CP', reflection: 'RF' })[String(type || '').toLowerCase()] || 'PR';
}

const css = String.raw`
:root{--bg:#f4f6f9;--surface:#fff;--surface2:#f8fafc;--surface3:#eef3f8;--text:#172033;--muted:#667085;--line:#dde3eb;--accent:#24467d;--accent2:#456ba8;--good:#137a55;--goodbg:#eefaf5;--bad:#b42318;--badbg:#fff4f2;--warn:#9a6700;--radius:18px;--shadow:0 12px 32px rgba(16,24,40,.06);--max:1240px}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.62}button,input,textarea,select{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 22%,transparent);outline-offset:2px}.topbar{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--surface) 96%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}.top-inner{max-width:var(--max);margin:auto;padding:12px 22px;display:flex;align-items:center;gap:12px}.brand{width:40px;height:40px;border-radius:12px;background:linear-gradient(145deg,var(--accent),var(--accent2));color:#fff;display:grid;place-items:center;font-weight:900;letter-spacing:-.03em}.course-mini{min-width:0}.course-mini strong,.course-mini span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.course-mini span{font-size:11px;color:var(--muted)}.top-nav{margin-left:auto;display:flex;gap:6px;align-items:center;overflow:auto}.nav-btn{border:1px solid transparent;background:transparent;border-radius:10px;padding:8px 11px;color:var(--muted);white-space:nowrap}.nav-btn.active,.nav-btn:hover{color:var(--accent);background:var(--surface2);border-color:var(--line);font-weight:750}.shell{max-width:var(--max);margin:auto;display:grid;grid-template-columns:255px minmax(0,1fr);gap:26px;padding:30px 22px 60px}.sidebar{position:sticky;top:82px;align-self:start}.side-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:13px}.side-title{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);font-weight:900;margin:6px 8px 10px}.week-nav{width:100%;border:0;background:transparent;text-align:left;padding:10px 11px;border-radius:11px;color:var(--muted);margin:2px 0}.week-nav.active,.week-nav:hover{background:var(--surface2);color:var(--accent);font-weight:800}.progress-wrap{padding:10px 8px 4px;border-top:1px solid var(--line);margin-top:9px}.progress-label{display:flex;justify-content:space-between;font-size:10px;color:var(--muted)}.progress{height:7px;background:var(--line);border-radius:99px;overflow:hidden;margin-top:7px}.progress span{display:block;width:0;height:100%;background:var(--accent);transition:.2s}.main{min-width:0}.view{display:none}.view.active{display:block}.hero,.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}.hero{padding:40px;margin-bottom:20px;background:linear-gradient(145deg,var(--surface),var(--surface2))}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:var(--accent);font-weight:900}.hero h1{font-size:clamp(36px,5vw,58px);line-height:1.03;letter-spacing:-.04em;margin:10px 0 13px}.hero p{max-width:800px;margin:0;color:var(--muted);font-size:16px}.prof{margin-top:11px;font-weight:800}.meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.pill{font-size:11px;border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:6px 10px}.meta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:22px}.meta-item{border:1px solid var(--line);background:var(--surface);border-radius:13px;padding:10px 12px;min-width:0}.meta-item span{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.11em;font-weight:900;margin-bottom:2px}.meta-item strong{display:block;font-size:13px;white-space:normal;overflow-wrap:anywhere}.single-map .map-cluster h4{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.section{margin:22px 0}.section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:11px}.section-head h2,.section-head h3{margin:0}.section-head p{margin:3px 0 0;color:var(--muted);font-size:13px}.week-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:12px}.week-card{border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:19px;text-align:left;box-shadow:var(--shadow);color:var(--text);transition:.16s ease}.week-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--accent) 35%,var(--line))}.week-no{font-size:10px;color:var(--accent);font-weight:900;letter-spacing:.1em}.week-card h3{margin:6px 0 7px}.week-card p{margin:0;color:var(--muted);font-size:13px}.card{padding:25px;margin-bottom:17px}.week-heading{display:flex;gap:16px;align-items:flex-start}.week-badge{width:54px;height:54px;border-radius:15px;background:var(--accent);color:#fff;display:grid;place-items:center;font-weight:900;font-size:18px;flex:0 0 auto}.week-heading h1{font-size:33px;line-height:1.12;margin:0 0 5px;letter-spacing:-.025em}.week-heading p{margin:0;color:var(--muted)}.objectives{padding-left:20px;margin-bottom:0}.objectives li{margin:6px 0}.concept-grid,.flash-grid,.mastery-grid,.map-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:12px}.concept,.flashcard,.mastery,.map-cluster{border:1px solid var(--line);background:var(--surface2);border-radius:14px;padding:16px}.concept h4,.map-cluster h4{margin:0 0 6px}.concept p{margin:0;color:var(--muted);font-size:13px}.section-copy p{margin:0 0 13px}.section-copy p:last-child{margin-bottom:0}.teaching-section h3{margin-top:0;font-size:20px}.activity-stack{display:grid;gap:14px}.activity{border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:19px;box-shadow:var(--shadow)}.activity-head{display:flex;gap:11px;align-items:flex-start;margin-bottom:9px}.activity-code{width:38px;height:38px;border:1px solid var(--line);background:var(--surface2);color:var(--accent);border-radius:11px;display:grid;place-items:center;font-size:10px;font-weight:900;letter-spacing:.04em;flex:0 0 auto}.activity-type{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);font-weight:900}.activity h4{margin:1px 0 0;font-size:17px}.activity-prompt{margin:0 0 13px;color:var(--muted)}.activity-items{display:grid;gap:9px}.interactive-row{border:1px solid var(--line);background:var(--surface2);border-radius:12px;padding:11px;display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,230px);align-items:center;gap:12px}.interactive-row select,.calc-input{width:100%;border:1px solid var(--line);background:var(--surface);border-radius:9px;padding:8px 9px;color:var(--text)}.activity-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px}.action-btn,.small-btn{border:1px solid var(--line);background:var(--surface);border-radius:9px;padding:8px 11px;color:var(--accent);font-weight:800}.action-btn.primary{background:var(--accent);color:#fff;border-color:var(--accent)}.activity-feedback{display:none;margin-top:12px;border-radius:11px;padding:10px 12px;font-size:13px}.activity-feedback.show{display:block}.activity-feedback.good{background:var(--goodbg);color:var(--good)}.activity-feedback.bad{background:var(--badbg);color:var(--bad)}.activity-feedback.neutral{background:var(--surface2);color:var(--muted)}.match-grid{display:grid;gap:8px}.order-list{display:grid;gap:8px}.order-item{display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:9px;border:1px solid var(--line);background:var(--surface2);border-radius:11px;padding:8px}.order-index{width:30px;height:30px;border-radius:8px;background:var(--surface);border:1px solid var(--line);display:grid;place-items:center;font-size:11px;font-weight:900;color:var(--accent)}.order-controls{display:flex;gap:4px}.move-btn{border:1px solid var(--line);background:var(--surface);border-radius:8px;width:32px;height:30px;color:var(--accent)}.choice-list{display:grid;gap:8px}.activity-choice{display:flex;gap:10px;width:100%;text-align:left;border:1px solid var(--line);border-radius:11px;background:var(--surface2);padding:10px 11px;color:var(--text)}.activity-choice.selected{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 7%,var(--surface))}.activity-choice.correct{border-color:var(--good);background:var(--goodbg)}.activity-choice.wrong{border-color:var(--bad);background:var(--badbg)}.choice-dot{width:24px;height:24px;border-radius:8px;background:var(--surface);border:1px solid var(--line);display:grid;place-items:center;font-size:10px;font-weight:900;color:var(--accent);flex:0 0 auto}.retrieval-answer,.compare-answer{display:none;margin-top:10px;border-top:1px solid var(--line);padding-top:10px;color:var(--text)}.revealed .retrieval-answer,.revealed .compare-answer{display:block}.comparison-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:9px}.comparison-item{border:1px solid var(--line);background:var(--surface2);border-radius:11px;padding:11px}.comparison-item strong{display:block;margin-bottom:4px}.comparison-item span{font-size:13px;color:var(--muted)}.calc-formula{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid var(--line);background:var(--surface2);border-radius:10px;padding:10px;margin-bottom:10px}.calc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px}.calc-result{margin-top:11px;padding:11px;border-radius:11px;background:var(--surface2);font-weight:800}.constructed textarea,.mastery textarea{width:100%;min-height:92px;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--surface2);resize:vertical;color:var(--text);margin-top:8px}.flashcard{min-height:150px;display:flex;flex-direction:column;justify-content:space-between}.flash-front{font-weight:800}.flash-back{display:none;color:var(--muted);margin-top:9px;border-top:1px solid var(--line);padding-top:9px}.flashcard.revealed .flash-back{display:block}.quiz-q{padding:19px 0;border-top:1px solid var(--line)}.quiz-q:first-child{border-top:0}.quiz-q h4{margin:0;font-size:16px}.options{display:grid;gap:8px;margin-top:11px}.option{display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;align-items:center;width:100%;text-align:left;border:1px solid var(--line);border-radius:11px;background:var(--surface2);padding:10px 11px;color:var(--text)}.letter{width:28px;height:28px;border-radius:8px;border:1px solid var(--line);background:var(--surface);display:grid;place-items:center;font-size:11px;font-weight:900;color:var(--accent)}.option.correct{border-color:var(--good);background:var(--goodbg)}.option.wrong{border-color:var(--bad);background:var(--badbg)}.feedback{display:none;font-size:13px;margin-top:9px;border-radius:10px;padding:9px 11px;background:var(--surface2);color:var(--muted)}.feedback.show{display:block}.complete-btn{border:0;border-radius:11px;background:var(--accent);color:#fff;padding:10px 14px;font-weight:800}.complete-btn.done{background:var(--good)}.map-node{border:1px solid var(--line);background:var(--surface);border-radius:9px;padding:8px 9px;margin:6px 0;font-size:12px}.connection-groups{display:grid;gap:12px}.connection-group{border:1px solid var(--line);background:var(--surface2);border-radius:14px;padding:14px}.connection-group h4{margin:0 0 8px}.connection-row{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center;border-top:1px solid var(--line);padding:9px 0;font-size:12px}.connection-row:first-of-type{border-top:0}.concept-link{border:0;background:transparent;padding:0;color:var(--text);font-weight:800;text-align:left}.concept-link[data-open]:hover{color:var(--accent);text-decoration:underline}.rel-type{border:1px solid var(--line);border-radius:999px;background:var(--surface);padding:4px 8px;color:var(--accent);font-weight:800;font-size:9px;white-space:nowrap}.privacy{font-size:12px;color:var(--muted)}.footer{text-align:center;color:var(--muted);font-size:11px;border-top:1px solid var(--line);padding:24px;margin-top:28px}.empty{color:var(--muted);font-style:italic}.mastery-grid{grid-template-columns:1fr}.mastery p{margin-top:7px}.map-cluster .concept-link{display:block;width:100%;padding:7px 8px;border-radius:8px;background:var(--surface);border:1px solid var(--line);margin:6px 0}.course-map-relations{margin-top:18px}.course-map-relations .connection-row{padding:8px}.privacy-note{display:flex;gap:10px;align-items:flex-start}.privacy-mark{width:28px;height:28px;border-radius:9px;background:var(--surface2);display:grid;place-items:center;color:var(--accent);font-weight:900;flex:0 0 auto}
body.theme-modern{--bg:#f4f6ff;--surface2:#f1f3ff;--surface3:#e8ebff;--accent:#5947c9;--accent2:#7566db;--radius:22px}body.theme-dark-focus{--bg:#0b1018;--surface:#111827;--surface2:#172033;--surface3:#202c42;--text:#edf2f7;--muted:#a3aec0;--line:#283449;--accent:#8eb7ff;--accent2:#b0ccff;--goodbg:#102d25;--badbg:#331a1a;--shadow:none}body.theme-notebook{--bg:#f4efe4;--surface:#fffdf7;--surface2:#faf4e8;--surface3:#f1e7d4;--text:#352d27;--muted:#756b62;--line:#ded5c7;--accent:#7b4b34;--accent2:#9a654b;--radius:11px}body.theme-executive{--bg:#eef1f2;--surface2:#f4f7f7;--surface3:#e6eeee;--accent:#173f3c;--accent2:#315d59;--radius:12px}
@media(max-width:850px){.shell{grid-template-columns:1fr}.sidebar{position:static}.side-card{display:flex;gap:5px;overflow:auto;align-items:center}.side-title,.progress-wrap{display:none}.week-nav{width:auto;white-space:nowrap}.top-nav{display:none}.hero{padding:27px}.shell{padding:18px 14px 42px}.interactive-row,.connection-row{grid-template-columns:1fr}.week-heading{align-items:center}.week-heading h1{font-size:28px}}
`;

function conceptDestination(concept, course) {
  const id = concept?.introducedIn;
  return course.weeks?.some((w) => w.id === id) ? id : null;
}

function conceptButton(concept, course) {
  const dest = conceptDestination(concept, course);
  return `<button type="button" class="concept-link"${dest ? ` data-open="${esc(dest)}"` : ''}>${esc(concept?.name || '')}</button>`;
}

function prioritizedRelations(relations = []) {
  const rank = { prerequisiteOf: 1, dependsOn: 2, precedes: 3, contrastsWith: 4, oftenConfusedWith: 5, supportsUnderstandingOf: 6, supports: 7, protects: 8, mitigates: 9, partOf: 10, appliedIn: 11, relatedTo: 20 };
  return relations.slice().sort((a, b) => (rank[a.type] || 50) - (rank[b.type] || 50));
}

function effectiveRelationScope(relation, conceptById) {
  if (relation?.scope === 'within_module' || relation?.scope === 'cross_module') return relation.scope;
  const from = conceptById.get(relation?.from);
  const to = conceptById.get(relation?.to);
  if (!from || !to) return 'within_module';
  const fromRefs = new Set(from.moduleRefs || [from.introducedIn, ...(from.reviewedIn || [])].filter(Boolean));
  const toRefs = new Set(to.moduleRefs || [to.introducedIn, ...(to.reviewedIn || [])].filter(Boolean));
  const shared = [...fromRefs].some((id) => toRefs.has(id));
  return shared ? 'within_module' : 'cross_module';
}

function conceptMap(course) {
  const concepts = course.ontology?.concepts || [];
  const relations = prioritizedRelations(course.ontology?.relations || []);
  if (!concepts.length) return '<p class="empty">Concept connections will appear as the course develops.</p>';
  const singleItem = (course.weeks || []).length <= 1;
  const byItem = new Map();
  for (const c of concepts) {
    const key = c.introducedIn || 'course';
    if (!byItem.has(key)) byItem.set(key, []);
    byItem.get(key).push(c);
  }
  const itemTitle = (id) => course.weeks.find((w) => w.id === id)?.title || 'Course concepts';
  const nodes = [...byItem.entries()].map(([id, cs]) => `<div class="map-cluster"><h4>${esc(singleItem ? 'Key concepts' : itemTitle(id))}</h4>${cs.slice(0, 18).map((c) => `${conceptButton(c, course)} `).join('')}</div>`).join('');
  const names = new Map(concepts.map((c) => [c.id, c]));
  const valid = relations.filter((r) => names.has(r.from) && names.has(r.to));
  const cross = valid.filter((r) => effectiveRelationScope(r, names) === 'cross_module').slice(0, 18);
  const within = valid.filter((r) => effectiveRelationScope(r, names) === 'within_module').slice(0, 18);
  const block = (title, description, list) => list.length ? `<div class="course-map-relations"><div class="section-head"><div><h3>${esc(title)}</h3><p>${esc(description)}</p></div></div><div class="connection-groups">${list.map((r) => `<div class="connection-row">${conceptButton(names.get(r.from), course)}<span class="rel-type">${esc(relationLabel(r.type))}</span>${conceptButton(names.get(r.to), course)}</div>`).join('')}</div></div>` : '';
  if (singleItem) {
    return `<div class="map-grid single-map">${nodes}</div>${block('Key concept relationships','See how the concepts taught in this content item connect.',within)}`;
  }
  return `<div class="map-grid">${nodes}</div>${block('Connections across the course','See how ideas introduced in different parts of the course build on, contrast with, and support one another.',cross)}${block('Relationships within course content','Explore important relationships among concepts taught together.',within)}`;
}

function sectionBodyMarkup(section) {
  const raw = String(section?.body || section?.explanation || section?.content || section?.text || '').trim();
  if (!raw) return '';
  const paragraphs = raw.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  return `<div class="section-copy">${paragraphs.map((x) => `<p>${esc(x).replace(/\n/g, '<br>')}</p>`).join('')}</div>`;
}

function weekConnectionsMarkup(week, course) {
  const ids = new Set((week.concepts || []).map((c) => c.id).filter(Boolean));
  if (!ids.size) return '';
  const concepts = course?.ontology?.concepts || [];
  const names = new Map(concepts.map((c) => [c.id, c]));
  const relations = prioritizedRelations(course?.ontology?.relations || []);
  const connected = relations.filter((r) => (ids.has(r.from) || ids.has(r.to)) && names.has(r.from) && names.has(r.to));
  if (!connected.length) return '';
  const unique = [];
  const seen = new Set();
  for (const r of connected) {
    const key = `${r.from}|${r.type}|${r.to}`;
    if (seen.has(key)) continue;
    seen.add(key); unique.push(r);
    if (unique.length >= 16) break;
  }
  const within = unique.filter((r) => effectiveRelationScope(r, names) === 'within_module');
  const cross = unique.filter((r) => effectiveRelationScope(r, names) === 'cross_module');
  const rows = (list) => list.map((r) => `<div class="connection-row">${conceptButton(names.get(r.from), course)}<span class="rel-type">${esc(relationLabel(r.type))}</span>${conceptButton(names.get(r.to), course)}</div>`).join('');
  const label = course?.metadata?.contentLabel || 'Week';
  const multiItem = (course?.weeks || []).length > 1;
  const description = multiItem
    ? `See how concepts in this ${label.toLowerCase()} connect with one another and with ideas elsewhere in the course.`
    : `See how concepts in this ${label.toLowerCase()} connect with one another.`;
  return `<div class="card"><div class="section-head"><div><h3>Knowledge connections</h3><p>${esc(description)}</p></div></div><div class="connection-groups">${within.length ? `<div class="connection-group"><h4>Within this ${esc(label)}</h4>${rows(within)}</div>` : ''}${multiItem && cross.length ? `<div class="connection-group"><h4>Across the course</h4>${rows(cross)}</div>` : ''}</div></div>`;
}

function flashcardsMarkup(week) {
  if (!week.flashcards?.length) return '';
  return `<div class="card"><div class="section-head"><div><h3>Flashcards</h3><p>Try to recall the answer before revealing it.</p></div></div><div class="flash-grid">${week.flashcards.map((f, i) => `<div class="flashcard" data-flash="${esc(week.id)}-${i}"><div><div class="flash-front">${esc(f.front || '')}</div><div class="flash-back">${esc(f.back || '')}</div></div><button class="small-btn reveal" type="button">Reveal answer</button></div>`).join('')}</div></div>`;
}

function quizMarkup(week) {
  if (!week.quiz?.length) return '';
  return `<div class="card"><div class="section-head"><div><h3>Knowledge check</h3><p>Choose an answer, then review the explanation.</p></div></div>${week.quiz.map((q, i) => `<div class="quiz-q" data-q="${esc(week.id)}-${i}" data-answer="${Number(q.answerIndex ?? 0)}"><h4>${i + 1}. ${esc(q.question)}</h4><div class="options">${(q.options || []).map((o, oi) => `<button type="button" class="option" data-option="${oi}"><span class="letter">${String.fromCharCode(65 + oi)}</span><span>${esc(o)}</span></button>`).join('')}</div><div class="feedback">${esc(q.rationale || '')}</div></div>`).join('')}</div>`;
}

function feedbackBox(id) { return `<div class="activity-feedback" id="${esc(id)}" role="status" aria-live="polite"></div>`; }

function classificationMarkup(a, index) {
  if (!a.categories?.length || !a.items?.length) return constructedMarkup(a, index);
  const fid = `act-feedback-${index}`;
  return `<div class="activity-items">${a.items.map((item, ii) => `<label class="interactive-row"><span>${esc(item.text)}</span><select data-classify-item data-answer="${esc(item.answer)}"><option value="">Choose…</option>${a.categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label>`).join('')}</div><div class="activity-actions"><button type="button" class="action-btn primary" data-check-classification>Check answers</button><button type="button" class="action-btn" data-reset-activity>Reset</button></div>${feedbackBox(fid)}`;
}

function matchingMarkup(a, index) {
  if (!a.pairs?.length) return constructedMarkup(a, index);
  const choices = a.choices?.length ? a.choices : a.pairs.map((p) => p.right);
  return `<div class="match-grid">${a.pairs.map((pair) => `<label class="interactive-row"><span>${esc(pair.left)}</span><select data-match-item data-answer="${esc(pair.right)}"><option value="">Choose…</option>${choices.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label>`).join('')}</div><div class="activity-actions"><button type="button" class="action-btn primary" data-check-matching>Check matches</button><button type="button" class="action-btn" data-reset-activity>Reset</button></div>${feedbackBox(`act-feedback-${index}`)}`;
}

function orderingMarkup(a, index) {
  if (!a.items?.length) return constructedMarkup(a, index);
  const items = a.items.slice().reverse();
  return `<div class="order-list" data-order-list data-correct="${esc(JSON.stringify(a.items.map((x) => x.id)))}">${items.map((item, i) => `<div class="order-item" data-order-id="${esc(item.id)}"><span class="order-index">${i + 1}</span><span>${esc(item.text)}</span><span class="order-controls"><button type="button" class="move-btn" data-move="up" aria-label="Move up">↑</button><button type="button" class="move-btn" data-move="down" aria-label="Move down">↓</button></span></div>`).join('')}</div><div class="activity-actions"><button type="button" class="action-btn primary" data-check-order>Check order</button><button type="button" class="action-btn" data-reset-order>Reset order</button></div>${feedbackBox(`act-feedback-${index}`)}`;
}

function choiceMarkup(a, index) {
  if (!a.options?.length) return constructedMarkup(a, index);
  return `<div class="choice-list" data-choice-list data-answer="${Number(a.answerIndex ?? 0)}">${a.options.map((o, oi) => `<button type="button" class="activity-choice" data-choice-index="${oi}"><span class="choice-dot">${String.fromCharCode(65 + oi)}</span><span>${esc(o)}</span></button>`).join('')}</div>${feedbackBox(`act-feedback-${index}`)}`;
}

function retrievalMarkup(a) {
  const answer = String(a.answer || '').trim();
  if (!answer) return constructedMarkup(a, 0);
  return `<div class="retrieval"><button type="button" class="action-btn" data-reveal-activity>Reveal answer</button><div class="retrieval-answer"><strong>Answer</strong><div>${esc(answer)}</div>${a.feedback ? `<div style="margin-top:6px;color:var(--muted)">${esc(a.feedback)}</div>` : ''}</div></div>`;
}

function comparisonMarkup(a) {
  const items = a.items || [];
  return `${items.length ? `<div class="comparison-grid">${items.map((x) => `<div class="comparison-item"><strong>${esc(x.label)}</strong>${x.detail ? `<span>${esc(x.detail)}</span>` : ''}</div>`).join('')}</div>` : ''}${a.answer ? `<button type="button" class="action-btn" data-reveal-activity style="margin-top:10px">Reveal comparison</button><div class="compare-answer">${esc(a.answer)}</div>` : ''}`;
}

function calculatorMarkup(a, index) {
  if (!a.expression || !a.variables?.length) return constructedMarkup(a, index);
  return `${a.formula ? `<div class="calc-formula">${esc(a.formula)}</div>` : ''}<div class="calc-grid">${a.variables.map((v) => `<label>${esc(v.label)}<input class="calc-input" type="number" data-calc-var="${esc(v.id)}" value="${esc(v.default)}"${v.min !== null ? ` min="${esc(v.min)}"` : ''}${v.max !== null ? ` max="${esc(v.max)}"` : ''} step="${esc(v.step)}"></label>`).join('')}</div><div class="activity-actions"><button type="button" class="action-btn primary" data-calculate data-expression="${esc(a.expression)}" data-precision="${esc(a.precision ?? 3)}">Calculate</button></div><div class="calc-result" data-calc-result>${esc(a.resultLabel || 'Result')}: —</div>${feedbackBox(`act-feedback-${index}`)}`;
}

function constructedMarkup(a) {
  return `<div class="constructed"><textarea aria-label="Your response" placeholder="Write your response"></textarea>${a.answer ? `<button type="button" class="action-btn" data-reveal-activity style="margin-top:8px">Compare with guidance</button><div class="retrieval-answer">${esc(a.answer)}</div>` : ''}</div>`;
}

function activityBodyMarkup(a, index) {
  if (a.type === 'classification') return classificationMarkup(a, index);
  if (a.type === 'matching') return matchingMarkup(a, index);
  if (a.type === 'ordering') return orderingMarkup(a, index);
  if (a.type === 'scenario' || a.type === 'choice') return choiceMarkup(a, index);
  if (a.type === 'retrieval') return retrievalMarkup(a);
  if (a.type === 'calculator') return calculatorMarkup(a, index);
  if (a.type === 'comparison') return comparisonMarkup(a);
  return constructedMarkup(a, index);
}

function activitiesMarkup(week) {
  if (!week.activities?.length) return '';
  return `<div class="section"><div class="section-head"><div><h3>Practice & apply</h3><p>Work with the concepts, check your thinking, and use the feedback to correct misunderstandings.</p></div></div><div class="activity-stack">${week.activities.map((a, i) => `<div class="activity" data-activity="${i}" data-activity-type="${esc(a.type)}" data-feedback="${esc(a.feedback || a.debrief || '')}"><div class="activity-head"><span class="activity-code">${activityCode(a.type)}</span><div><div class="activity-type">${esc(activityLabel(a.type))}</div><h4>${esc(a.title || 'Practice activity')}</h4></div></div><p class="activity-prompt">${esc(a.prompt || '')}</p>${activityBodyMarkup(a, i)}</div>`).join('')}</div></div>`;
}

function masteryMarkup(week) {
  if (!week.isReviewWeek || !week.review?.prompts?.length) return '';
  return `<div class="card"><div class="eyebrow">CUMULATIVE REVIEW</div><div class="section-head"><div><h3>${esc(week.review.title || 'Course Review')}</h3><p>${esc(week.review.instructions || 'Integrate concepts from the selected Weeks.')}</p></div></div><div class="mastery-grid">${week.review.prompts.map((p, i) => `<div class="mastery"><strong>${i + 1}</strong><p>${esc(p)}</p><textarea aria-label="Review response ${i + 1}" placeholder="Write your response"></textarea></div>`).join('')}</div></div>`;
}

function weekMarkup(week, features, course) {
  const teachingSections = (week.sections || []).filter((section) => String(section?.title || '').trim() && String(section?.body || section?.explanation || section?.content || section?.text || '').trim());
  const contentLabel = course?.metadata?.contentLabel || 'Week';
  const reviewLabel = week.isReviewWeek === true ? 'CUMULATIVE REVIEW' : `${contentLabel.toUpperCase()} ${week.order}`;
  return `<section class="view week-view" id="${esc(week.id)}" data-view="${esc(week.id)}"><div class="card"><div class="week-heading"><div class="week-badge">${week.order}</div><div><div class="eyebrow">${reviewLabel}</div><h1>${esc(week.title)}</h1><p>${esc(week.overview || '')}</p></div></div></div>${week.objectives?.length ? `<div class="card"><h3>Learning goals</h3><ul class="objectives">${week.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>` : ''}${week.concepts?.length ? `<div class="card"><h3>Concept explorer</h3><div class="concept-grid">${week.concepts.map((c) => `<div class="concept" id="concept-${esc(c.id)}"><h4>${esc(c.name)}</h4><p>${esc(c.definition)}</p></div>`).join('')}</div></div>` : ''}${teachingSections.map((section) => `<div class="card teaching-section"><h3>${esc(section.title)}</h3>${sectionBodyMarkup(section)}</div>`).join('')}${features.ontology !== false ? weekConnectionsMarkup(week, course) : ''}${features.practice !== false ? activitiesMarkup(week) : ''}${features.flashcards !== false ? flashcardsMarkup(week) : ''}${features.knowledgeChecks !== false ? quizMarkup(week) : ''}${masteryMarkup(week)}<div class="card"><button class="complete-btn" type="button" data-complete="${esc(week.id)}">Mark ${esc(contentLabel)} complete</button></div></section>`;
}

const runtime = String.raw`
const state={completed:new Set()};
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const qs=(s,r=document)=>r.querySelector(s);
function showFeedback(activity,message,good=null){const box=qs('.activity-feedback',activity);if(!box)return;box.textContent=message;box.className='activity-feedback show '+(good===true?'good':good===false?'bad':'neutral');}
function updateProgress(){const total=DATA.weeks.length||1;const pct=Math.round(state.completed.size/total*100);document.getElementById('progressText').textContent=pct+'%';document.getElementById('progressBar').style.width=pct+'%';}
function activate(id){const valid=id==='home'||DATA.weeks.some(w=>w.id===id);const target=valid?id:'home';qsa('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===target));qsa('[data-open]').forEach(x=>x.classList.toggle('active',x.dataset.open===target));const w=DATA.weeks.find(x=>x.id===target);history.replaceState(null,'',w?'?week='+encodeURIComponent(w.order):location.pathname);window.scrollTo({top:0,behavior:'smooth'});}
qsa('[data-open]').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.open)));
qsa('[data-complete]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.complete;if(state.completed.has(id)){state.completed.delete(id);b.classList.remove('done');b.textContent='Mark '+DATA.contentLabel+' complete';}else{state.completed.add(id);b.classList.add('done');b.textContent='✓ '+DATA.contentLabel+' completed';}updateProgress();}));
qsa('.reveal').forEach(b=>b.addEventListener('click',()=>{const card=b.closest('.flashcard');card.classList.toggle('revealed');b.textContent=card.classList.contains('revealed')?'Hide answer':'Reveal answer';}));
qsa('.quiz-q').forEach(box=>{qsa('.option',box).forEach(btn=>btn.addEventListener('click',()=>{if(box.dataset.locked)return;box.dataset.locked='1';const ans=Number(box.dataset.answer);qsa('.option',box).forEach((x,i)=>x.classList.add(i===ans?'correct':(x===btn?'wrong':'')));qs('.feedback',box)?.classList.add('show');}));});
qsa('[data-check-classification]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.closest('.activity');const items=qsa('[data-classify-item]',a);let right=0;items.forEach(x=>{const ok=x.value===x.dataset.answer;if(ok)right++;x.style.borderColor=ok?'var(--good)':'var(--bad)';});const ok=right===items.length;showFeedback(a,ok?'Correct. Every item is classified appropriately.':right+' of '+items.length+' correct. Review the categories and try again.',ok);}));
qsa('[data-check-matching]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.closest('.activity');const items=qsa('[data-match-item]',a);let right=0;items.forEach(x=>{const ok=x.value===x.dataset.answer;if(ok)right++;x.style.borderColor=ok?'var(--good)':'var(--bad)';});const ok=right===items.length;showFeedback(a,ok?'Correct. All pairs match.':right+' of '+items.length+' matches are correct.',ok);}));
qsa('[data-reset-activity]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.closest('.activity');qsa('select',a).forEach(x=>{x.value='';x.style.borderColor='';});const f=qs('.activity-feedback',a);if(f){f.className='activity-feedback';f.textContent='';}}));
qsa('[data-order-list]').forEach(list=>{list.dataset.initial=[...list.children].map(x=>x.dataset.orderId).join('|');qsa('[data-move]',list).forEach(btn=>btn.addEventListener('click',()=>{const row=btn.closest('.order-item');if(btn.dataset.move==='up'&&row.previousElementSibling)list.insertBefore(row,row.previousElementSibling);if(btn.dataset.move==='down'&&row.nextElementSibling)list.insertBefore(row.nextElementSibling,row);qsa('.order-item',list).forEach((x,i)=>qs('.order-index',x).textContent=i+1);}));});
qsa('[data-check-order]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.closest('.activity');const list=qs('[data-order-list]',a);const actual=qsa('.order-item',list).map(x=>x.dataset.orderId);let expected=[];try{expected=JSON.parse(list.dataset.correct||'[]')}catch{}const ok=actual.length===expected.length&&actual.every((x,i)=>x===expected[i]);showFeedback(a,ok?'Correct sequence.':'Not yet. Reorder the steps and check again.',ok);}));
qsa('[data-reset-order]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.closest('.activity');const list=qs('[data-order-list]',a);const ids=(list.dataset.initial||'').split('|');ids.forEach(id=>{const row=qsa('.order-item',list).find(x=>x.dataset.orderId===id);if(row)list.appendChild(row);});qsa('.order-item',list).forEach((x,i)=>qs('.order-index',x).textContent=i+1);const f=qs('.activity-feedback',a);if(f)f.className='activity-feedback';}));
qsa('[data-choice-list]').forEach(list=>{const a=list.closest('.activity');qsa('.activity-choice',list).forEach(btn=>btn.addEventListener('click',()=>{if(list.dataset.locked)return;list.dataset.locked='1';const answer=Number(list.dataset.answer);const chosen=Number(btn.dataset.choiceIndex);qsa('.activity-choice',list).forEach((x,i)=>x.classList.add(i===answer?'correct':(i===chosen?'wrong':'')));const extra=a.dataset.feedback||'';showFeedback(a,(chosen===answer?'Correct. ':'Review this decision. ')+extra,chosen===answer);}));});
qsa('[data-reveal-activity]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.closest('.activity');a.classList.toggle('revealed');btn.textContent=a.classList.contains('revealed')?'Hide guidance':'Reveal guidance';}));
function tokenize(expr){const out=[];const re=/\s*([A-Za-z_][A-Za-z0-9_]*|\d*\.?\d+(?:[eE][+-]?\d+)?|[()+\-*/^,])/gy;let m,pos=0;while((m=re.exec(expr))){if(m.index!==pos&&expr.slice(pos,m.index).trim())throw Error('invalid');out.push(m[1]);pos=re.lastIndex;}if(expr.slice(pos).trim())throw Error('invalid');return out;}
function calcExpression(expr,vars){const t=tokenize(expr);let i=0;const peek=()=>t[i],take=()=>t[i++];function primary(){const x=take();if(x==='('){const v=add();if(take()!==')')throw Error('paren');return v;}if(/^\d/.test(x||''))return Number(x);if(/^[A-Za-z_]/.test(x||'')){if(peek()==='('){take();const args=[];if(peek()!==')'){args.push(add());while(peek()===','){take();args.push(add());}}if(take()!==')')throw Error('func');if(x==='sqrt')return Math.sqrt(args[0]);if(x==='abs')return Math.abs(args[0]);if(x==='round')return Math.round(args[0]);if(x==='pow')return Math.pow(args[0],args[1]);throw Error('func');}if(!(x in vars))throw Error('var');return Number(vars[x]);}if(x==='-')return-primary();throw Error('token');}function power(){let v=primary();while(peek()==='^'){take();v=Math.pow(v,primary());}return v;}function mul(){let v=power();while(peek()==='*'||peek()==='/'){const op=take(),r=power();v=op==='*'?v*r:v/r;}return v;}function add(){let v=mul();while(peek()==='+'||peek()==='-'){const op=take(),r=mul();v=op==='+'?v+r:v-r;}return v;}const result=add();if(i!==t.length||!Number.isFinite(result))throw Error('calc');return result;}
qsa('[data-calculate]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.closest('.activity');const vars={};qsa('[data-calc-var]',a).forEach(x=>vars[x.dataset.calcVar]=Number(x.value));try{const result=calcExpression(btn.dataset.expression||'',vars);const precision=Number(btn.dataset.precision||3);const resultBox=qs('[data-calc-result]',a);const label=(resultBox.textContent.split(':')[0]||'Result').trim();resultBox.textContent=label+': '+Number(result.toFixed(precision));showFeedback(a,a.dataset.feedback||'Calculation complete.',true);}catch{showFeedback(a,'The calculation could not be completed with these values.',false);}}));
const param=new URLSearchParams(location.search).get('week');const found=DATA.weeks.find(w=>String(w.order)===param||w.id===param);activate(found?.id||'home');updateProgress();
`;

export function renderCourseHtml(course) {
  const meta = course.metadata || {};
  const theme = normalizeTheme(meta.styleId);
  const features = meta.features || {};
  const weeks = (course.weeks || []).slice().sort((a, b) => a.order - b.order);
  const contentLabel = meta.contentLabel || 'Week';
  const pluralContentLabel = `${contentLabel}s`;
  const singleItem = weeks.length <= 1;
  const summary = meta.intro || (singleItem
    ? `Explore this ${contentLabel}, practice key concepts, and see how the ideas connect.`
    : `Explore ${weeks.length} ${pluralContentLabel}, practice key concepts, and see how ideas connect across the course.`);
  const mapTitle = singleItem ? 'Concept Map' : 'Course Knowledge Map';
  const mapDescription = singleItem
    ? `See how key concepts in this ${contentLabel} connect.`
    : 'Explore how important concepts connect within and across the course.';
  const metadataItems = [
    ['Course code', meta.courseCode],
    ['Term', meta.term],
    ['Level', meta.academicLevel],
    ['Discipline', meta.studentDiscipline]
  ].filter(([, value]) => value);
  const metadataMarkup = metadataItems.length ? `<div class="meta-grid">${metadataItems.map(([label, value]) => `<div class="meta-item"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>` : '';
  const data = { publicId: meta.publicId, contentLabel, weeks: weeks.map((w) => ({ id: w.id, order: w.order, title: w.title })) };
  const home = `<section class="view" id="home" data-view="home"><div class="hero"><div class="eyebrow">COURSE START</div><h1>${esc(meta.title || 'Course')}</h1><p>${esc(summary)}</p>${meta.professorName ? `<div class="prof">Professor ${esc(meta.professorName)}</div>` : ''}${metadataMarkup}</div><div class="section"><div class="section-head"><div><h2>Choose a ${esc(contentLabel)}</h2><p>Open the course material in the sequence recommended by your professor.</p></div></div><div class="week-grid">${weeks.map((w) => `<button type="button" class="week-card" data-open="${esc(w.id)}"><span class="week-no">${w.isReviewWeek ? 'REVIEW' : `${contentLabel.toUpperCase()} ${w.order}`}</span><h3>${esc(w.title)}</h3><p>${esc(w.overview || `Open this ${contentLabel}`)}</p></button>`).join('')}</div></div>${features.ontology !== false ? `<div class="card" id="knowledge-map"><div class="section-head"><div><h2>${esc(mapTitle)}</h2><p>${esc(mapDescription)}</p></div></div>${conceptMap(course)}</div>` : ''}<div class="card"><h3>How to use this course</h3><p>Learn the concepts first, then use the practice activities and knowledge checks to test your understanding. Use Knowledge Connections when you need to see how ideas build on, contrast with, or support one another.</p></div><div class="card privacy"><div class="privacy-note"><div class="privacy-mark">P</div><div><h3 style="margin:0 0 4px">Privacy</h3><p style="margin:0">No student account is required. Answers and progress stay only in the current page session and are cleared when the page is refreshed or closed.</p></div></div></div></section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="course-builder-runtime" content="1.8.0"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(meta.title || 'Course')}</title><style>${css}</style></head><body class="theme-${esc(theme)}"><header class="topbar"><div class="top-inner"><div class="brand">${esc(initials(meta.courseCode || meta.title))}</div><div class="course-mini"><strong>${esc(meta.courseCode || meta.title || 'Course')}</strong><span>${esc([meta.term, meta.professorName].filter(Boolean).join(' · '))}</span></div><nav class="top-nav"><button class="nav-btn" data-open="home" type="button">Start</button>${weeks.map((w) => `<button class="nav-btn" data-open="${esc(w.id)}" type="button">${w.isReviewWeek ? 'Review' : `${contentLabel} ${w.order}`}</button>`).join('')}</nav></div></header><div class="shell"><aside class="sidebar"><div class="side-card"><div class="side-title">Course</div><button class="week-nav" data-open="home" type="button">Start page</button>${weeks.map((w) => `<button class="week-nav" data-open="${esc(w.id)}" type="button">${w.isReviewWeek ? 'Review' : `${contentLabel} ${w.order}`} · ${esc(w.title)}</button>`).join('')}<div class="progress-wrap"><div class="progress-label"><span>Course progress</span><span id="progressText">0%</span></div><div class="progress"><span id="progressBar"></span></div></div></div></aside><main class="main">${home}${weeks.map((w) => weekMarkup(w, features, course)).join('')}<footer class="footer">Course ID ${esc(meta.publicId || '')}</footer></main></div><script>const DATA=${js(data)};${runtime}</script></body></html>`;
}
