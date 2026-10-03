# Professor Course Builder — complete mock-first MVP

A Chrome Manifest V3 extension + central Node API + reusable static course renderer for the workflow:

```text
Professor uploads syllabus (optional) + course materials
                    ↓
             Central API
                    ↓
         AI course generation
                    ↓
       Professor preview/review
                    ↓
             Publish button
                    ↓
  One GitHub repo → one Render account
                    ↓
<course-name>-<random-id>.onrender.com
```

The project is deliberately **mock-first**. It runs locally without GitHub, Render, OpenAI, payment, auth, or database credentials. All real services sit behind adapters so you can replace them one at a time.

## What is included

- Chrome extension using **Manifest V3** and the Chrome side panel.
- Optional syllabus upload.
- Multiple teaching-material uploads: PDF, PPTX, DOCX, TXT, MD.
- Random non-semantic 8-character public course IDs.
- Render-style names such as `biostatistics-7kq4m2ab.onrender.com`.
- Five professor-selectable designs:
  1. **Academic** — persistent module sidebar.
  2. **Modern** — bright card navigation.
  3. **Dark Focus** — immersive low-glare reading mode.
  4. **Notebook** — warm study-notes presentation.
  5. **Executive** — polished professional/graduate layout.
- Three-stage workflow: **Create → Build/Preview → Publish**.
- Course ontology data model and lightweight concept-relation view.
- Interactive knowledge checks, activities, cumulative review, progress tracking and search.
- Mock AI generator for testing without API spend.
- Optional OpenAI server-side adapter.
- Mock GitHub adapter that writes `courses/<ID>/course.json` locally.
- Real GitHub adapter that commits the same course JSON into one repository.
- Mock Render adapter that returns the expected URL without actually deploying.
- Real Render adapter that creates one static site per course from the same repository.
- Course-specific Render build filters to avoid rebuilding every course after a single professor updates one course.
- Mock central database, payment and auth adapters.
- GitHub Actions test workflow.
- Render Blueprint starter for the central API.

## Architecture

```text
Chrome Extension
      │
      │ HTTPS only in production
      ▼
Central Node API
      │
      ├── Auth adapter       [mock → real later]
      ├── Payment adapter    [mock → real later]
      ├── Database adapter   [mock → central DB later]
      ├── File extraction
      ├── AI adapter         [mock → OpenAI later]
      ├── Course/ontology generator
      ├── Preview renderer
      ├── GitHub adapter     [mock → one repo]
      └── Render adapter     [mock → one Render workspace]
                                  │
                                  ├── biostatistics-7kq4m2ab.onrender.com
                                  ├── biostatistics-p9x3lb7q.onrender.com
                                  └── anatomy-m8tr2qkp.onrender.com
```

There is **no database per course** and **no repo per course**. The course website is generated from one course JSON file and the shared renderer.

## Local test — from zero

### 1. Requirements

- Node.js 20+
- Chrome/Edge/another Chromium browser supporting MV3 side panels

### 2. Configure

```bash
cp .env.example .env
npm install
```

Leave all provider values as `mock`.

### 3. Start the central API

```bash
npm start
```

Open:

```text
http://localhost:8787/api/health
```

You should see all providers listed as `mock`.

### 4. Load the extension

In Chrome/Edge:

1. Open Extensions.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select `apps/extension` from this repository.
5. Pin the extension if desired.
6. Click the extension icon. It opens in the browser side panel.

Chrome's current Side Panel API is available to Manifest V3 extensions and uses the `sidePanel` permission. See: https://developer.chrome.com/docs/extensions/reference/api/sidePanel

### 5. Test a professor flow

1. Course name: `Biostatistics`.
2. Course code: `BIO350`.
3. Term: `Fall 2026`.
4. Upload a PPTX/PDF/DOCX, or use a syllabus alone.
5. Select a design.
6. Click **Create course draft**.
7. Click **Build course**.
8. Click **Preview** and inspect the generated interactive site.
9. Click **Publish to Render**.

Because Render is mocked, the extension returns an expected URL such as:

```text
https://biostatistics-7kq4m2ab.onrender.com
```

but clearly labels it as a mock deployment. The generated course JSON is written locally to:

```text
courses/7KQ4M2AB/course.json
```

## Test the course renderer without the extension

```bash
npm run seed:sample
COURSE_ID=SAMPLE01 npm run build:course
```

Then open `dist/index.html` in a browser.

Try another design by changing `metadata.styleId` in `courses/SAMPLE01/course.json` to one of:

```text
academic
modern
dark-focus
notebook
executive
```

and rebuild.

## How the public ID works

Internally you can later use database UUIDs. The public course ID is a separate 8-character identifier using an alphabet that avoids confusing characters such as `0/O` and `1/I/L`.

Example:

