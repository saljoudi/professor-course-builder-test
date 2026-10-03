# Replace the mocks when the new accounts are ready

## 1. GitHub

Create **one** new repository and push this project to it. Then set these server-side environment variables:

```env
GITHUB_PROVIDER=github
GITHUB_TOKEN=<server-side token>
GITHUB_OWNER=<owner or organization>
GITHUB_REPO=<repo name only>
GITHUB_BRANCH=main
GITHUB_REPO_URL=https://github.com/<owner>/<repo>
```

The GitHub adapter writes generated course data to:

```text
courses/<PUBLIC_ID>/course.json
```

Do not put `GITHUB_TOKEN` in the extension.

## 2. Render

Create the new Render workspace/account and connect it to the GitHub account that owns the repository. Deploy the central API first (the included `render.yaml` is an MVP starting point).

Then create a Render API key and find the workspace ID in Render workspace settings. Set:

```env
RENDER_PROVIDER=render
RENDER_API_KEY=<server-side Render API key>
RENDER_OWNER_ID=<workspace ID>
RENDER_BRANCH=main
RENDER_BUILD_COMMAND=npm install && npm run build:course
RENDER_PUBLISH_PATH=dist
```

Each professor course is created as a Render **static site** using the same repository. Its environment variable is:

```text
COURSE_ID=<random 8-character course ID>
```

Example service name:

```text
biostatistics-7kq4m2ab
```

Expected Render URL:

```text
https://biostatistics-7kq4m2ab.onrender.com
```

The adapter also creates a build filter so updates to one course do not rebuild every course. Shared renderer changes intentionally match all course services.

## 3. OpenAI

When you are ready for real generation:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=<server-side key>
OPENAI_MODEL=<model available to your OpenAI project>
```

The key stays only on the server. The implementation uses the OpenAI Responses API through the official Node SDK.

Before launch, strengthen the prompt/schema validation and add token/usage accounting per professor.

## 4. Central database

The MVP uses:

```env
DATABASE_PROVIDER=mock
```

which writes `runtime/mock-db.json`. Before real users, replace `apps/api/src/adapters/database.js` with your central Postgres/Supabase/etc. implementation. Keep the same methods:

- `listCourses(ownerId)`
- `getCourse(id)`
- `createCourse(course)`
- `updateCourse(id, patch)`
- `createBuild(build)`
- `getBuild(id)`

Suggested production tables: `users`, `subscriptions`, `courses`, `course_builds`, `uploads`, `usage_events`, `audit_events`.

## 5. Payments

The MVP payment adapter always approves builds. Replace `apps/api/src/adapters/payment.js` with your gateway and subscription rules. Keep the interface:

```js
await payment.assertCanBuild(user)
```

Return `{ allowed, plan, reason }`. Validate signed payment webhooks on the server.

## 6. Authentication

Replace the mock identity in `apps/api/src/adapters/auth.js`. Every request must resolve a verified user ID. Do not trust a user ID sent by the browser without validating a session/token.

## 7. File storage

The MVP writes uploads into `runtime/uploads`. Replace with object storage before production. Store only metadata + object keys in the central database. Add deletion/retention rules.

## 8. Extension API URL

After the API is live on Render, open the extension settings and replace:

```text
http://localhost:8787
```

with your central API URL, for example:

```text
https://professor-course-builder-api.onrender.com
```

The extension requests host permission when the professor/admin saves the new API origin.
