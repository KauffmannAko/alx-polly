# ALX Polly - Simple Polling App

ALX Polly is a Next.js application that allows users to create, share, and participate in polls with ease. Built with modern web technologies and integrated with Supabase for backend services.

## Features

- **User Authentication**: Register, login, and manage your profile
- **Create Polls**: Design custom polls with multiple options
- **Vote on Polls**: Participate in polls with a simple interface
- **View Results**: See real-time results with visual representations
- **Manage Polls**: View, edit, and delete your created polls

## Project Structure

```
├── app/
│   ├── (auth)/                  # Authentication routes
│   │   ├── login/               # Login page
│   │   ├── register/            # Registration page
│   │   └── layout.tsx           # Auth layout
│   ├── api/                     # API routes
│   │   ├── auth/                # Auth API
│   │   └── polls/               # Polls API
│   ├── create/                  # Create poll page
│   ├── my-polls/                # User's polls page
│   ├── polls/                   # Polls listing
│   │   └── [id]/                # Individual poll page
│   ├── profile/                 # User profile page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Homepage
├── components/
│   ├── layout/                  # Layout components
│   │   └── navbar.tsx           # Navigation bar
│   └── ui/                      # UI components (Shadcn)
├── types/                       # TypeScript type definitions
└── lib/                         # Utility functions
```

## Tech Stack

- **Framework**: Next.js
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your Supabase project and create the required tables (see Database Schema section)
4. Create a `.env.local` file with your Supabase credentials
5. Run the development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Routes

### Polls

- `GET /api/polls` - Get all polls
- `POST /api/polls` - Create a new poll
- `GET /api/polls/[id]` - Get a specific poll
- `PUT /api/polls/[id]` - Update a poll
- `DELETE /api/polls/[id]` - Delete a poll
- `POST /api/polls/[id]/vote` - Vote on a poll

## Usage

1. **Register/Login**: Create an account or log in to access all features
2. **Create a Poll**: Navigate to the Create page and fill out the form
3. **Vote**: Visit any poll and select an option to vote
4. **View Results**: See real-time results after voting
5. **Manage Polls**: Access your created polls from the My Polls page

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

The application uses the following tables in Supabase:

- **polls**: Stores poll information (title, description, user_id, duration)
- **options**: Stores poll options (text, poll_id)
- **votes**: Records user votes (user_id, poll_id, option_id)

## Recent Updates

- Fixed asynchronous cookie handling in Supabase server client
  - Updated `cookies()` function to be properly awaited
  - Made cookie methods (`set` and `remove`) async with proper awaits
- Improved error handling in API routes
  - Added proper error handling for user authentication
  - Enhanced request body parsing with try/catch blocks
  - Implemented comprehensive validation for all inputs
- Implemented proper authentication checks for poll operations
  - Added user ownership verification for update/delete operations
  - Prevented duplicate votes from the same user
- Added comprehensive validation for poll creation and voting
  - Ensured options belong to the correct poll
  - Validated required fields before processing

## Supabase Integration

The application uses two Supabase client implementations:

1. **Browser Client** (`lib/supabase.ts`): Used for client-side operations
2. **Server Client** (`lib/supabase-server.ts`): Used for server-side API routes with proper cookie handling

## Troubleshooting

### Common Issues

1. **Poll Creation 500 Error**
   - **Cause**: Asynchronous cookie handling in Supabase server client
   - **Solution**: Ensure all cookie operations are properly awaited
   - **Fixed in**: Recent update to `lib/supabase-server.ts`

2. **Permission Issues with .next Directory**
   - **Cause**: File locking by other processes
   - **Solution**: Close all instances of the application and delete the `.next` directory before restarting

3. **Authentication Errors**
   - **Cause**: Missing or expired session
   - **Solution**: Log out and log back in to refresh your session

## Future Enhancements

- Add real-time updates with WebSockets
- Implement poll sharing functionality
- Add analytics for poll creators
- Enhance UI with animations and transitions
- Add support for image options in polls
- Implement poll categories and tags
- created polls are not displayed on screen - bug to be fixed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
