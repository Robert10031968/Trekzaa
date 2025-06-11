import OpenAI from "openai";
import type { SelectTravelPreferences } from "@db/schema";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const CHAT_MODEL = "gpt-4o";

interface PackingItem {
  name: string;
  category: string;
  quantity: string;
  isEssential: boolean;
  notes?: string;
  weatherAppropriate?: boolean;
  activitySpecific?: string[];
}

interface GeneratePackingListOptions {
  destination: string;
  startDate: Date;
  endDate: Date;
  preferences?: Partial<SelectTravelPreferences>;
}

export async function generatePackingList({
  destination,
  startDate,
  endDate,
  preferences,
}: GeneratePackingListOptions): Promise<PackingItem[]> {
  // Calculate trip duration
  const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Get month for seasonal considerations
  const month = startDate.toLocaleString('default', { month: 'long' });

  const prompt = {
    role: "system",
    content: `You are an expert AI travel packing assistant. Generate a detailed, personalized packing list for a ${tripDuration}-day trip to ${destination} in ${month}.

    Consider these traveler preferences:
    - Travel Style: ${preferences?.travelStyle || "Not specified"}
    - Activities: ${preferences?.activities?.join(", ") || "Not specified"}
    - Transportation: ${preferences?.transportation || "Not specified"}
    - Budget Level: ${preferences?.budget || "Not specified"}
    - Food Preferences: ${preferences?.foodPreferences || "Not specified"}

    Consider the following factors:
    1. Weather and seasonal conditions in ${destination} during ${month}
    2. Common activities and cultural norms at the destination
    3. Travel style and planned activities
    4. Transportation mode and related restrictions
    5. Budget considerations for equipment recommendations

    Provide a JSON response with this format:
    {
      "items": [
        {
          "name": "Item name",
          "category": "Category (Clothing, Electronics, Documents, Toiletries, Gear, etc.)",
          "quantity": "Suggested quantity with unit (e.g., '2 pairs', '1 set', 'As needed')",
          "isEssential": true/false,
          "notes": "Packing tips, specific recommendations, or usage context",
          "weatherAppropriate": true/false,
          "activitySpecific": ["hiking", "swimming", etc] // activities this item is specifically needed for
        }
      ]
    }

    Customize the list based on:
    - Weather-appropriate clothing and gear
    - Activity-specific equipment
    - Cultural considerations
    - Transportation restrictions
    - Budget-conscious alternatives when relevant`
  };

  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "system", content: prompt.content }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.items;
  } catch (error) {
    console.error("Error generating packing list:", error);
    throw new Error("Failed to generate packing list");
  }
}