# ALX Polly 2.0: Modern, Secure, and Insightful Polling App

**ALX Polly** is a web application for creating, sharing, and analyzing polls.  
It empowers individuals, teams, and organizations to gather opinions, make decisions, and foster discussions.  

The platform is designed for both casual users and administrators, offering robust features such as:  
- ⚡ Real-time poll results  
- 🔒 Role-based access control  
- 📷 QR code sharing for easy distribution  
- 📱 Mobile-friendly and accessible design  

---

## 🎯 Target Users

- **General Users**  
  - Create and vote on polls  
  - Participate in discussions  

- **Admins**  
  - Manage users  
  - Moderate content  
  - Access advanced analytics  

---

## 💡 Why It Matters

ALX Polly streamlines decision-making, encourages engagement, and provides actionable insights through **interactive charts and discussions**.  
Its **secure, scalable architecture** ensures privacy and reliability for all users.  


## Features

- **Create Polls**: Design custom polls with multiple options
- **Vote on Polls**: Participate in polls with a simple interface
- **View Results**: See real-time results with visual representations
- **Manage Polls**: View, edit, and delete your created polls


## Tech Stack

- **Framework**: Next.js
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your Supabase project and create the required tables (see Database Schema section)
4. Create a `.env.local` file with your Supabase credentials
5. Run the development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000) in your browser

2. **Set up Supabase**
   - Create a new Supabase project
   - Create the required tables (see Database Schema below)
   - Get your project URL and anon key

3. **Environment variables**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Database Schema

Create these tables in your Supabase project:

```sql
-- Polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  duration INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Options table
CREATE TABLE options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE
);

-- Votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
```

- `GET /api/polls` - Get all polls
- `POST /api/polls` - Create a poll (requires auth)
- `PUT /api/polls/[id]` - Update poll (requires ownership)
- `DELETE /api/polls/[id]` - Delete poll (requires ownership)
## Project Structure

├── (auth)/          # Login/register pages
├── api/             # API routes
├── my-polls/        # User dashboard
├── polls/           # Poll listing and voting
├── auth/            # Authentication components
├── layout/          # Layout components
└── ui/              # Reusable UI components

lib/
├── supabase.ts      # Browser client
└── supabase-server.ts # Server client
```

## Usage

1. **Register/Login** - Create an account to access all features
2. **Create Poll** - Go to `/create` to make a new poll
3. **Vote** - Visit any poll to vote on options
4. **Manage** - Use `/my-polls` to manage your polls
5. **Results** - View real-time results after voting

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.


## 🚧 Future Updates

Here are the new features and updates planned for ALX Polly:

- **Migrate from Supabase to PostgreSQL**: Move to a dedicated PostgreSQL database for better reliability and scalability, using Prisma ORM for database management.
- **User Role Management**: Add support for admin and regular user roles, with role-based access control and moderation tools.
- **Poll Result Charts**: Integrate a charting library (Chart.js or Recharts) to display poll results visually and interactively.
- **Comments & Discussion Threads**: Enable comments and threaded discussions on each poll, with moderation capabilities for admins.
- **Mobile Responsiveness & Accessibility**: Refactor the UI for seamless mobile experience and improve accessibility (ARIA labels, keyboard navigation, color contrast).
- **QR Code Generation**: Generate QR codes for individual polls to make sharing easy across devices.
- **AI-Enhanced Development**: Use AI tools (Copilot, VS Code agents) for code generation, automated testing, and documentation. Feed API specs, file trees, and schema diffs into AI tools for context-aware suggestions.

Stay tuned for these updates! Contributions and feedback are welcome as we build the next generation of ALX Polly.
