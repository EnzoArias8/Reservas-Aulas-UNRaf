"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ClockIcon, XCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TimeSlotPickerProps {
  timeSlots: string[]
  availableTimeSlots: string[]
  selectedTimeSlot: string
  onSelectTimeSlot: (timeSlot: string) => void
}

export function TimeSlotPicker({
  timeSlots,
  availableTimeSlots,
  selectedTimeSlot,
  onSelectTimeSlot,
}: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {timeSlots.map((slot) => {
        const isAvailable = availableTimeSlots.includes(slot)

        return (
          <TooltipProvider key={slot}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "justify-start h-auto py-3 px-4 w-full",
                      selectedTimeSlot === slot && "border-primary bg-primary/10",
                      !isAvailable && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => isAvailable && onSelectTimeSlot(slot)}
                    disabled={!isAvailable}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center">
                        <ClockIcon className="mr-2 h-4 w-4" />
                        {slot}
                      </div>
                      {!isAvailable && <XCircle className="h-4 w-4 text-red-500" />}
                    </div>
                  </Button>
                </div>
              </TooltipTrigger>
              {!isAvailable && (
                <TooltipContent>
                  <p>Este horario ya está reservado</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}
