# FinCore — Digital Wallet, Ledger & Payment Processing Platform

An educational FinTech application using synthetic users and simulated funds only. It is not connected to banks or real payment rails.

## Included implementation
- Next.js + TypeScript customer dashboard
- Express REST API with Prisma and PostgreSQL
- Wallets, beneficiaries, transfers, transaction history and ledger entries
- Atomic double-entry transfer logic with idempotency keys
- Python FastAPI risk-scoring service using synthetic transaction data
- Docker Compose for PostgreSQL, Redis, API and analytics service
- Basic API tests and environment template

> Scope note: This is a runnable MVP foundation, not a claim that all 15 advanced assessments in the supplied handbook are complete. Production-grade MFA, provider integrations, webhook signature verification, full RBAC, dispute workflows, CI/CD, deployment hardening, reconciliation and full test coverage remain extension tasks.

## Requirements
- Node.js 20+
- npm
- Python 3.11+ (for analytics without Docker)
- Docker Desktop (recommended)

## Quick start with Docker
1. Copy `.env.example` to `.env` and update local-only values.
2. Run `docker compose up --build`.
3. In another terminal, run database migration and seed:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev --name init
   npm run db:seed
   ```
4. Frontend: `cd frontend && npm install && npm run dev`
5. Open http://localhost:3000. API health: http://localhost:4000/health. Analytics: http://localhost:8000/health.

## Run services separately
### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```
### Frontend
```bash
cd frontend
npm install
npm run dev
```
### Analytics
```bash
cd analytics
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Demo API
- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/wallets` (Bearer token)
- `POST /api/wallets` (Bearer token)
- `POST /api/beneficiaries` (Bearer token)
- `GET /api/transfers` (Bearer token)
- `POST /api/transfers` (Bearer token; requires `Idempotency-Key` header)
- `GET /api/ledger` (Bearer token)

Transfer body:
```json
{ "toWalletId": "WALLET_ID", "amount": "125.50", "currency": "INR", "description": "Demo transfer" }
```

## Important safety and design notes
- All amounts are represented as decimal strings at API boundaries and Prisma Decimal in the database.
- Transfer debit, credit, ledger postings and transfer record are committed in one database transaction.
- Every transfer has two ledger postings: one debit and one credit.
- Idempotency keys prevent the same authenticated user from submitting the same transfer twice.
- The analytics risk score is decision support only; it is not proof of fraud.
- Use synthetic data only. Do not add real banking credentials, payment keys or personal financial data.
- Never commit `.env`; only `.env.example` belongs in Git.

## Suggested next milestones from the handbook
1. Add MFA simulation, refresh-token rotation and full role/resource authorization.
2. Add payment intents, refunds, reversals and dispute case workflow.
3. Add signed sandbox webhooks, event deduplication and reconciliation.
4. Add Redis/BullMQ retry-safe background jobs and dead-letter recovery.
5. Add Jest/Supertest, frontend tests, Pytest and Playwright coverage.
6. Add OpenAPI/Postman docs, GitHub Actions, Docker hardening, monitoring and deployment evidence.
