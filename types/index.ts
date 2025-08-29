// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
}

// Poll related types
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: string;
  expiresAt?: string;
  createdBy: string;
  active: boolean;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: string;
}