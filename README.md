# Resumo

An AI-powered job matching platform.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (with `pgvector` extension enabled)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env` (see `.env.example`)
4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL & Prisma ORM
- **Authentication**: Auth.js (NextAuth v5)
- **Validation**: Zod
- **UI Components**: shadcn/ui

## Architecture
(Detailed architecture diagram and description will be added here in subsequent phases.)
