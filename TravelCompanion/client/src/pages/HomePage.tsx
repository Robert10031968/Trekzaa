import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const destinations = [
  {
    id: 1,
    title: "Paris, France",
    image: "https://images.unsplash.com/photo-1551279076-6887dee32c7e",
  },
  {
    id: 2,
    title: "Tokyo, Japan",
    image: "https://images.unsplash.com/photo-1683893884572-05ad954122b3",
  },
  {
    id: 3,
    title: "New York, USA",
    image: "https://images.unsplash.com/photo-1667561171094-f00484f0edb1",
  },
  {
    id: 4,
    title: "Rome, Italy",
    image: "https://images.unsplash.com/photo-1552873547-b88e7b2760e2",
  },
];

export default function HomePage() {
  const [, setLocation] = useLocation();

  const handleDestinationClick = (destination: string) => {
    try {
      // Store both the destination and a timestamp to ensure freshness
      localStorage.setItem('selectedDestination', JSON.stringify({
        name: destination,
        timestamp: Date.now()
      }));
      setLocation('/planner');
    } catch (error) {
      console.error('Error setting destination:', error);
    }
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Plan Your Perfect Trip with AI
          </h1>
          <p className="text-xl text-muted-foreground">
            Let our AI-powered platform help you create unforgettable travel experiences
          </p>
          <Link href="/planner">
            <Button size="lg" className="mt-4">Start Planning</Button>
          </Link>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Popular Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {destinations.map((destination) => (
            <Card 
              key={destination.id} 
              className="cursor-pointer transform transition-transform hover:scale-105"
              onClick={() => handleDestinationClick(destination.title)}
            >
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-3">{destination.title}</h3>
                <AspectRatio ratio={16/9}>
                  <img
                    src={destination.image}
                    alt={destination.title}
                    className="object-cover rounded-lg"
                  />
                </AspectRatio>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-xl mb-4">AI-Powered Planning</h3>
                <p className="text-muted-foreground">
                  Get personalized travel recommendations based on your preferences
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-xl mb-4">Expert Guides</h3>
                <p className="text-muted-foreground">
                  Connect with verified local guides for authentic experiences
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-xl mb-4">Travel Shop</h3>
                <p className="text-muted-foreground">
                  Find all the gear you need for your next adventure
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}