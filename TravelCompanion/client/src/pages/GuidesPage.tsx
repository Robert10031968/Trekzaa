import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, Star, MapPin, CheckCircle, Info, Languages } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Guide {
  id: number;
  specialties: string[];
  locations: string[];
  rating: string;
  verified: boolean;
  matchScore?: number;
  matchDetails?: {
    specialtyMatch: number;
    locationMatch: number;
    ratingScore: number;
  };
  user: {
    username: string;
    bio: string;
  };
}

const guideFormSchema = z.object({
  specialties: z.string().transform((val) => val.split(",").map(s => s.trim())),
  locations: z.string().transform((val) => val.split(",").map(s => s.trim())),
  bio: z.string().min(1, "Bio is required"),
});

type GuideFormValues = {
  specialties: string;
  locations: string;
  bio: string;
};

function MatchScoreDisplay({ score, details }: { score?: number; details?: Guide['matchDetails'] }) {
  if (!score) return null;

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.6) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Progress value={score * 100} className="w-24" />
              <span className="text-sm font-medium">{Math.round(score * 100)}%</span>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-64">
          <div className="space-y-2">
            <p className="font-medium">Match Score Breakdown:</p>
            {details && (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Specialty Match:</span>
                  <span>{Math.round(details.specialtyMatch * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Location Match:</span>
                  <span>{Math.round(details.locationMatch * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Rating Score:</span>
                  <span>{Math.round(details.ratingScore * 100)}%</span>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
] as const;

type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

interface TranslatedContent {
  bio?: {
    translatedText: string;
    detectedSourceLanguage: string;
  };
  specialties?: Array<{
    translatedText: string;
    detectedSourceLanguage: string;
  }>;
}

export default function GuidesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<Record<number, TranslatedContent>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('es');

  const { data: guides, isLoading } = useQuery<Guide[]>({
    queryKey: ["/api/guides"],
  });

  const form = useForm<GuideFormValues>({
    resolver: zodResolver(guideFormSchema),
    defaultValues: {
      specialties: "",
      locations: "",
      bio: "",
    },
  });

  const registerGuideMutation = useMutation({
    mutationFn: async (data: GuideFormValues) => {
      const response = await fetch("/api/guides/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "You are now registered as a guide!",
      });
      setIsRegisterOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const translateGuideMutation = useMutation({
    mutationFn: async ({ guideId, language }: { guideId: number; language: string }) => {
      const response = await fetch(`/api/guides/${guideId}/translate/${language}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      setTranslatedContent(prev => ({
        ...prev,
        [variables.guideId]: data
      }));
      toast({
        title: "Translation successful",
        description: "Guide profile has been translated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Translation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GuideFormValues) => {
    registerGuideMutation.mutate(data);
  };

  if (isLoading) {
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
          <h1 className="text-4xl font-bold mb-4">Travel Guides</h1>
          <p className="text-muted-foreground">
            Connect with experienced local guides for authentic experiences
          </p>
        </div>

        {/* Featured Guide */}
        <Card className="relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1623607526795-e9c0cd3c273c"
            alt="Featured guide"
            className="w-full h-[300px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Become a Guide</h2>
            <p className="mb-4">Share your local expertise and earn</p>
            {user && !user.isGuide ? (
              <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary">Apply Now</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Register as a Guide</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="specialties"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialties (comma-separated)</FormLabel>
                            <FormControl>
                              <Input placeholder="Adventure,Culture,Food" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="locations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Locations (comma-separated)</FormLabel>
                            <FormControl>
                              <Input placeholder="Paris,Tokyo,New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Tell us about your experience..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerGuideMutation.isPending}
                      >
                        {registerGuideMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="secondary" disabled>
                {user ? "Already a Guide" : "Login to Apply"}
              </Button>
            )}
          </div>
        </Card>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides?.map((guide) => (
            <Card key={guide.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {guide.user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{guide.user.username}</CardTitle>
                        {guide.verified && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4" />
                        <span>{guide.rating}</span>
                        {guide.matchScore && (
                          <MatchScoreDisplay
                            score={guide.matchScore}
                            details={guide.matchDetails}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedLanguage}
                      onValueChange={(value: SupportedLanguage) => setSelectedLanguage(value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => translateGuideMutation.mutate({
                        guideId: guide.id,
                        language: selectedLanguage
                      })}
                      disabled={translateGuideMutation.isPending}
                    >
                      {translateGuideMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Languages className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {translatedContent[guide.id]?.bio?.translatedText || guide.user.bio}
                </p>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {(translatedContent[guide.id]?.specialties || guide.specialties).map((specialty, index) => (
                        <Badge key={index} variant="secondary">
                          {typeof specialty === 'string'
                            ? specialty
                            : specialty.translatedText}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Locations</h4>
                    <div className="flex flex-wrap gap-2">
                      {guide.locations.map((location) => (
                        <div
                          key={location}
                          className="flex items-center gap-1 text-sm text-muted-foreground"
                        >
                          <MapPin className="h-4 w-4" />
                          <span>{location}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}