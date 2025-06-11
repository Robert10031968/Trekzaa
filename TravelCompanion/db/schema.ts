import { pgTable, text, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  isGuide: boolean("is_guide").default(false),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const travelPreferences = pgTable("travel_preferences", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).unique(),
  travelStyle: text("travel_style"),
  accommodation: text("accommodation"),
  activities: text("activities").array(),
  transportation: text("transportation"),
  budget: text("budget"),
  foodPreferences: text("food_preferences"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: serial("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const guides = pgTable("guides", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  specialties: text("specialties").array(),
  locations: text("locations").array(),
  rating: text("rating"),
  verified: boolean("verified").default(false),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  guideId: serial("guide_id").references(() => guides.id),
  tripId: serial("trip_id").references(() => trips.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default('pending'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  destination: text("destination").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  itinerary: jsonb("itinerary"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const photoAlbums = pgTable("photo_albums", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  tripId: serial("trip_id").references(() => trips.id),
  title: text("title").notNull(),
  description: text("description"),
  coverPhotoId: serial("cover_photo_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  albumId: serial("album_id").references(() => photoAlbums.id),
  userId: serial("user_id").references(() => users.id),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  location: text("location"),
  takenAt: timestamp("taken_at"),
  aiDescription: text("ai_description"),
  aiTags: text("ai_tags").array(),
  aiMoodScore: jsonb("ai_mood_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const packingLists = pgTable("packing_lists", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  tripId: serial("trip_id").references(() => trips.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const packingItems = pgTable("packing_items", {
  id: serial("id").primaryKey(),
  listId: serial("list_id").references(() => packingLists.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: text("quantity").notNull(),
  isPacked: boolean("is_packed").default(false),
  isEssential: boolean("is_essential").default(false),
  notes: text("notes"),
  aiSuggested: boolean("ai_suggested").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  blogPosts: many(blogPosts),
  trips: many(trips),
  guide: many(guides),
  photoAlbums: many(photoAlbums),
  photos: many(photos),
  travelPreferences: one(travelPreferences, {
    fields: [users.id],
    references: [travelPreferences.userId],
  }),
  bookings: many(bookings),
  packingLists: many(packingLists),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));

export const guidesRelations = relations(guides, ({ one, many }) => ({
  user: one(users, {
    fields: [guides.userId],
    references: [users.id],
  }),
  bookings: many(bookings),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  photoAlbums: many(photoAlbums),
  bookings: many(bookings),
}));

export const photoAlbumsRelations = relations(photoAlbums, ({ one, many }) => ({
  user: one(users, {
    fields: [photoAlbums.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [photoAlbums.tripId],
    references: [trips.id],
  }),
  photos: many(photos),
  coverPhoto: one(photos, {
    fields: [photoAlbums.coverPhotoId],
    references: [photos.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  album: one(photoAlbums, {
    fields: [photos.albumId],
    references: [photoAlbums.id],
  }),
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
}));

export const travelPreferencesRelations = relations(travelPreferences, ({ one }) => ({
  user: one(users, {
    fields: [travelPreferences.userId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  guide: one(guides, {
    fields: [bookings.guideId],
    references: [guides.id],
  }),
  trip: one(trips, {
    fields: [bookings.tripId],
    references: [trips.id],
  }),
}));

export const packingListsRelations = relations(packingLists, ({ one, many }) => ({
  user: one(users, {
    fields: [packingLists.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [packingLists.tripId],
    references: [trips.id],
  }),
  items: many(packingItems),
}));

export const packingItemsRelations = relations(packingItems, ({ one }) => ({
  list: one(packingLists, {
    fields: [packingItems.listId],
    references: [packingLists.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertTravelPreferencesSchema = createInsertSchema(travelPreferences);
export const selectTravelPreferencesSchema = createSelectSchema(travelPreferences);
export const insertPhotoAlbumSchema = createInsertSchema(photoAlbums);
export const selectPhotoAlbumSchema = createSelectSchema(photoAlbums);
export const insertPhotoSchema = createInsertSchema(photos);
export const selectPhotoSchema = createSelectSchema(photos);
export const insertBookingSchema = createInsertSchema(bookings);
export const selectBookingSchema = createSelectSchema(bookings);
export const insertPackingListSchema = createInsertSchema(packingLists);
export const selectPackingListSchema = createSelectSchema(packingLists);
export const insertPackingItemSchema = createInsertSchema(packingItems);
export const selectPackingItemSchema = createSelectSchema(packingItems);

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertTravelPreferences = typeof travelPreferences.$inferInsert;
export type SelectTravelPreferences = typeof travelPreferences.$inferSelect;
export type InsertPhotoAlbum = typeof photoAlbums.$inferInsert;
export type SelectPhotoAlbum = typeof photoAlbums.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;
export type SelectPhoto = typeof photos.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;
export type SelectBooking = typeof bookings.$inferSelect;
export type InsertPackingList = typeof packingLists.$inferInsert;
export type SelectPackingList = typeof packingLists.$inferSelect;
export type InsertPackingItem = typeof packingItems.$inferInsert;
export type SelectPackingItem = typeof packingItems.$inferSelect;