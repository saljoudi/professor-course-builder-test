# Security boundaries for the MVP

1. **Never place OpenAI, GitHub, Render, database, or payment secret keys in the Chrome extension.** The extension only stores the URL of your central API.
2. Keep all provider keys in Render environment variables or another server-side secret manager.
3. `AUTH_PROVIDER=mock`, `PAYMENT_PROVIDER=mock`, and `DATABASE_PROVIDER=mock` are for development only. They are intentionally not suitable for real paying professors.
4. The mock database stores data in `runtime/mock-db.json`. Render filesystems are not a production database. Replace it with your central database before production.
5. Uploaded source files are stored in `runtime/uploads` in mock mode. Move them to controlled object storage before production and define retention/deletion rules.
6. Validate ownership server-side for every course action. The MVP already checks the mock owner; preserve that check when replacing authentication.
7. Use least-privilege GitHub credentials. The token only needs the repository permissions required to update course data.
8. Keep the source repository private if course content is not intended to be public source code.
9. Add malware scanning/file validation and stricter MIME checks before accepting public uploads.
10. Add rate limiting, audit logs, backup/restore, privacy notices, terms, and payment-webhook signature validation before commercial launch.
