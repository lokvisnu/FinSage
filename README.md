# 💰 Personal Finance Advisor

A comprehensive personal finance management application built with **Next.js 15**, featuring an **AI-powered financial advisor** using Google Gemini, real-time expense tracking, asset management, and intelligent financial insights.

![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-blue)
![Google Gemini](https://img.shields.io/badge/Google-Gemini-yellow)

## ✨ Features

### 🤖 AI Financial Advisor

- **Google Gemini Integration**: Powered by Google's latest Gemini 1.5 Flash model
- **Personalized Advice**: AI analyzes your financial data to provide tailored recommendations
- **Rich Markdown Support**: Formatted responses with tables, lists, code blocks, and more
- **Context-Aware**: Uses your actual spending patterns, assets, and liabilities for advice
- **Real-time Chat**: Interactive chat interface with typing indicators

### 📊 Financial Management

- **Expense Tracking**: Log and categorize expenses with date tracking
- **Asset Management**: Track investments, savings, and valuable assets by type
- **Liability Tracking**: Monitor debts, loans, and financial obligations
- **Category Budgeting**: Set and track budgets for expense categories
- **Financial Overview**: Dashboard with net worth and spending insights

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key
- PostgreSQL database (Neon) or SQLite for local development

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd personal-finance
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Google Gemini API (Required)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Database (Optional for local dev - uses SQLite by default)
DATABASE_URL=your_neon_database_url_here

# NextAuth (Optional - auto-generated if not provided)
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
```

4. **Initialize the database**

```bash
# For local development (SQLite)
npm run db:init

# To reset database
npm run db:reset
```

5. **Start the development server**

```bash
npm run dev
```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database

### Local Development (SQLite)

- Automatically uses SQLite for local development
- Database file: `local.db`
- Schema: `db/schema-sqlite.sql`

### Production (Neon PostgreSQL)

- Uses Neon serverless PostgreSQL for production
- Schema: `db/schema.sql`
- Automatic connection pooling

## 🚀 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Deploy**

```bash
npm run deploy
# or
vercel --prod
```

3. **Configure Environment Variables**
   In your Vercel dashboard, add:

- `GOOGLE_GEMINI_API_KEY`
- `DATABASE_URL` (Neon PostgreSQL)
- `JWT_SECRET`

## 🔧 Configuration

### AI Configuration

Customize AI behavior in `src/app/api/advisor/route.ts`:

```typescript
const config = {
  temperature: 0.7, // Creativity (0-1)
  topK: 40, // Token sampling
  topP: 0.9, // Nucleus sampling
  maxOutputTokens: 1000, // Response length
};
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
