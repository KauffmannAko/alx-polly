# ALX Polly - Simple Polling App

A modern polling application built with Next.js and Supabase that allows users to create, share, and vote on polls.

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
  UNIQUE(poll_id, user_id)
);
```

## API Endpoints

- `GET /api/polls` - Get all polls
- `POST /api/polls` - Create a poll (requires auth)
- `GET /api/polls/[id]` - Get specific poll
- `PUT /api/polls/[id]` - Update poll (requires ownership)
- `DELETE /api/polls/[id]` - Delete poll (requires ownership)
- `POST /api/polls/[id]/vote` - Vote on poll (requires auth)

## Project Structure

```
app/
├── (auth)/          # Login/register pages
├── api/             # API routes
├── create/          # Create poll page
├── my-polls/        # User dashboard
├── polls/           # Poll listing and voting
└── profile/         # User profile

components/
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
