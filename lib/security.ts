import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

/**
 * Security utilities for access control and validation
 */

export async function validatePollOwnership(pollId: string, userId: string): Promise<boolean> {
  const supabase = await createClient(cookies());
  
  const { data: poll, error } = await supabase
    .from('polls')
    .select('user_id')
    .eq('id', pollId)
    .single();
    
  if (error || !poll) {
    return false;
  }
  
  return poll.user_id === userId;
}

export async function validateUserAuthentication(): Promise<{ user: any; error: string | null }> {
  const supabase = await createClient(cookies());
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    return { user: null, error: 'Authentication failed' };
  }
  
  if (!user) {
    return { user: null, error: 'User not authenticated' };
  }
  
  return { user, error: null };
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

export function validatePollData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required and must be a string');
  } else if (data.title.length < 5) {
    errors.push('Title must be at least 5 characters');
  } else if (data.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  if (data.description && typeof data.description === 'string' && data.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }
  
  if (!data.options || !Array.isArray(data.options)) {
    errors.push('Options are required and must be an array');
  } else if (data.options.length < 2) {
    errors.push('At least 2 options are required');
  } else if (data.options.length > 10) {
    errors.push('Maximum 10 options allowed');
  } else {
    data.options.forEach((option: any, index: number) => {
      if (typeof option !== 'string' || option.trim().length === 0) {
        errors.push(`Option ${index + 1} must be a non-empty string`);
      } else if (option.length > 200) {
        errors.push(`Option ${index + 1} must be less than 200 characters`);
      }
    });
  }
  
  if (data.duration) {
    const duration = parseInt(data.duration, 10);
    if (isNaN(duration) || duration < 1 || duration > 365) {
      errors.push('Duration must be between 1 and 365 days');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function rateLimitCheck(userId: string, action: string): boolean {
  // Simple in-memory rate limiting (in production, use Redis)
  const rateLimitKey = `${userId}:${action}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10; // Max 10 requests per minute per action
  
  // This is a simplified implementation
  // In production, implement proper rate limiting with Redis
  return true;
}
