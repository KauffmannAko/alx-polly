# ALX Polly - Simple Polling App

ALX Polly is a Next.js application that allows users to create, share, and participate in polls with ease.

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
- **Authentication**: (Placeholder for future implementation)
- **Database**: (Placeholder for future implementation)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Future Enhancements

- Implement actual authentication with NextAuth.js
- Add database integration
- Add real-time updates with WebSockets
- Implement poll sharing functionality
- Add analytics for poll creators
