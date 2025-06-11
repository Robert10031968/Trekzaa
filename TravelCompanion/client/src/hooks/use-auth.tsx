import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, signInWithEmailAndPassword, signOut } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// List of admin email addresses
const ADMIN_EMAILS = ["admin@trekzaa.com"]; // Add your admin emails here
const DEFAULT_ADMIN_PASSWORD = "admin123!"; // Default password for testing

function transformFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
  if (!firebaseUser) return null;

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    isAdmin: ADMIN_EMAILS.includes(firebaseUser.email!),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);
      setUser(transformFirebaseUser(firebaseUser));
      setIsLoading(false);
    });

    // Create default admin account if it doesn't exist
    const setupDefaultAdmin = async () => {
      try {
        await createUserWithEmailAndPassword(auth, ADMIN_EMAILS[0], DEFAULT_ADMIN_PASSWORD);
        console.log("Default admin account created successfully");
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log("Admin account already exists");
        } else if (error.code === 'auth/operation-not-allowed') {
          console.error("Email/Password sign-in is not enabled in Firebase Console");
          toast({
            title: "Authentication Setup Required",
            description: "Please enable Email/Password authentication in Firebase Console",
            variant: "destructive",
          });
        } else {
          console.error("Error creating default admin:", error);
        }
      }
    };

    setupDefaultAdmin();
    return () => unsubscribe();
  }, [toast]);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);

      if (!email.trim() || !password.trim()) {
        throw new Error("Please enter both email and password");
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful:", userCredential.user.email);

      const user = transformFirebaseUser(userCredential.user);
      if (!user?.isAdmin) {
        console.error("User is not an admin:", email);
        await signOut(auth);
        throw new Error("Unauthorized access. Admin privileges required.");
      }

      setUser(user);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);
      setError(error as Error);

      let errorMessage = "Invalid email or password";

      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Email/Password sign-in is not enabled. Please check Firebase Console settings.";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many login attempts. Please try again later.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast({
        title: "Success",
        description: "Successfully logged out",
      });
    } catch (error) {
      setError(error as Error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}