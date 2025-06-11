import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface ChatInterfaceProps {
  onTripCreated?: (tripId: number) => void;
}

interface ChatResponse {
  message: string;
  tripId?: number;
  destination?: string;
  startDate?: string;
  endDate?: string;
}

export function ChatInterface({ onTripCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Set initial welcome message
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm your AI travel assistant. I'd love to help you plan your perfect trip. Where would you like to go?"
      }
    ]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string): Promise<ChatResponse> => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      console.log("Chat response data:", data);
      return data;
    },
    onMutate: (message: string) => {
      // Optimistically add user message
      setMessages(prev => [...prev, {
        role: "user",
        content: message.trim()
      }]);
    },
    onSuccess: (data) => {
      console.log("Processing chat response:", data);

      // Ensure data.message is a string before adding it to messages
      const messageContent = typeof data.message === 'string' 
        ? data.message 
        : "I apologize, but I couldn't process that properly. Please try again.";

      // Add assistant's response
      setMessages(prev => [...prev, {
        role: "assistant",
        content: messageContent
      }]);

      // Handle trip creation if we got trip details
      if (data.tripId && data.destination && data.startDate && data.endDate && onTripCreated) {
        onTripCreated(data.tripId);
      }
    },
    onError: (error: Error) => {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I encountered an error. Please try again."
      }]);
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    chatMutation.mutate(input.trim());
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="w-full flex flex-col" style={{ height: 'calc(100vh - 16rem)' }}>
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Travel Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                } mb-4`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === "assistant"
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
            {chatMutation.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-4"
              >
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
        <div className="flex gap-2 shrink-0 pt-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={chatMutation.isPending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={chatMutation.isPending || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}