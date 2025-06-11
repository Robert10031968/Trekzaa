import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { useUser } from "./hooks/use-user";
import { AuthProvider } from "./hooks/use-auth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import TripPlannerPage from "./pages/TripPlannerPage";
import BlogPage from "./pages/BlogPage";
import GuidesPage from "./pages/GuidesPage";
import ShopPage from "./pages/ShopPage";
import AuthPage from "./pages/AuthPage";
import PreferenceQuizPage from "./pages/PreferenceQuizPage";
import ProfilePage from "./pages/ProfilePage";
import PackingListPage from "./pages/PackingListPage";
import BudgetOptimizerPage from "./pages/BudgetOptimizerPage"; // Added import
import { AnimatePresence, motion } from "framer-motion";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function App() {
  const { isLoading } = useUser();

  if (isLoading) {
    return (
      <motion.div 
        className="flex items-center justify-center min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </motion.div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AnimatePresence mode="wait">
          <motion.div 
            className="min-h-screen flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Navbar />
            <main className="flex-grow">
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/planner" component={TripPlannerPage} />
                <Route path="/blog" component={BlogPage} />
                <Route path="/guides" component={GuidesPage} />
                <Route path="/shop" component={ShopPage} />
                <Route path="/auth" component={AuthPage} />
                <Route path="/quiz" component={PreferenceQuizPage} />
                <Route path="/profile" component={ProfilePage} />
                <Route path="/packing-list" component={PackingListPage} />
                <Route path="/budget-optimizer" component={BudgetOptimizerPage} /> {/* Added route */}
              </Switch>
            </main>
            <Footer />
          </motion.div>
        </AnimatePresence>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;