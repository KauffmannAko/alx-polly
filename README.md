# ALX Polly 2.0: Modern, Secure, and Insightful Polling App

**ALX Polly** is a comprehensive web application for creating, sharing, and analyzing polls with advanced moderation and user management capabilities.  
It empowers individuals, teams, and organizations to gather opinions, make decisions, and foster discussions in a secure environment.  

The platform is designed for both casual users and administrators, offering robust features such as:  
- ⚡ Real-time poll results with interactive voting  
- 🔒 Advanced role-based access control (Admin/User roles)  
- 💬 Threaded comment system with moderation  
- 🛡️ Comprehensive content moderation tools  
- 👥 User management and banning system  
- 📱 Mobile-friendly and accessible design  
- 🔐 Enterprise-grade security features  

---

## 🎯 Target Users

- **General Users**  
  - Create and vote on polls  
  - Participate in threaded discussions  
  - Manage their own content  

- **Administrators**  
  - Manage users and roles  
  - Moderate polls and comments  
  - Access comprehensive analytics  
  - Ban/unban users  
  - View system statistics  

---

## 💡 Why It Matters

ALX Polly streamlines decision-making, encourages engagement, and provides actionable insights through **real-time voting and threaded discussions**.  
Its **secure, scalable architecture** with advanced moderation ensures privacy, content quality, and reliability for all users.  

## ✨ Current Features

### Core Polling Features
- **Create Polls**: Design custom polls with multiple options and descriptions
- **Vote on Polls**: Participate in polls with real-time result updates
- **View Results**: See live poll results with vote counts and percentages
- **Manage Polls**: View, edit, and delete your created polls via dashboard

### User Management & Authentication
- **Secure Authentication**: Supabase-powered authentication system
- **User Profiles**: Customizable user profiles with role management
- **Role-Based Access**: Admin and User roles with different permissions
- **Account Security**: Secure session management and password protection

### Advanced Discussion System
- **Threaded Comments**: Multi-level comment threads on polls (up to 5 levels deep)
- **Comment Moderation**: Admin approval system for comments
- **Real-time Updates**: Live comment updates and notifications
- **User Interactions**: Reply to comments and engage in discussions

### Administrative Features
- **Admin Dashboard**: Comprehensive overview of system statistics
- **User Management**: View, manage, and moderate all users
- **Content Moderation**: Approve, hide, or delete polls and comments
- **User Banning**: Ban/unban users with reason tracking
- **Analytics**: View detailed statistics on users, polls, votes, and comments
- **Audit Trail**: Track all moderation actions with timestamps and reasons

### Security & Compliance
- **Row Level Security (RLS)**: Database-level security policies
- **Input Validation**: Comprehensive input sanitization and validation
- **OWASP Compliance**: Following OWASP Top 10 security guidelines
- **Audit Logging**: Complete audit trail for all user actions
- **Permission System**: Granular permission-based access control


## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI with Radix UI primitives
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL with Row Level Security
- **State Management**: React Server Components + Client Components
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)

## Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

### Core Tables
```sql
-- User profiles with role management
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  banned_at TIMESTAMPTZ,
  banned_by UUID REFERENCES auth.users(id),
  ban_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Polls with moderation support
CREATE TABLE polls (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  duration INTEGER DEFAULT 7,
  is_approved BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll options
CREATE TABLE options (
  id UUID PRIMARY KEY,
  text TEXT NOT NULL,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Threaded comments with moderation
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  depth INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Security Features
- **Row Level Security (RLS)** enabled on all tables
- **Comprehensive policies** for user access control
- **Admin override policies** for moderation
- **Audit trail** for all moderation actions

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alx-polly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations from `/supabase/migrations/`
   - Get your project URL and anon key

4. **Environment variables**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3001](http://localhost:3001) in your browser

## Project Structure

```
alx-polly/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── create/            # Poll creation
│   ├── poll/              # Individual poll pages
│   └── profile/           # User profile management
├── components/            # Reusable React components
│   ├── ui/               # Shadcn/UI components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication components
│   └── polls/            # Poll-related components
├── lib/                  # Utility functions and configurations
│   ├── supabase/         # Supabase client and utilities
│   ├── validations/      # Zod schemas
│   └── utils.ts          # General utilities
├── supabase/             # Database migrations and types
│   └── migrations/       # SQL migration files
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run security:audit` - Security audit
- `npm run security:update` - Update dependencies

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the project conventions
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.


## 🚧 Future Updates

Here are the new features and updates planned for ALX Polly:

- **Migrate from Supabase to PostgreSQL**: Move to a dedicated PostgreSQL database for better reliability and scalability, using Prisma ORM for database management.
- **User Role Management**: Add support for admin and regular user roles, with role-based access control and moderation tools.
- **Poll Result Charts**: Integrate a charting library (Chart.js or Recharts) to display poll results visually and interactively.
- **Comments & Discussion Threads**: Enable comments and threaded discussions on each poll, with moderation capabilities for admins.
- **Mobile Responsiveness & Accessibility**: Refactor the UI for seamless mobile experience and improve accessibility (ARIA labels, keyboard navigation, color contrast).
- **QR Code Generation**: Generate QR codes for individual polls to make sharing easy across devices.

Stay tuned for these updates! Contributions and feedback are welcome as we build the next generation of ALX Polly.
