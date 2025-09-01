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
      try {
        const response = await fetch(`/api/polls/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch poll');
        }
        
        const { poll } = await response.json();
        
        // Check if user is authorized to edit this poll
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id !== poll.user_id) {
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
        setError(err.message);
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
      const response = await fetch(`/api/polls/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update poll');
      }

      router.push('/my-polls');
    } catch (err: any) {
      setError(err.message);
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