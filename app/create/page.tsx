'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import withAuth from '@/components/auth/withAuth';
import { useRouter } from 'next/navigation';

const createPollSchema = z.object({
  title: z.string().min(5, { message: 'Poll question must be at least 5 characters' }),
  description: z.string().optional(),
  duration: z.string(),
});

type CreatePollFormValues = z.infer<typeof createPollSchema>;

/**
 * Create Poll Page - Form for creating new polls
 */
function CreatePollPage() {
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<CreatePollFormValues>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      title: '',
      description: '',
      duration: '7',
    },
  });

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const onSubmit = async (data: CreatePollFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const pollData = {
      ...data,
      options: options.filter(option => option.trim() !== ''),
    };

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pollData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create poll');
      }

      const { poll } = await response.json();
      router.push(`/my-polls`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 md:py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Create a New Poll</CardTitle>
          <CardDescription>
            Fill out the form below to create your poll
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" role="form" aria-labelledby="create-poll-title">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" role="alert" aria-live="polite">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Poll Question *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What's your favorite programming language?"
                        className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-describedby={form.formState.errors.title ? "title-error" : undefined}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id="title-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Provide additional context for your poll"
                        className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <fieldset className="space-y-4">
                <legend className="sr-only">Poll Options</legend>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <FormLabel className="text-sm font-medium">Options *</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full sm:w-auto"
                    aria-label="Add new poll option"
                  >
                    Add Option
                  </Button>
                </div>

                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex-1"
                      aria-label={`Poll option ${index + 1}`}
                      required
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                        className="focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shrink-0"
                        aria-label={`Remove option ${index + 1}`}
                      >
                        <span aria-hidden="true">✕</span>
                      </Button>
                    )}
                  </div>
                ))}
              </fieldset>

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Duration *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="Select poll duration"
                      >
                        <option value="1">1 day</option>
                        <option value="3">3 days</option>
                        <option value="7">1 week</option>
                        <option value="14">2 weeks</option>
                        <option value="30">1 month</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={isSubmitting || options.some(opt => !opt.trim())}
                aria-describedby="submit-help"
              >
                {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
              </Button>
              <p id="submit-help" className="text-xs text-gray-500 text-center">
                All fields marked with * are required
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(CreatePollPage);