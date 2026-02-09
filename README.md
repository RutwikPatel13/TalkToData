# TalkToData 🗣️📊

A modern, AI-powered SQL query interface that lets you talk to your databases using natural language. Built with Next.js 16, React 19, and powered by Groq's LLM API.

![TalkToData](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### 🤖 AI-Powered Query Generation
- **Natural Language to SQL**: Type questions in plain English and get SQL queries generated automatically
- **Query Explanation**: Get detailed explanations of what any SQL query does
- **Error Fixing**: AI-assisted SQL error detection and automatic fixes
- **Chart Suggestions**: AI recommends the best visualization for your data

### 🗄️ Multi-Database Support
- **PostgreSQL** - Full support with SSL
- **MySQL** - Complete MySQL/MariaDB compatibility
- **SQLite** - Local file-based databases
- **SQL Server** - Microsoft SQL Server support
- **MongoDB** - NoSQL document database support

### 📊 Data Visualization
- **Interactive Tables**: Sortable, paginated data tables with TanStack Table
- **Charts**: Bar, Line, and Pie charts powered by Recharts
- **Export Options**: Copy results or export to various formats

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Automatic theme detection with manual toggle
- **Monaco Editor**: VS Code-like SQL editing experience with syntax highlighting
- **Schema Explorer**: Visual database schema browser with table/column details
- **Query Tabs**: Multiple query tabs with drag-and-drop reordering
- **Query History**: Track and re-run previous queries

## 🚀 Live Demo

Try it now: **[talktodata.vercel.app](https://talktodata.vercel.app)**

Click "Try Demo Database" to connect to a sample PostgreSQL database and start querying!

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | Radix UI, Lucide Icons |
| **SQL Editor** | Monaco Editor |
| **Data Tables** | TanStack Table |
| **Charts** | Recharts |
| **AI/LLM** | Groq API (Llama 3) |
| **Session** | Iron Session (encrypted cookies) |
| **Validation** | Zod |
| **Deployment** | Vercel |

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm
- A Groq API key ([Get one free](https://console.groq.com))

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/RutwikPatel13/TalkToData.git
   cd TalkToData/talktodata
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file:
   ```env
   # Required: Session encryption key (32+ characters)
   SESSION_SECRET=your-super-secret-key-at-least-32-characters

   # Required: Groq API key for AI features
   GROQ_API_KEY=gsk_your_groq_api_key_here

   # Optional: Demo database credentials (for "Try Demo" feature)
   DEMO_DB_HOST=your-demo-db-host
   DEMO_DB_PORT=5432
   DEMO_DB_NAME=postgres
   DEMO_DB_USER=your-username
   DEMO_DB_PASSWORD=your-password
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | ✅ | 32+ character secret for session encryption |
| `GROQ_API_KEY` | ✅ | API key from [Groq Console](https://console.groq.com) |
| `DEMO_DB_HOST` | ❌ | Demo database host |
| `DEMO_DB_PORT` | ❌ | Demo database port |
| `DEMO_DB_NAME` | ❌ | Demo database name |
| `DEMO_DB_USER` | ❌ | Demo database username |
| `DEMO_DB_PASSWORD` | ❌ | Demo database password |

### Supported Database Connections

| Database | Default Port | SSL Support |
|----------|--------------|-------------|
| PostgreSQL | 5432 | ✅ |
| MySQL | 3306 | ✅ |
| SQL Server | 1433 | ✅ |
| SQLite | N/A | N/A |
| MongoDB | 27017 | ✅ |

## 📁 Project Structure

```
talktodata/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── connect/       # Database connection
│   │   │   ├── demo-connect/  # Demo database connection
│   │   │   ├── execute/       # SQL execution
│   │   │   ├── generate/      # AI SQL generation
│   │   │   ├── explain/       # AI query explanation
│   │   │   ├── fix/           # AI error fixing
│   │   │   ├── chart-suggest/ # AI chart suggestions
│   │   │   ├── schema/        # Database schema
│   │   │   └── session/       # Session management
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   ├── components/            # React components
│   │   ├── connection/        # Connection modal
│   │   ├── history/           # Query history
│   │   ├── layout/            # Navbar, layout
│   │   ├── onboarding/        # Onboarding tour
│   │   ├── query/             # Query input, tabs, SQL editor
│   │   ├── results/           # Results table, charts
│   │   ├── schema/            # Schema explorer
│   │   └── ui/                # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and services
│   │   ├── db/               # Database adapters
│   │   ├── llm/              # LLM integration (Groq)
│   │   ├── session/          # Session management
│   │   ├── utils/            # Utility functions
│   │   └── validators/       # Input validation (Zod)
│   ├── providers/            # React context providers
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
├── scripts/                  # Database seed scripts
└── package.json
```

## 🔒 Security Features

- **No credentials stored client-side**: Database passwords never reach the browser
- **Encrypted sessions**: Iron Session with secure cookie encryption
- **SQL injection prevention**: Query validation and sanitization
- **Dangerous query detection**: Blocks DROP, DELETE, TRUNCATE without WHERE clauses
- **Rate limiting**: API endpoint protection
- **SSL support**: Encrypted database connections

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RutwikPatel13/TalkToData)

### Environment Variables for Production

Make sure to set these in your Vercel project settings:
- `SESSION_SECRET`
- `GROQ_API_KEY`
- `DEMO_DB_*` variables (if using demo feature)

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Groq](https://groq.com/) - Fast AI inference
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components
- [TanStack Table](https://tanstack.com/table) - Powerful table library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code editor
- [Recharts](https://recharts.org/) - Charting library

---

Built with ❤️ by [Rutwik Patel](https://github.com/RutwikPatel13)
