import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableImage } from "./SortableImage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export interface MoodBoardImage {
  id: string;
  url: string;
  caption?: string;
}

interface MoodBoardProps {
  images: MoodBoardImage[];
  onImagesChange: (images: MoodBoardImage[]) => void;
}

export function MoodBoard({ images, onImagesChange }: MoodBoardProps) {
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((item) => item.id === active.id);
    const newIndex = images.findIndex((item) => item.id === over.id);

    const newImages = arrayMove(images, oldIndex, newIndex);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      const newImages = await Promise.all(
        Array.from(files).map((file) => {
          return new Promise<MoodBoardImage>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                resolve({
                  id: `image-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                  url: e.target.result as string,
                });
              } else {
                reject(new Error("Failed to read file"));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      onImagesChange([...images, ...newImages]);
      toast({
        title: "Images added",
        description: `Added ${newImages.length} new images to your mood board`,
      });
    } catch (error) {
      console.error("Error adding images:", error);
      toast({
        title: "Error adding images",
        description: "Failed to add images to your mood board",
        variant: "destructive",
      });
    }
  }, [images, onImagesChange, toast]);

  const handleRemoveImage = useCallback((imageId: string) => {
    const newImages = images.filter((img) => img.id !== imageId);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Travel Mood Board</h3>
        <div>
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <label htmlFor="image-upload">
            <Button variant="outline" className="cursor-pointer" asChild>
              <span>
                <Plus className="h-4 w-4 mr-2" />
                Add Images
              </span>
            </Button>
          </label>
        </div>
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 rounded-lg border-2 border-dashed transition-colors ${
        "border-gray-200 hover:border-primary/30"
      }`}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images} strategy={rectSortingStrategy}>
            {images.map((image) => (
              <SortableImage
                key={image.id}
                image={image}
                onRemove={handleRemoveImage}
              />
            ))}
          </SortableContext>
        </DndContext>

        {images.length === 0 && (
          <motion.div
            className="col-span-full h-40 flex items-center justify-center text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Add images to create your travel mood board
          </motion.div>
        )}
      </div>
    </div>
  );
}