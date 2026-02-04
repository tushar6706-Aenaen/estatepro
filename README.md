# LuxEstate - Modern Real Estate Platform

A production-ready, full-stack real estate application built with Next.js 14+, TypeScript, Supabase, and Tailwind CSS.

## ✨ Features

### For Buyers (Public Users)
- 🏠 Browse luxury property listings with advanced filtering
- 🔍 Search by location, price, bedrooms, bathrooms, and more
- ⚖️ Compare up to 3 properties side-by-side
- 💬 Direct messaging with property agents
- ❤️ Save favorite properties
- 📱 Fully responsive mobile experience

### For Agents
- ➕ Create and manage property listings
- 📸 Upload multiple property images
- 💼 Professional profile management
- 📨 Receive and respond to inquiries via built-in chat
- 📊 View listing status (pending/approved/rejected)
- 🔔 Get feedback from admin reviews

### For Administrators
- ✅ Review and approve property submissions
- 📝 Provide feedback on listings
- 👥 Manage user accounts and roles
- 🛡️ Monitor platform activity
- 🔒 Enforce quality standards

### Technical Highlights
- ⚡ Server-side rendering (SSR) for optimal performance
- 🔐 Secure authentication with email confirmation
- 🎯 Role-based access control (Public/Agent/Admin)
- 💬 Real-time chat with WebSocket subscriptions
- 📱 Mobile-first responsive design
- 🖼️ Optimized image loading
- 🔒 Row Level Security (RLS) on all database operations
- 🛡️ Input validation and XSS protection
- 🚀 Production-ready security headers
- 📊 SEO optimized with metadata

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- A Supabase account ([sign up free](https://supabase.com))

### Installation

1. **Clone and install**
   ```bash
   git clone <your-repo-url>
   cd realestate
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials from [app.supabase.com](https://app.supabase.com):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Run database migrations**
   ```bash
   npx supabase link --project-ref your-project-id
   npx supabase db push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Pre-launch checklist
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Project roadmap
- **[CHAT_FEATURE_PHASES.md](./CHAT_FEATURE_PHASES.md)** - Chat implementation details

## 🏗️ Architecture

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── agent/             # Agent dashboard
│   │   ├── auth/              # Authentication
│   │   ├── chats/             # Chat interface
│   │   ├── onboarding/        # User role selection
│   │   ├── properties/        # Property pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── auth/              # Auth components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # UI components
│   └── lib/                   # Utilities
│       ├── chat/              # Chat client
│       ├── data/              # Data utilities
│       ├── supabase/          # Supabase clients
│       ├── env.ts             # Environment validation
│       ├── utils.ts           # General utilities
│       └── validation.ts      # Input validation
├── supabase/
│   ├── migrations/            # Database migrations
│   └── seed.sql               # Seed data
└── public/                    # Static assets
```

## 🗄️ Database Schema

### Core Tables
- **profiles** - User profiles with roles (public/agent/admin)
- **properties** - Property listings with status (pending/approved/rejected)
- **property_images** - Property image URLs with primary flag
- **chats** - Chat conversations between users and agents
- **messages** - Individual chat messages with real-time updates

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based policies for read/write access
- Secure authentication with email confirmation
- Service role key for admin operations only

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Full check (type + lint)
npm run check

# Build test
npm run build
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy automatically

### Other Platforms
Works on: Netlify, AWS Amplify, Railway, Render

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed instructions.

## 🔒 Security

### Implemented Protections
- ✅ Email validation
- ✅ Password strength requirements (8+ chars, uppercase, lowercase, number)
- ✅ Phone number validation
- ✅ Input sanitization (XSS prevention)
- ✅ SQL injection prevention (via Supabase)
- ✅ CSRF protection (Next.js default)
- ✅ Security headers (HSTS, CSP, X-Frame-Options, etc.)
- ✅ Rate limiting on authentication
- ✅ Session management
- ✅ Row Level Security on all database tables

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Radix UI](https://www.radix-ui.com/) - UI components

## 📧 Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review [documentation](#-documentation)

---

**Built with ❤️ by Tushar**
