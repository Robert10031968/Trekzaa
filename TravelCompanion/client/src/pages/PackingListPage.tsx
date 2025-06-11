import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star } from "lucide-react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

interface PackingItem {
  id: number;
  name: string;
  category: string;
  quantity: string;
  isPacked: boolean;
  isEssential: boolean;
  notes?: string;
}

interface PackingList {
  id: number;
  name: string;
  items: PackingItem[];
}

export default function PackingListPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get trip ID from URL
  const tripId = new URLSearchParams(window.location.search).get("tripId");
  
  // Fetch packing lists for the trip
  const { data: packingLists, isLoading } = useQuery<PackingList[]>({
    queryKey: [`/api/trips/${tripId}/packing-lists`],
    enabled: !!tripId,
  });

  // Update item status mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, isPacked }: { itemId: number; isPacked: boolean }) => {
      const response = await fetch(`/api/packing-items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPacked }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/trips/${tripId}/packing-lists`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!packingLists?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">No Packing List Found</h2>
            <p className="text-muted-foreground mb-6">
              Generate a personalized packing list for your trip!
            </p>
            <Button onClick={() => setLocation("/trip-planner")}>
              Return to Trip Planner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group items by category
  const packingList = packingLists[0]; // Show the first list
  const groupedItems = packingList.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{packingList.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-primary">
                  {category}
                </h3>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Checkbox
                        checked={item.isPacked}
                        onCheckedChange={(checked) =>
                          updateItemMutation.mutate({
                            itemId: item.id,
                            isPacked: !!checked,
                          })
                        }
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.isEssential && (
                            <Star className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>Quantity: {item.quantity}</span>
                          {item.notes && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{item.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
