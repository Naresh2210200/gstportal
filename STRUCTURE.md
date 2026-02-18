# Project Structure

## 📂 Frontend (Root Directory)
- `index.html`: Main entry point with importmap and Tailwind CDN.
- `index.tsx`: React mounting logic.
- `App.tsx`: Routing and global state management.
- `types.ts`: Shared TypeScript interfaces for Users, Uploads, and Logs.
- **📁 pages/**:
  - `Login.tsx`: Multi-role login entry.
  - **📁 ca/**: Dashboard and Party-specific workspaces (Automation Tool, GSTR Verification).
  - **📁 customer/**: File upload portal and history tracking.
- **📁 services/**:
  - `db.ts`: LocalStorage mock DB (for frontend prototyping).
  - `gemini.ts`: Integration with Google Gemini API for AI validation.
  - `gstr1Processor.ts`: Logic for generating Excel blobs using `xlsx`.

## 📂 Backend (`camate-backend/`)
- **📁 camate/**: Core project settings and URL configuration.
  - `settings/`: Split into `base.py`, `development.py`, and `production.py`.
- **📁 apps/**:
  - `auth_app/`: Handles CA/Customer registration and JWT authentication. Contains the `TenantMiddleware` for DB routing.
  - `users/`: Tenant-level customer profiles.
  - `uploads/`: Metadata for files stored in R2.
  - `outputs/`: Records of generated GSTR1 reports and verification logs.
- **📁 services/**:
  - `db_router.py`: **Crucial Logic**. Manages dynamic multi-tenant routing and physical DB creation.
  - `r2.py`: Interface for Cloudflare R2 (Presigned URLs, content streaming).
  - `fastapi_client.py`: Bridge to the heavy-processing microservice.

## 🗄️ Database Architecture
1. **Master DB (`default`)**: Contains `ca_firms` (The registry of all tenants).
2. **Tenant DBs (`ca_{code}_db`)**: Contains `customers`, `uploads`, and `outputs` for a specific CA firm only.
