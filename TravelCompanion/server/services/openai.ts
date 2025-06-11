import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TripPlan {
  destination: string;
  summary: string;
  numberOfDays: number;
  travelStyle: string;
  recommendedSpecialties: string[];
  itinerary: Record<string, { activities: string[]; accommodation: string }>;
  tips: string[];
}

interface GuideMatchDetails {
  specialtyMatch: number;
  locationMatch: number;
  ratingScore: number;
  preferenceMatch: number;
}

interface TravelPreferences {
  travelStyle?: string;
  activities?: string[];
  accommodation?: string;
  transportation?: string;
  budget?: string;
  foodPreferences?: string;
}

export async function generateTripRecommendations(userInput: {
  destination: string;
  startDate: string;
  endDate: string;
  preferences: string;
  travelPreferences?: TravelPreferences;
}): Promise<TripPlan> {
  try {
    const { travelPreferences } = userInput;
    const preferencesContext = travelPreferences
      ? `Consider these user preferences:
         Travel Style: ${travelPreferences.travelStyle || 'Not specified'}
         Preferred Activities: ${travelPreferences.activities?.join(', ') || 'Not specified'}
         Accommodation: ${travelPreferences.accommodation || 'Not specified'}
         Transportation: ${travelPreferences.transportation || 'Not specified'}
         Budget: ${travelPreferences.budget || 'Not specified'}
         Food Preferences: ${travelPreferences.foodPreferences || 'Not specified'}`
      : 'No specific user preferences available';

    const prompt = `As an expert travel planner, create a detailed personalized trip plan for ${
      userInput.destination
    } from ${userInput.startDate} to ${
      userInput.endDate
    }. ${preferencesContext}
    Additional preferences: ${userInput.preferences || "No specific preferences"}

    Provide a JSON response with:
    {
      "destination": "${userInput.destination}",
      "summary": "A compelling 2-3 sentence overview of the trip",
      "numberOfDays": "Calculate based on start and end dates",
      "travelStyle": "Adventure/Luxury/Cultural/etc based on preferences",
      "recommendedSpecialties": ["List 3-4 relevant guide specialties based on user preferences"],
      "itinerary": {
        "day1": {
          "activities": ["3-4 specific activities with timing"],
          "accommodation": {
            "luxury": "Specific luxury hotel recommendation",
            "budget": "Specific budget accommodation option"
          }
        }
        // Repeat for each day
      },
      "tips": ["4-5 specific local tips and cultural insights"]
    }

    Important guidelines:
    1. Activities should match user's preferred style and interests
    2. Include a mix of popular and off-the-beaten-path recommendations
    3. Consider local events happening during the travel dates
    4. Match guide specialties to both destination highlights and user preferences`;

    // Note: the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert travel planner with deep knowledge of destinations worldwide. Focus on creating highly personalized recommendations that match user preferences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    console.log("OpenAI response:", content);
    const tripPlan = JSON.parse(content) as TripPlan;

    // Ensure recommendedSpecialties exists and is an array
    if (!tripPlan.recommendedSpecialties || !Array.isArray(tripPlan.recommendedSpecialties)) {
      tripPlan.recommendedSpecialties = ["Culture", "Food", "Adventure"];
    }

    return tripPlan;
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    throw new Error(
      `Failed to generate trip recommendations: ${error.message}`
    );
  }
}

export function calculateGuideMatchScore(
  guide: {
    specialties: string[] | null;
    locations: string[] | null;
    rating: string | null;
  },
  tripPlan: TripPlan,
  userPreferences?: TravelPreferences
): { score: number; details: GuideMatchDetails } {
  const specialtyWeight = 0.3;
  const locationWeight = 0.3;
  const ratingWeight = 0.2;
  const preferenceWeight = 0.2;

  if (!guide.specialties || !guide.locations || !tripPlan.recommendedSpecialties) {
    throw new Error("Missing required data for score calculation");
  }

  // Match specialties with recommended specialties
  const specialtyMatches = guide.specialties.filter(specialty =>
    tripPlan.recommendedSpecialties.map(s => s.toLowerCase()).includes(specialty.toLowerCase())
  ).length;
  const specialtyMatch = Math.min(1, specialtyMatches / tripPlan.recommendedSpecialties.length);

  // Location match - considers partial matches
  const locationMatch = guide.locations.some(location => {
    const guideLoc = location.toLowerCase();
    const tripLoc = tripPlan.destination.toLowerCase();
    return guideLoc.includes(tripLoc) || tripLoc.includes(guideLoc);
  }) ? 1 : 0;

  // Rating score (convert "4.5" to 0.9)
  const ratingScore = guide.rating ? parseFloat(guide.rating) / 5 : 0;

  // Calculate preference match if user preferences are available
  let preferenceMatch = 0;
  if (userPreferences) {
    let matchCount = 0;
    let totalPreferences = 0;

    if (userPreferences.travelStyle) {
      totalPreferences++;
      if (guide.specialties.some(s =>
        s.toLowerCase().includes(userPreferences.travelStyle?.toLowerCase() || ''))) {
        matchCount++;
      }
    }

    if (userPreferences.activities) {
      totalPreferences += userPreferences.activities.length;
      matchCount += guide.specialties.filter(specialty =>
        userPreferences.activities?.some(activity =>
          activity.toLowerCase().includes(specialty.toLowerCase()) ||
          specialty.toLowerCase().includes(activity.toLowerCase())
        )
      ).length;
    }

    preferenceMatch = totalPreferences > 0 ? matchCount / totalPreferences : 0;
  }

  // Calculate weighted score
  const score =
    specialtyMatch * specialtyWeight +
    locationMatch * locationWeight +
    ratingScore * ratingWeight +
    preferenceMatch * preferenceWeight;

  return {
    score: Math.round(score * 100) / 100, // Round to 2 decimal places
    details: {
      specialtyMatch,
      locationMatch,
      ratingScore,
      preferenceMatch
    }
  };
}

// Add icon generation function
export async function generateApplicationIcon(): Promise<string> {
  try {
    const prompt = `Create a modern, professional travel app icon that matches this description:
    - Simple, geometric compass rose design in the center
    - Clean, minimal lines with a subtle 3D effect
    - Use a color palette of deep blues and teals
    - Professional and polished finish
    - Must be instantly recognizable as a travel/navigation icon
    - Suitable for both light and dark backgrounds
    - The design should work well at small sizes and maintain clarity
    - Keep the design simple and avoid complex patterns or textures`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json"
    });

    if (!response.data[0].b64_json) {
      throw new Error("No image data received from OpenAI");
    }

    return response.data[0].b64_json;
  } catch (error) {
    console.error("Error generating icon:", error);
    throw new Error(`Failed to generate icon: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}