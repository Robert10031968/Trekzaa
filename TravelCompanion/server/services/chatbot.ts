import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const CHAT_MODEL = "gpt-4o";

const systemPrompt = `You are a friendly AI travel assistant. Help users plan their trips by providing helpful information and suggestions.

Always respond in this JSON format:
{
  "message": "Your response message here"
}

When a user asks about specific travel details or is ready to create a trip, include trip details like this:
{
  "message": "Your response message here",
  "tripDetails": {
    "destination": "City name",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "createTrip": true
  }
}`;

export async function handleChatMessage(
  message: string,
  context?: { previousMessages?: ChatCompletionMessageParam[] }
): Promise<{
  message: string;
  tripId?: number;
  destination?: string;
  startDate?: string;
  endDate?: string;
}> {
  try {
    console.log("Processing chat message:", message);
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...(context?.previousMessages || []),
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    console.log("OpenAI response content:", content);

    if (!content) {
      console.error("Empty response from OpenAI");
      return { message: "I'm sorry, I couldn't generate a response. Please try again." };
    }

    try {
      const parsedContent = JSON.parse(content);
      console.log("Parsed OpenAI response:", parsedContent);

      if (!parsedContent.message || typeof parsedContent.message !== 'string') {
        console.error("Invalid message format in response:", parsedContent);
        return { message: "I'm sorry, I couldn't understand that. Could you rephrase your question?" };
      }

      // If we have trip details, include them in the response
      if (parsedContent.tripDetails?.createTrip) {
        return {
          message: parsedContent.message,
          destination: parsedContent.tripDetails.destination,
          startDate: parsedContent.tripDetails.startDate,
          endDate: parsedContent.tripDetails.endDate
        };
      }

      return { message: parsedContent.message };
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      return { message: "I'm sorry, I had trouble processing that. Could you try again?" };
    }
  } catch (error) {
    console.error("Error in chat processing:", error);
    throw new Error("Failed to process your message. Please try again.");
  }
}