import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TravelPreferences {
  id: number;
  travelStyle: string;
  accommodation: string;
  activities: string[];
  transportation: string;
  budget: string;
  foodPreferences: string;
}

interface Trip {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user } = useUser();
  
  const { data: preferences, isLoading: preferencesLoading } = useQuery<TravelPreferences>({
    queryKey: ["/api/preferences"],
  });

  const { data: trips, isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Please log in to view your profile
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (preferencesLoading || tripsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* User Info */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user.username}</CardTitle>
                <p className="text-muted-foreground">
                  {user.isGuide ? "Travel Guide" : "Traveler"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {user.bio && (
              <p className="text-muted-foreground mt-2">{user.bio}</p>
            )}
          </CardContent>
        </Card>

        {/* Travel Preferences */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Travel Preferences</CardTitle>
              <Button variant="outline" size="sm">
                Edit Preferences
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {preferences ? (
              <>
                <div>
                  <h4 className="font-medium mb-2">Travel Style</h4>
                  <p className="text-muted-foreground">
                    {preferences.travelStyle}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Preferred Accommodation</h4>
                  <p className="text-muted-foreground">
                    {preferences.accommodation}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Activities</h4>
                  <div className="flex flex-wrap gap-2">
                    {preferences.activities.map((activity) => (
                      <Badge key={activity} variant="secondary">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Transportation</h4>
                  <p className="text-muted-foreground">
                    {preferences.transportation}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Budget Range</h4>
                  <p className="text-muted-foreground">{preferences.budget}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  No preferences set yet.{" "}
                  <Button variant="link" className="p-0" onClick={() => window.location.href = "/quiz"}>
                    Take the quiz
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trip History */}
        <Card>
          <CardHeader>
            <CardTitle>Trip History</CardTitle>
          </CardHeader>
          <CardContent>
            {trips && trips.length > 0 ? (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-start justify-between p-4 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">{trip.destination}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(trip.startDate), "MMM d, yyyy")} -{" "}
                          {format(new Date(trip.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  No trips planned yet.{" "}
                  <Button variant="link" className="p-0" onClick={() => window.location.href = "/planner"}>
                    Plan your first trip
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
