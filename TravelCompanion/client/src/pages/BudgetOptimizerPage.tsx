import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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

const budgetFormSchema = z.object({
  budget: z.coerce.number().min(1, "Budget must be at least 1"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 day"),
  destination: z.string().min(1, "Destination is required"),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export default function BudgetOptimizerPage() {
  const { toast } = useToast();
  const [optimizedBudget, setOptimizedBudget] = useState<any>(null);

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      budget: 0,
      duration: 0,
      destination: "",
    },
  });

  const onSubmit = async (data: BudgetFormValues) => {
    try {
      // TODO: Integrate with actual budget optimizer logic
      const mockOptimizedBudget = {
        accommodation: data.budget * 0.4,
        transportation: data.budget * 0.2,
        activities: data.budget * 0.2,
        food: data.budget * 0.15,
        miscellaneous: data.budget * 0.05
      };

      setOptimizedBudget(mockOptimizedBudget);

      toast({
        title: "Budget Optimization Complete",
        description: "Your travel budget has been optimized successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to optimize budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Travel Budget Optimizer</h1>
          <p className="text-muted-foreground">
            Optimize your travel budget for the best experience
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter Your Travel Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Budget ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter your total budget"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip Duration (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Number of days"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your destination"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Optimize Budget
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {optimizedBudget && (
          <Card>
            <CardHeader>
              <CardTitle>Optimized Budget Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Accommodation</span>
                  <span>${optimizedBudget.accommodation.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transportation</span>
                  <span>${optimizedBudget.transportation.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Activities</span>
                  <span>${optimizedBudget.activities.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Food & Dining</span>
                  <span>${optimizedBudget.food.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Miscellaneous</span>
                  <span>${optimizedBudget.miscellaneous.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}