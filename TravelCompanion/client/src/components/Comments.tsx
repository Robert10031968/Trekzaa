import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    username: string;
  };
}

interface CommentsProps {
  postId: number;
}

export function Comments({ postId }: CommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/blog/${postId}/comments`],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (comment: { content: string }) => {
      const response = await fetch(`/api/blog/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(comment),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blog/${postId}/comments`] });
      setContent("");
      toast({
        title: "Success",
        description: "Comment posted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }
    createCommentMutation.mutate({ content });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      
      {user && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button
            type="submit"
            disabled={createCommentMutation.isPending}
            className="w-full"
          >
            {createCommentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Post Comment"
            )}
          </Button>
        </form>
      )}

      <div className="space-y-4">
        {comments?.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {comment.author.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {comment.author.username}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(comment.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{comment.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {comments?.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}
