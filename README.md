# Lost & Found Portal

A campus Lost & Found web portal built as a cloud computing course project.

## Architecture

- **Frontend:** React + Vite + Tailwind CSS, served from an S3 static website bucket.
- **Backend:** Node.js Lambda function with a Function URL, storing data as JSON in a private S3 bucket.
- **Auth:** Custom PBKDF2 + HMAC tokens (no external auth service).

See [SPEC.md](SPEC.md) for the full project specification.

## Setup

### Backend

```bash
cd backend
npm install
```

Deploy by zipping the backend folder (including `node_modules`) and uploading to Lambda.
Handler: `index.handler`.

### Frontend

```bash
cd frontend
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

Upload the **contents** of `dist/` to the root of the S3 site bucket.

### Environment Variables

| Name | Where | Purpose |
|---|---|---|
| `DATA_BUCKET` | Lambda env var | Private S3 data bucket name |
| `TOKEN_SECRET` | Lambda env var | Secret for signing tokens |
| `ADMIN_KEY` | Lambda env var | Secret for admin actions |
| `ALLOWED_EMAIL_DOMAIN` | Lambda env var (optional) | Restrict registration to one domain |
| `VITE_API_URL` | `frontend/.env` | Lambda Function URL |
