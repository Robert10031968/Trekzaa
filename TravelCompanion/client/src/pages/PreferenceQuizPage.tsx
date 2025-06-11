import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";

const questions = [
  {
    id: "travelStyle",
    question: "What's your preferred travel style?",
    options: [
      { value: "luxury", label: "Luxury & Comfort" },
      { value: "adventure", label: "Adventure & Exploration" },
      { value: "budget", label: "Budget-Friendly" },
      { value: "cultural", label: "Cultural Immersion" },
    ],
  },
  {
    id: "accommodation",
    question: "Where do you prefer to stay?",
    options: [
      { value: "hotel", label: "Hotels" },
      { value: "hostel", label: "Hostels" },
      { value: "apartment", label: "Vacation Rentals" },
      { value: "unique", label: "Unique Stays (Treehouses, Glamping, etc.)" },
    ],
  },
  {
    id: "activities",
    question: "What activities interest you most?",
    options: [
      { value: "sightseeing", label: "Sightseeing & Museums" },
      { value: "nature", label: "Nature & Outdoors" },
      { value: "food", label: "Food & Culinary Experiences" },
      { value: "relaxation", label: "Relaxation & Wellness" },
    ],
  },
  {
    id: "transportation",
    question: "How do you prefer to get around?",
    options: [
      { value: "public", label: "Public Transportation" },
      { value: "private", label: "Private Transportation" },
      { value: "walking", label: "Walking & Cycling" },
      { value: "guided", label: "Guided Tours" },
    ],
  },
  {
    id: "budget",
    question: "What's your typical daily budget (excluding accommodation)?",
    options: [
      { value: "budget", label: "Under $50" },
      { value: "moderate", label: "$50-150" },
      { value: "luxury", label: "$150-300" },
      { value: "ultra", label: "$300+" },
    ],
  },
];

export default function PreferenceQuizPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...preferences,
          activities: [preferences.activities], // Ensure activities is an array
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences saved!",
        description: "Your travel preferences have been updated.",
      });
      setLocation("/trip-planner");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save preferences",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnswer = (value: string) => {
    const question = questions[currentQuestion];
    setAnswers((prev) => ({ ...prev, [question.id]: value }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      savePreferencesMutation.mutate(answers);
    }
  };

  const question = questions[currentQuestion];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Travel Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-muted rounded-full">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-primary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{
                      width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">{question.question}</h2>
                    <RadioGroup
                      onValueChange={handleAnswer}
                      className="space-y-3"
                    >
                      {question.options.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                          />
                          <Label
                            htmlFor={option.value}
                            className="text-base cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentQuestion === questions.length - 1 || !answers[question.id]}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}