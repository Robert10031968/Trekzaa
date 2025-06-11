import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import type { MoodBoardImage } from "./MoodBoard";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SortableImageProps {
  image: MoodBoardImage;
  onRemove: (id: string) => void;
}

export function SortableImage({ image, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: image.id });

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className="group relative aspect-square rounded-lg overflow-hidden cursor-move touch-none border border-border hover:border-primary/50 transition-colors"
    >
      <img
        src={image.url}
        alt={image.caption || "Mood board image"}
        className="w-full h-full object-cover"
      />
      {image.caption && (
        <div className="absolute inset-x-0 bottom-0 p-2 bg-black/50 backdrop-blur-sm text-white text-sm">
          {image.caption}
        </div>
      )}
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(image.id);
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}