# D&D Master Tools

A comprehensive full-stack web application for D&D campaign management, featuring AI-powered character generation, NPC creation, world building, and more.

## 🚀 Features

### Core Tools
- **Character Generator** - Create detailed D&D characters with balanced stats and PDF export
- **NPC Generator** - Generate memorable NPCs with personalities and motivations
- **World Lore Builder** - Build rich worlds with detailed lore and geography
- **Item Generator** - Create unique weapons, armor, and magical items
- **Quest Builder** - Design engaging quests with objectives and rewards
- **Encounter Creator** - Build balanced encounters with appropriate challenges
- **Auto-Save System** - All generated content is automatically saved with 30-day expiration

### Technical Features
- **Modern Stack** - Next.js 15 with App Router and TypeScript
- **Authentication** - JWT-based authentication with secure cookies
- **Database** - PostgreSQL with Prisma ORM
- **Payments** - Paystack integration for token purchases
- **AI Generation** - OpenRouter API for content generation
- **Auto-Save System** - Automatic content saving with 30-day expiration
- **PDF Export** - Puppeteer-based PDF generation
- **Styling** - Tailwind CSS for modern, responsive design
- **Protected Routes** - Middleware-based route protection

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Lucide React icons
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Payments**: Paystack
- **AI**: OpenRouter API, StableHorde for images
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
dnd-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   └── auth/         # Authentication endpoints
│   │   ├── dashboard/         # Protected dashboard pages
│   │   │   ├── character-generator/
│   │   │   ├── npc-generator/
│   │   │   ├── world-builder/
│   │   │   ├── item-generator/
│   │   │   ├── quest-builder/
│   │   │   └── encounter-creator/
│   │   ├── login/            # Authentication pages
│   │   ├── register/
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Landing page
│   ├── lib/                  # Utility functions
│   │   ├── auth.ts          # JWT authentication
│   │   ├── db.ts            # Prisma database
│   │   ├── tokens.ts        # Token management
│   │   ├── queue.ts         # AI request queue
│   │   └── utils.ts         # Common utilities
│   └── middleware.ts         # Route protection
├── prisma/                   # Database schema
│   └── schema.prisma
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Paystack account (for payments)
- OpenRouter API key (for AI generation)
- StableHorde API key (for image generation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dnd-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # (Optional) Open Prisma Studio
   npx prisma studio
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The application uses PostgreSQL with the following main models:

- **User** - User accounts and authentication
- **Character** - Generated D&D characters
- **NPC** - Non-player characters
- **World** - Campaign worlds and lore
- **Item** - Weapons, armor, and magical items
- **Quest** - Campaign quests and objectives
- **Encounter** - Combat encounters and challenges
- **Campaign** - Campaign organization
- **TokenTransaction** - Token usage tracking

## 🔐 Authentication

The app uses JWT-based authentication with secure HTTP-only cookies:

- **Registration** - `/api/auth/register`
- **Login** - `/api/auth/login`
- **Logout** - `/api/auth/logout`
- **Protected Routes** - Middleware automatically redirects unauthenticated users

## 💳 Payments

Paystack integration for token purchases:

- **Token System** - Users purchase tokens for AI generation
- **Paystack Integration** - Secure payment processing
- **Webhook Handling** - Automatic token crediting

## 🎨 UI Components

The application features a modern, responsive design with:

- **Landing Page** - Hero section with feature highlights
- **Dashboard** - Protected area with tool navigation
- **Tool Pages** - Individual generators with forms and previews
- **Authentication** - Clean login/register forms
- **Token Management** - Purchase and balance tracking

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma database GUI

### Code Style

- **TypeScript** - Strict type checking enabled
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting (if configured)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@dndmastertools.com or create an issue in the repository.

## 🔮 Roadmap

- [ ] Advanced AI content generation
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Team collaboration features
- [ ] API for third-party integrations
- [ ] Custom theme support
- [ ] Offline mode
- [ ] Multi-language support

---

Built with ❤️ for the D&D community
