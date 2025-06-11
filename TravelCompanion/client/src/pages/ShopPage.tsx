import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";

// Mock data for Amazon products (in real app, this would come from Amazon Product API)
const products = [
  {
    id: 1,
    title: "Travel Backpack",
    description: "Waterproof hiking backpack with laptop compartment",
    price: 79.99,
    rating: 4.5,
    reviews: 1250,
    image: "https://images.unsplash.com/photo-1614181211723-33720453c51f",
  },
  {
    id: 2,
    title: "Universal Travel Adapter",
    description: "All-in-one international power adapter with USB ports",
    price: 24.99,
    rating: 4.8,
    reviews: 3420,
    image: "https://images.unsplash.com/photo-1614181211723-33720453c51f",
  },
  // Add more products as needed
];

export default function ShopPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Travel Shop</h1>
          <p className="text-muted-foreground">
            Essential gear and accessories for your next adventure
          </p>
        </div>

        {/* Featured Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Luggage", "Electronics", "Outdoor Gear", "Travel Accessories"].map(
            (category) => (
              <Card key={category} className="text-center">
                <CardContent className="pt-6">
                  <h3 className="font-medium">{category}</h3>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-48 object-cover"
              />
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-lg">{product.title}</CardTitle>
                  <Badge variant="secondary">${product.price}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="ml-1">{product.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{product.reviews} reviews</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{product.description}</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
