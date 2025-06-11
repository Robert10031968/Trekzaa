import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Loader2, Plus, X, Search, Edit2, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { BlogEditor } from "@/components/BlogEditor";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Comments } from "@/components/Comments";

interface BlogPost {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
  };
}

export default function BlogPage() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: posts, isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (newPost: { title: string; content: string }) => {
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPost),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      setShowEditor(false);
      setTitle("");
      setContent("");
      toast({
        title: "Success",
        description: "Blog post created successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, post }: { id: number; post: { title: string; content: string } }) => {
      const response = await fetch(`/api/blog/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(post),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      setShowEditor(false);
      setEditingPost(null);
      setTitle("");
      setContent("");
      toast({
        title: "Success",
        description: "Blog post updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({
        title: "Success",
        description: "Blog post deleted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Invalid input",
        description: "Please fill in both title and content",
        variant: "destructive",
      });
      return;
    }

    if (editingPost) {
      updatePostMutation.mutate({
        id: editingPost.id,
        post: { title, content },
      });
    } else {
      createPostMutation.mutate({ title, content });
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setShowEditor(true);
  };

  const handleDeletePost = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(id);
    }
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingPost(null);
    setTitle("");
    setContent("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts?.filter((post) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower) ||
      post.author.username.toLowerCase().includes(searchLower)
    );
  }) ?? [];

  // If not logged in, show login form
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="admin@trekzaa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (postsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Travel Blog</h1>
          <p className="text-muted-foreground">Discover travel tips, stories, and inspiration</p>

          {/* Search Bar */}
          <div className="relative mt-4 max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>

          {user?.isAdmin && (
            <Button
              onClick={() => {
                if (!showEditor) {
                  setShowEditor(true);
                } else {
                  handleCancelEdit();
                }
              }}
              className="mt-4"
              variant={showEditor ? "secondary" : "default"}
            >
              {showEditor ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </>
              )}
            </Button>
          )}
        </div>

        {showEditor && user?.isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>{editingPost ? "Edit Post" : "Create New Post"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Post title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <BlogEditor content={content} onChange={setContent} />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending || updatePostMutation.isPending}
                    className="flex-1"
                  >
                    {(createPostMutation.isPending || updatePostMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      editingPost ? "Update Post" : "Publish Post"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Featured Post */}
        {filteredPosts[0] && (
          <Card className="overflow-hidden">
            <div className="relative h-[400px]">
              <img
                src="https://images.unsplash.com/photo-1625241310933-640978bb5176"
                alt="Featured post"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-8 flex flex-col justify-end">
                <h2 className="text-white text-3xl font-bold mb-4">{filteredPosts[0].title}</h2>
                <div className="flex items-center gap-4 text-white/90">
                  <Avatar>
                    <AvatarFallback>
                      {filteredPosts[0].author.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{filteredPosts[0].author.username}</p>
                    <p className="text-sm">
                      {format(new Date(filteredPosts[0].createdAt), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts?.slice(1).map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="relative">
                <CardTitle>{post.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {post.author.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.author.username}</span>
                  <span>•</span>
                  <span>{format(new Date(post.createdAt), "MMMM d, yyyy")}</span>
                </div>
                {user?.isAdmin && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPost(post)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div
                  className="text-muted-foreground line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                <Comments postId={post.id} />
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No posts found matching your search." : "No blog posts yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}