// Role related types
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export enum Permission {
  // Poll permissions
  CREATE_POLL = 'create_poll',
  EDIT_OWN_POLL = 'edit_own_poll',
  DELETE_OWN_POLL = 'delete_own_poll',
  VOTE_ON_POLL = 'vote_on_poll',
  VIEW_POLL = 'view_poll',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MODERATE_POLLS = 'moderate_polls',
  MODERATE_COMMENTS = 'moderate_comments',
  VIEW_ANALYTICS = 'view_analytics',
  DELETE_ANY_POLL = 'delete_any_poll',
  BAN_USERS = 'ban_users'
}

// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  role: UserRole;
  isActive: boolean;
  bannedAt?: string;
  bannedBy?: string;
  banReason?: string;
  createdAt: string;
  updatedAt?: string;
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
  isApproved: boolean;
  isHidden: boolean;
  moderatedBy?: string;
  moderatedAt?: string;
  moderationReason?: string;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  pollId: string;
  userId: string;
  content: string;
  isApproved: boolean;
  isHidden: boolean;
  moderatedBy?: string;
  moderatedAt?: string;
  moderationReason?: string;
  createdAt: string;
  updatedAt?: string;
  user?: User; // For populated user data
}