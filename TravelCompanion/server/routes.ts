import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { blogPosts, guides, trips, users, travelPreferences, bookings } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { generateTripRecommendations, calculateGuideMatchScore, generateApplicationIcon } from "./services/openai";
import { translateGuideProfile } from "./services/translate";
import fs from 'fs';
import path from 'path';
import express from 'express';
import { handleChatMessage } from "./services/chatbot";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { generatePackingList } from "./services/packing-list";
import { packingLists, packingItems } from "@db/schema";
import { blogPosts as blogPostsSchema, users } from "@db/schema"; // Added import for blogPosts and users


// Extend the session type to include chatMessages
declare module 'express-session' {
  interface Session {
    chatMessages: ChatCompletionMessageParam[];
  }
}

// Add this middleware function after imports
function requireAdmin(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.isAuthenticated() || !req.user?.id || !req.user.isAdmin) {
    return res.status(403).send("Admin access required");
  }
  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Serve static files from the public directory
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy assets from attached_assets to public directory
  const assetsToMove = [
    { source: 'Tregzaa1 logo-transparent-png.png', dest: 'tregzaa-logo.png' },
    { source: 'Trekzaa Machajacy.png', dest: 'trekzaa-machajacy.png' }
  ];

  assetsToMove.forEach(({ source, dest }) => {
    const sourceFile = path.join(process.cwd(), 'attached_assets', source);
    const destFile = path.join(publicDir, dest);

    try {
      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, destFile);
        console.log(`${source} file copied successfully`);
      } else {
        console.error(`${source} source file not found:`, sourceFile);
      }
    } catch (error) {
      console.error(`Error copying ${source} file:`, error);
    }
  });

  app.use(express.static(publicDir));

  // Add global request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        console.log(logLine);
      }
    });

    next();
  });

  // Travel Preferences
  app.post("/api/preferences", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { travelStyle, accommodation, activities, transportation, budget, foodPreferences } = req.body;

      // Ensure activities is an array
      const activitiesArray = Array.isArray(activities) ? activities : [activities].filter(Boolean);

      // Check if preferences already exist for the user
      const [existingPreferences] = await db
        .select()
        .from(travelPreferences)
        .where(eq(travelPreferences.userId, req.user.id))
        .limit(1);

      let preferences;

      if (existingPreferences) {
        // Update existing preferences
        [preferences] = await db
          .update(travelPreferences)
          .set({
            travelStyle,
            accommodation,
            activities: activitiesArray,
            transportation,
            budget,
            foodPreferences,
            updatedAt: new Date(),
          })
          .where(eq(travelPreferences.userId, req.user.id))
          .returning();
      } else {
        // Insert new preferences
        [preferences] = await db
          .insert(travelPreferences)
          .values({
            userId: req.user.id,
            travelStyle,
            accommodation,
            activities: activitiesArray,
            transportation,
            budget,
            foodPreferences,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }

      res.json(preferences);
    } catch (error) {
      console.error("Error saving preferences:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Get user preferences
  app.get("/api/preferences", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [preferences] = await db
        .select()
        .from(travelPreferences)
        .where(eq(travelPreferences.userId, req.user.id))
        .limit(1);

      res.json(preferences || null);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Blog posts
  app.get("/api/blog", async (_req, res) => {
    try {
      const posts = await db.query.blogPosts.findMany({
        with: {
          author: true,
        },
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Admin-only routes
  app.delete("/api/blog/:id", requireAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const [deletedPost] = await db
        .delete(blogPostsSchema)
        .where(eq(blogPostsSchema.id, postId))
        .returning();

      if (!deletedPost) {
        return res.status(404).send("Post not found");
      }

      res.json(deletedPost);
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  app.put("/api/blog/:id", requireAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { title, content } = req.body;

      const [updatedPost] = await db
        .update(blogPostsSchema)
        .set({
          title,
          content,
          updatedAt: new Date(),
        })
        .where(eq(blogPostsSchema.id, postId))
        .returning({
          id: blogPostsSchema.id,
          title: blogPostsSchema.title,
          content: blogPostsSchema.content,
          createdAt: blogPostsSchema.createdAt,
          updatedAt: blogPostsSchema.updatedAt,
          author: {
            username: users.username,
          },
        });

      if (!updatedPost) {
        return res.status(404).send("Post not found");
      }

      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });


  // Modify the existing POST /api/blog route to ensure admin access
  app.post("/api/blog", requireAdmin, async (req, res) => {
    try {
      const { title, content } = req.body;

      const [post] = await db
        .insert(blogPostsSchema)
        .values({
          title,
          content,
          authorId: req.user!.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({
          id: blogPostsSchema.id,
          title: blogPostsSchema.title,
          content: blogPostsSchema.content,
          createdAt: blogPostsSchema.createdAt,
          author: {
            username: users.username,
          },
        });

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Guides
  app.get("/api/guides", async (_req, res) => {
    try {
      const allGuides = await db.query.guides.findMany({
        with: {
          user: true,
        },
      });
      res.json(allGuides);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Get guides by location
  app.get("/api/guides/location/:location", async (req, res) => {
    try {
      const location = req.params.location;
      const locationGuides = await db.query.guides.findMany({
        with: {
          user: true,
        },
        where: (guides, { sql }) => sql`${guides.locations} @> ARRAY[${location}]::text[]`,
      });
      res.json(locationGuides);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Register as a guide
  app.post("/api/guides/register", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    const { specialties, locations, bio } = req.body;

    try {
      // Update user as guide
      await db
        .update(users)
        .set({ isGuide: true, bio })
        .where(eq(users.id, req.user.id));

      // Create guide profile
      const [guide] = await db
        .insert(guides)
        .values({
          userId: req.user.id,
          specialties,
          locations,
          rating: "0.0",
          verified: false,
        })
        .returning();

      res.json(guide);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // AI Trip Planning
  app.post("/api/trips/plan", async (req, res) => {
    try {
      console.log("Trip planning request received:", {
        destination: req.body.destination,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        preferences: req.body.preferences
      });

      // Fetch user's travel preferences if authenticated
      let userPreferences = null;
      if (req.isAuthenticated() && req.user?.id) {
        const [preferences] = await db
          .select()
          .from(travelPreferences)
          .where(eq(travelPreferences.userId, req.user.id))
          .limit(1);

        if (preferences) {
          userPreferences = {
            travelStyle: preferences.travelStyle,
            activities: preferences.activities,
            accommodation: preferences.accommodation,
            transportation: preferences.transportation,
            budget: preferences.budget,
            foodPreferences: preferences.foodPreferences
          };
        }
      }

      const tripPlan = await generateTripRecommendations({
        ...req.body,
        travelPreferences: userPreferences
      });

      console.log("Generated trip plan:", {
        destination: tripPlan.destination,
        numberOfDays: tripPlan.numberOfDays,
        recommendedSpecialties: tripPlan.recommendedSpecialties
      });

      // First, try to get all guides to verify the table has data
      const allGuides = await db.query.guides.findMany({
        with: {
          user: true,
        },
      });
      console.log("Total guides in database:", allGuides.length);

      // Get guides for the destination with a more flexible matching approach
      const locationGuides = await db.query.guides.findMany({
        with: {
          user: true,
        },
        where: (guides, { sql }) => {
          const searchPattern = `%${req.body.destination.toLowerCase()}%`;
          console.log("Searching for guides with pattern:", searchPattern);
          return sql`EXISTS (
            SELECT 1 FROM unnest(${guides.locations}::text[]) location 
            WHERE LOWER(location) LIKE ${searchPattern}
          )`;
        }
      });

      console.log("Guides found for location:", {
        destination: req.body.destination,
        count: locationGuides.length,
        guideIds: locationGuides.map(g => g.id)
      });

      // Calculate match scores with personalization
      const guidesWithScores = locationGuides
        .map(guide => {
          try {
            if (!guide || !guide.specialties || !guide.locations || !guide.rating) {
              console.warn("Skipping guide due to missing required data:", guide?.id);
              return null;
            }

            const matchResult = calculateGuideMatchScore(guide, tripPlan, userPreferences ? {
              travelStyle: userPreferences.travelStyle || undefined,
              activities: userPreferences.activities || undefined,
              accommodation: userPreferences.accommodation || undefined,
              transportation: userPreferences.transportation || undefined,
              budget: userPreferences.budget || undefined,
              foodPreferences: userPreferences.foodPreferences || undefined
            } : undefined);
            console.log("Guide match calculation:", {
              guideId: guide.id,
              username: guide.user.username,
              specialties: guide.specialties,
              locations: guide.locations,
              matchScore: matchResult.score,
              details: matchResult.details
            });

            return {
              ...guide,
              matchScore: matchResult.score,
              matchDetails: matchResult.details,
            };
          } catch (error) {
            console.error("Error calculating match score for guide:", {
              guideId: guide.id,
              error: error instanceof Error ? error.message : "Unknown error",
              specialties: guide.specialties,
              locations: guide.locations
            });
            return null;
          }
        })
        .filter((guide): guide is NonNullable<typeof guide> => guide !== null)
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

      console.log("Final processed guides:", {
        totalProcessed: guidesWithScores.length,
        scores: guidesWithScores.map(g => ({
          id: g.id,
          score: g.matchScore,
          locations: g.locations,
          preferenceMatch: g.matchDetails?.preferenceMatch
        }))
      });

      res.json({
        ...tripPlan,
        availableGuides: guidesWithScores,
      });
    } catch (error) {
      console.error("Trip planning error:", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Save trip
  app.post("/api/trips", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [trip] = await db
        .insert(trips)
        .values({
          userId: req.user.id,
          destination: req.body.destination,
          startDate: new Date(req.body.startDate),
          endDate: new Date(req.body.endDate),
          itinerary: req.body.itinerary,
        })
        .returning();

      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Get user trips
  app.get("/api/trips", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userTrips = await db
        .select()
        .from(trips)
        .where(eq(trips.userId, req.user.id));

      res.json(userTrips);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Translate guide profile
  app.get("/api/guides/:id/translate/:lang", async (req, res) => {
    try {
      const guideId = parseInt(req.params.id);
      const targetLanguage = req.params.lang;

      const translations = await translateGuideProfile(guideId, targetLanguage);
      res.json(translations);
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Generate application icon
  app.post("/api/generate-icon", async (_req, res) => {
    try {
      const iconBase64 = await generateApplicationIcon();

      // Convert base64 to buffer and save to file
      const iconBuffer = Buffer.from(iconBase64, 'base64');
      await fs.promises.writeFile('public/generated-icon.png', iconBuffer);

      res.json({ message: "Icon generated successfully", path: '/generated-icon.png' });
    } catch (error) {
      console.error("Error generating icon:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Create booking
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { guideId, tripId, startDate, endDate, notes } = req.body;

      const [booking] = await db
        .insert(bookings)
        .values({
          userId: req.user.id,
          guideId,
          tripId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          notes,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Get user's bookings
  app.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userBookings = await db.query.bookings.findMany({
        where: (bookings, { eq }) => eq(bookings.userId, req.user.id),
        with: {
          guide: {
            with: {
              user: true
            }
          },
          trip: true
        }
      });

      res.json(userBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Get guide's bookings
  app.get("/api/guide/bookings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not a guide");
    }

    try {
      // First, get the guide's ID
      const [guide] = await db
        .select()
        .from(guides)
        .where(eq(guides.userId, req.user.id))
        .limit(1);

      if (!guide) {
        return res.status(403).send("Not a guide");
      }

      const guideBookings = await db.query.bookings.findMany({
        where: (bookings, { eq }) => eq(bookings.guideId, guide.id),
        with: {
          user: true,
          trip: true
        }
      });

      res.json(guideBookings);
    } catch (error) {
      console.error("Error fetching guide bookings:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Update booking status
  app.patch("/api/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;

      // Check if the user is either the guide or the booking owner
      const booking = await db.query.bookings.findFirst({
        where: (bookings, { eq }) => eq(bookings.id, bookingId),
        with: {
          guide: true
        }
      });

      if (!booking) {
        return res.status(404).send("Booking not found");
      }

      if (booking.userId !== req.user.id && booking.guide.userId !== req.user.id) {
        return res.status(403).send("Not authorized to update this booking");
      }

      const [updatedBooking] = await db
        .update(bookings)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).send("Message is required");
      }

      // Initialize chatMessages array if it doesn't exist
      if (!req.session.chatMessages) {
        req.session.chatMessages = [];
      }

      const response = await handleChatMessage(message, {
        previousMessages: req.session.chatMessages
      });

      // Store the conversation in the session
      req.session.chatMessages = [
        ...req.session.chatMessages,
        { role: "user", content: message },
        { role: "assistant", content: response }
      ].slice(-10); // Keep last 10 messages for context

      res.json({ message: response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });


  // Generate AI packing list
  app.post("/api/packing-lists/generate", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { destination, startDate, endDate, tripId } = req.body;

      // Get user preferences if they exist
      const [preferences] = await db
        .select()
        .from(travelPreferences)
        .where(eq(travelPreferences.userId, req.user.id))
        .limit(1);

      // Generate packing list using OpenAI
      const items = await generatePackingList({
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        preferences: preferences || undefined,
      });

      // Create new packing list
      const [list] = await db
        .insert(packingLists)
        .values({
          userId: req.user.id,
          tripId,
          name: `Packing List for ${destination}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Insert all items
      const packingItemsData = items.map(item => ({
        listId: list.id,
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
        aiSuggested: true,
      }));

      await db.insert(packingItems).values(packingItemsData);

      // Return the complete list with items
      const completeList = await db.query.packingLists.findFirst({
        where: eq(packingLists.id, list.id),
        with: {
          items: true,
        },
      });

      res.json(completeList);
    } catch (error) {
      console.error("Error generating packing list:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Get packing lists for a trip
  app.get("/api/trips/:tripId/packing-lists", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const tripId = parseInt(req.params.tripId);
      const lists = await db.query.packingLists.findMany({
        where: and(
          eq(packingLists.userId, req.user.id),
          eq(packingLists.tripId, tripId)
        ),
        with: {
          items: true,
        },
      });

      res.json(lists);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Update packing item status
  app.patch("/api/packing-items/:itemId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const itemId = parseInt(req.params.itemId);
      const { isPacked } = req.body;

      const [updatedItem] = await db
        .update(packingItems)
        .set({
          isPacked,
          updatedAt: new Date(),
        })
        .where(eq(packingItems.id, itemId))
        .returning();

      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}