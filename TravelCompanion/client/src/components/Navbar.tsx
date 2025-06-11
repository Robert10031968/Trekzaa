import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useUser } from "@/hooks/use-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Map, BookOpen, Users2, ShoppingBag, Heart, Calculator } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Navbar() {
  const { user, logout } = useUser();
  const [iconError, setIconError] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log('[Navigation] Auth state:', user ? 'authenticated' : 'unauthenticated');
  }, [user]);

  const handleNavigation = (path: string) => {
    console.log('[Navigation] Navigating to:', path);
    setLocation(path);
  };

  const handleIconError = () => {
    console.error('[Navigation] Failed to load logo: /tregzaa-logo.png');
    setIconError(true);
  };

  const handleLogout = async () => {
    try {
      console.log('[Navigation] Attempting logout');
      await logout();
      setLocation('/auth');
      console.log('[Navigation] Logout successful, redirected to auth page');
    } catch (error) {
      console.error('[Navigation] Logout failed:', error);
    }
  };

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => handleNavigation('/')}
          role="button"
          tabIndex={0}
        >
          {!iconError ? (
            <div className="bg-white p-1 rounded-lg flex items-center justify-center">
              <img
                src="/tregzaa-logo.png"
                alt="Dream Vacations Made Easy"
                className="h-16 w-auto object-contain"
                onError={handleIconError}
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-primary">T</span>
            </div>
          )}
        </div>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                onClick={() => handleNavigation('/planner')}
                role="button"
              >
                <Map className="h-4 w-4 mr-2" />
                Trip Planner
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                onClick={() => handleNavigation('/blog')}
                role="button"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Blog
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                onClick={() => handleNavigation('/guides')}
                role="button"
              >
                <Users2 className="h-4 w-4 mr-2" />
                Guides
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                onClick={() => handleNavigation('/shop')}
                role="button"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                onClick={() => handleNavigation('/budget-optimizer')}
                role="button"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Budget Optimizer
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <User className="h-4 w-4" />
                  {user.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/quiz')}>
                  <Heart className="h-4 w-4 mr-2" />
                  Travel Preferences
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => handleNavigation('/auth')}>
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}