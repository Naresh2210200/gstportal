# CAMate Pro - CA Management & Automation Platform

CAMate Pro is a high-performance, multi-tenant workspace designed for Chartered Accountants (CAs) to automate data ingestion, GST verification, and GSTR1 report generation for their clients.

## 🚀 Key Features

- **Multi-Tenant Architecture**: Each CA firm receives a physically isolated PostgreSQL database for maximum data security.
- **AI-Powered Data Mapping**: Uses Google Gemini (Generative AI) to analyze diverse client file formats (Tally, CSV, etc.) and map them to standard GSTR1 templates.
- **Cloud Storage**: Integrated with Cloudflare R2 (S3-compatible) for secure, scalable file hosting with 90-day auto-expiry for raw uploads.
- **Heavy-Lift Offloading**: Offloads Excel generation and GSTIN verification to a high-concurrency FastAPI microservice.
- **Role-Based Access**:
  - **CAs**: Manage multiple client "Parties," trigger automation runs, and download verified reports.
  - **Customers**: Upload monthly financial data and track processing status.

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS, React Router 7, XLSX.js, Google GenAI SDK.
- **Backend**: Django 4.2, Django Rest Framework, SimpleJWT (Auth), Boto3 (R2).
- **Processing**: FastAPI (Integration Client), Psycopg2 (Dynamic Routing).
- **Database**: PostgreSQL (Master Registry + Tenant Silos).

## 🏁 Getting Started

### Prerequisites
- Node.js & npm
- Python 3.10+
- Docker & Docker Compose (for local databases)

### Backend Setup
1. Navigate to `camate-backend/`.
2. Create a `.env` file based on `.env.example`.
3. Start databases: `docker-compose up -d`.
4. Install dependencies: `pip install -r requirements.txt`.
5. Run migrations: `python manage.py migrate`.
6. Start server: `python manage.py runserver`.

### Frontend Setup
1. Open the project root.
2. The frontend is built as an ES6 module application. 
3. Use a local live server (like VS Code Live Server or `npx serve`) to open `index.html`.

## 🤖 AI Integration
The platform uses `gemini-3-flash-preview` for:
- **Validation**: Detecting missing columns or date format errors in raw CSVs.
- **Transformation**: Generating mapping rules to convert legacy accounting exports into standard formats.
