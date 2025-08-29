import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for polls
const mockPolls = [
  {
    id: "1",
    title: "What's your favorite programming language?",
    description: "Vote for your preferred programming language",
    options: ["JavaScript", "Python", "Java", "C#", "Go"],
    votes: 42,
    createdAt: "2023-10-15",
  },
  {
    id: "2",
    title: "Best frontend framework?",
    description: "Which frontend framework do you prefer working with?",
    options: ["React", "Vue", "Angular", "Svelte"],
    votes: 78,
    createdAt: "2023-10-10",
  },
  {
    id: "3",
    title: "Favorite development tool?",
    description: "What's your go-to development tool?",
    options: ["VS Code", "IntelliJ IDEA", "Sublime Text", "Vim"],
    votes: 36,
    createdAt: "2023-10-05",
  },
];

export default function PollsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Polls</h1>
        <Button asChild>
          <Link href="/create">Create Poll</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockPolls.map((poll) => (
          <Card key={poll.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="line-clamp-2">{poll.title}</CardTitle>
              <CardDescription>{poll.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-2">
                {poll.options.length} options • {poll.votes} votes
              </p>
              <div className="space-y-1">
                {poll.options.slice(0, 3).map((option, index) => (
                  <div key={index} className="text-sm">{option}</div>
                ))}
                {poll.options.length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    +{poll.options.length - 3} more options
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/polls/${poll.id}`}>View Poll</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}