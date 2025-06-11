import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Send, Loader2, PackageSearch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WelcomeAnimation } from "@/components/WelcomeAnimation";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

// Animation variants with enhanced spring animations
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 1,
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 20,
      mass: 1
    }
  }
};

export default function TripPlannerPage() {
  const [, setLocation] = useLocation();
  const [tripId, setTripId] = useState<number | null>(null);

  const handleOpenPackingList = () => {
    if (tripId) {
      setLocation(`/packing-list?tripId=${tripId}`);
    }
  };

  return (
    <motion.div
      className="container mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layoutId="trip-planner"
    >
      <motion.div className="max-w-6xl mx-auto space-y-8">
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-bold mb-4 text-center">Plan Your Trip</h1>
          <p className="text-muted-foreground text-center">
            Let our AI help you create the perfect travel itinerary
          </p>
          {tripId && (
            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                onClick={handleOpenPackingList}
                className="flex items-center gap-2"
              >
                <PackageSearch className="w-4 h-4" />
                View Packing List
              </Button>
            </div>
          )}
        </motion.div>

        <motion.div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-8 items-start">
          <motion.div variants={itemVariants} className="sticky top-8">
            <WelcomeAnimation />
          </motion.div>

          <motion.div variants={itemVariants} className="w-full">
            <ChatInterface onTripCreated={setTripId} />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}