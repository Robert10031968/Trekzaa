import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "react-date-range";
import { useToast } from "@/hooks/use-toast";
import type { Guide } from "@/types/guide";
import { Loader2, CalendarDays, PencilLine } from "lucide-react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface BookingModalProps {
  guide: Guide;
  tripId?: number;
  open: boolean;
  onClose: () => void;
}

export function BookingModal({ guide, tripId, open, onClose }: BookingModalProps) {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    key: "selection",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      notes: "",
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guideId: guide.id,
          tripId,
          startDate: format(dateRange.startDate, "yyyy-MM-dd"),
          endDate: format(dateRange.endDate, "yyyy-MM-dd"),
          notes: data.notes,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking request sent!",
        description: "The guide will be notified and will respond to your request.",
      });
      reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send booking request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDateRangeChange = (ranges: any) => {
    setDateRange(ranges.selection);
  };

  const onSubmit = handleSubmit((data) => {
    bookingMutation.mutate(data);
  });

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <DialogHeader className="px-4 pt-4 pb-2 bg-muted/50 shrink-0">
                <DialogTitle className="text-lg">
                  Book Guide: {guide.user.username}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  They'll respond to your request within 24 hours.
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto flex-grow px-4 py-2">
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarDays className="h-4 w-4" />
                      Select Travel Dates
                    </div>
                    <div className="rounded-lg border bg-card">
                      <DateRangePicker
                        ranges={[dateRange]}
                        onChange={handleDateRangeChange}
                        minDate={new Date()}
                        rangeColors={["hsl(var(--primary))"]}
                        months={1}
                        direction="vertical"
                        className="!w-full [&_.rdrMonth]:!w-full [&_.rdrCalendarWrapper]:!w-full [&_.rdrDateRangeWrapper]:!w-full [&_.rdrDefinedRangesWrapper]:!hidden"
                        showDateDisplay={false}
                        showMonthAndYearPickers={true}
                        showPreview={true}
                        weekdayDisplayFormat="EEEEE"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {dateRange.startDate && dateRange.endDate && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-1 text-xs"
                        >
                          <span>Selected:</span>
                          <span className="font-medium text-foreground">
                            {format(dateRange.startDate, "PP")} -{" "}
                            {format(dateRange.endDate, "PP")}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <PencilLine className="h-4 w-4" />
                      Additional Notes
                    </div>
                    <Textarea
                      {...register("notes")}
                      placeholder="Add any special requests or notes..."
                      className="min-h-[60px] resize-none text-sm"
                    />
                    {errors.notes && (
                      <p className="text-xs text-red-500">{errors.notes.message}</p>
                    )}
                  </div>
                </form>
              </div>

              <div className="px-4 py-3 bg-muted/50 border-t shrink-0">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={onClose}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={onSubmit}
                    disabled={bookingMutation.isPending}
                    size="sm"
                  >
                    {bookingMutation.isPending ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </motion.div>
                    ) : (
                      "Send Request"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}