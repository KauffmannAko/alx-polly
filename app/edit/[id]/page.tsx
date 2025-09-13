'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import withAuth from '@/components/auth/withAuth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const editPollSchema = z.object({
  title: z.string().min(5, { message: 'Poll question must be at least 5 characters' }),
  description: z.string().optional(),
});

type EditPollFormValues = z.infer<typeof editPollSchema>;

function EditPollPage({ params }: { params: { id: string } }) {
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<EditPollFormValues>({
    resolver: zodResolver(editPollSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    const fetchPoll = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching poll for editing, ID:', id);
        
        if (!id) {
          throw new Error('Invalid poll ID');
        }
        
        const response = await fetch(`/api/polls/${id}`);
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
          let errorMessage = `Failed to fetch poll (Status: ${response.status})`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
          }
          throw new Error(errorMessage);
        }
        
        const { poll } = await response.json();
        console.log('Fetched poll:', poll);
        
        if (!poll) {
          throw new Error('Poll not found');
        }
        
        // Check if user is authorized to edit this poll
        const { data } = await supabase.auth.getUser();
        if (!data?.user) {
          setError('You must be logged in to edit polls');
          router.push('/login');
          return;
        }
        
        if (data.user.id !== poll.user_id) {
          setError('You are not authorized to edit this poll');
          router.push('/my-polls');
          return;
        }
        
        // Set form values
        form.reset({
          title: poll.title,
          description: poll.description || '',
        });
      } catch (err: any) {
        console.error('Error fetching poll:', err);
        
        let errorMessage = err.message;
        if (err.name === 'TypeError' && err.message.includes('fetch failed')) {
          errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and try again.';
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [id, form, supabase, router]);

  const onSubmit = async (data: EditPollFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Attempting to update poll with ID:', id);
      console.log('Update data:', data);
      
      // Check if we have a valid ID
      if (!id) {
        throw new Error('Invalid poll ID');
      }
      
      const response = await fetch(`/api/polls/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        let errorMessage = `Failed to update poll (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          console.error('Update error response:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Update successful:', result);
      router.push('/my-polls');
    } catch (err: any) {
      console.error('Error updating poll:', err);
      
      // Provide more specific error messages
      let errorMessage = err.message;
      if (err.name === 'TypeError' && err.message.includes('fetch failed')) {
        errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and try again.';
      } else if (err.message.includes('Invalid poll ID')) {
        errorMessage = 'Invalid poll ID. Please try accessing the poll from your polls list.';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Loading poll...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Poll</CardTitle>
          <CardDescription>
            Update your poll details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && <p className="text-red-500">{error}</p>}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poll Question</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What's your favorite programming language?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Provide additional context for your poll"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(EditPollPage);