import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

// Extend express user object with our schema
declare global {
  namespace Express {
    interface User extends SelectUser {
      id: number;
      username: string;
      password: string;
      isGuide?: boolean;
      bio?: string | null;
    }
  }
}

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "porygon-supremacy",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[Auth] Attempting login for user: ${username}`);
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          console.log(`[Auth] User not found: ${username}`);
          return done(null, false, { message: "Incorrect username." });
        }

        const isMatch = await crypto.compare(password, user.password);
        console.log(`[Auth] Password match for ${username}: ${isMatch}`);

        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        console.log(`[Auth] Login successful for user: ${username}`);
        return done(null, user);
      } catch (err) {
        console.error('[Auth] Login error:', err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log(`[Auth] Serializing user: ${user.username}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`[Auth] Deserializing user ID: ${id}`);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        console.log(`[Auth] User not found during deserialization: ${id}`);
        return done(null, false);
      }

      console.log(`[Auth] Successfully deserialized user: ${user.username}`);
      done(null, user);
    } catch (err) {
      console.error('[Auth] Deserialization error:', err);
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('[Auth] Registration attempt:', { username: req.body.username });
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        const errorMsg = result.error.issues.map(i => i.message).join(", ");
        console.log('[Auth] Registration validation failed:', errorMsg);
        return res.status(400).send("Invalid input: " + errorMsg);
      }

      const { username, password } = result.data;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        console.log('[Auth] Registration failed - username exists:', username);
        return res.status(400).send("Username already exists");
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create the new user
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
        })
        .returning();

      console.log('[Auth] User registered successfully:', username);

      // Log the user in after registration
      req.login(newUser, (err) => {
        if (err) {
          console.error('[Auth] Auto-login after registration failed:', err);
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: { id: newUser.id, username: newUser.username },
        });
      });
    } catch (error) {
      console.error('[Auth] Registration error:', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('[Auth] Login attempt:', { username: req.body.username });
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      const errorMsg = result.error.issues.map(i => i.message).join(", ");
      console.log('[Auth] Login validation failed:', errorMsg);
      return res.status(400).send("Invalid input: " + errorMsg);
    }

    const cb = (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        console.error('[Auth] Login error:', err);
        return next(err);
      }

      if (!user) {
        console.log('[Auth] Login failed:', info.message);
        return res.status(400).send(info.message ?? "Login failed");
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('[Auth] Session creation error:', err);
          return next(err);
        }

        console.log('[Auth] Login successful:', user.username);
        return res.json({
          message: "Login successful",
          user: { id: user.id, username: user.username },
        });
      });
    };
    passport.authenticate("local", cb)(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    const username = req.user?.username;
    console.log('[Auth] Logout attempt:', { username });

    req.logout((err) => {
      if (err) {
        console.error('[Auth] Logout error:', err);
        return res.status(500).send("Logout failed");
      }

      console.log('[Auth] Logout successful:', { username });
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      console.log('[Auth] User session verified:', { username: req.user?.username });
      return res.json(req.user);
    }

    console.log('[Auth] Unauthenticated user session');
    res.status(401).send("Not logged in");
  });
}