```text
Internal ID: crs_783f...              (never used in a public URL)
Public ID:   7KQ4M2AB
Course name: Biostatistics
Render name: biostatistics-7kq4m2ab
Public URL:  https://biostatistics-7kq4m2ab.onrender.com
```

Two professors can both teach `Biostatistics`; their random IDs keep the services unique.

## Why the extension never contains provider keys

The extension only knows the central API URL. It never receives:

- OpenAI API keys
- GitHub tokens
- Render API keys
- database credentials
- payment secrets

Those stay in the server-side Render environment.

## One GitHub repo / one Render account

### GitHub layout

```text
repository/
├── apps/
│   ├── api/
│   └── extension/
├── packages/
│   └── course-renderer/
├── courses/
│   ├── 7KQ4M2AB/course.json
│   └── P9X3LB7Q/course.json
├── scripts/
│   └── build-course.js
└── package.json
```

### Render course service configuration

Each course static site uses the same repo and roughly these settings:

```text
Environment variable:
COURSE_ID=7KQ4M2AB

Build command:
npm install && npm run build:course

Publish directory:
dist
```

Render currently supports static sites, monorepo configuration, root directories/build filtering, and service creation through its API. Current documentation:

- https://render.com/docs/monorepo-support
- https://api-docs.render.com/reference/create-service
- https://render.com/docs/static-sites

The included Render adapter sends a **course-specific build filter**:

```text
courses/7KQ4M2AB/**
packages/course-renderer/**
scripts/build-course.js
package.json
package-lock.json
```

This means changing only Professor A's course data should not force Professor B's course to rebuild. Changing the shared renderer intentionally matches every service so platform-wide design fixes can roll out to all courses.

## Connecting your new GitHub + Render accounts

Use `REPLACEMENT_CHECKLIST.md`. The high-level order is:

1. Create the new GitHub repository.
2. Push this complete project.
3. Create your new Render workspace/account.
4. Connect Render to that GitHub account/repository.
5. Deploy the central API from the repo.
6. Create a Render API key.
7. Copy the Render workspace ID.
8. Add server-side environment values.
9. Switch `GITHUB_PROVIDER=github`.
10. Switch `RENDER_PROVIDER=render`.
11. Update the extension's API URL in its Settings screen.
12. Test with one throwaway course before allowing real professors.

## Connecting the AI

The OpenAI adapter is already present but disabled by default.

Server environment only:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=<your server-side key>
OPENAI_MODEL=<model available to your account>
```

The implementation uses the current OpenAI **Responses API** via the official Node SDK. OpenAI recommends Responses for new projects. Current documentation: https://developers.openai.com/api/docs/guides/migrate-to-responses

Do not switch this on for paying users until you add stronger schema validation, usage metering, retries and quality checks.

## What is intentionally mocked

| Component | MVP behavior | Production replacement |
|---|---|---|
| Auth | One demo professor | Your auth/session provider |
| Database | `runtime/mock-db.json` | One central Postgres/Supabase/etc. DB |
| Payments | Always permits build | Saudi/global payment gateway + subscriptions |
| AI | Deterministic sample generator | OpenAI or another server-side model provider |
| GitHub | Writes course JSON locally | Commits to the one production repo |
| Render | Returns expected `.onrender.com` URL | Creates/updates actual static site services |
| Upload storage | Local `runtime/uploads` | Controlled object storage |

## Files to edit when replacing mocks

- `apps/api/src/adapters/auth.js`
- `apps/api/src/adapters/payment.js`
- `apps/api/src/adapters/database.js`
- `apps/api/src/adapters/ai.js`
- `apps/api/src/adapters/github.js`
- `apps/api/src/adapters/render.js`

The professor-facing extension does **not** need to be rewritten when these are replaced.

## Current generation behavior

The mock generator exists so the entire pipeline can be tested with zero API credentials. It extracts text, creates modules/concepts, generates basic activities/quizzes and builds an ontology. It is not intended to be the final instructional-design intelligence.

With `AI_PROVIDER=openai`, the source material is sent from the server to the AI adapter and returned as structured course JSON. Before commercial release, add:

- strict JSON/schema validation
- source-grounding checks
- factuality/coverage QA
- duplicate concept detection
- syllabus/CLO mapping
- update/diff logic for new weeks
- token and cost limits per subscription plan
- regeneration/version history
- professor approval workflow

## MVP limitations before commercial launch

This package is a **complete runnable architecture/MVP**, not a finished production SaaS. Before charging real professors you still need to connect or implement:

- production authentication
- central production database
- payment/subscription provider
- object storage + retention/deletion policy
- actual GitHub/Render credentials
- production AI credentials and QA
- rate limiting and abuse prevention
- privacy/terms/consent
- audit logging
- backups
- user/account deletion
- monitoring and support tooling

See `SECURITY.md` before enabling public signup.

## Tests

```bash
npm test
```

The GitHub workflow also tests the renderer and builds the sample course.
