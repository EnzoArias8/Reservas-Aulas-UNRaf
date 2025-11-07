"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Monitor, Users, Check } from "lucide-react"

interface Lab {
  _id: string
  name: string
  building: string
  floor: string
  capacity: number
  equipment: string[]
  color?: string
}

interface LabCardProps {
  lab: Lab
  onSelect: () => void
  isSelected: boolean
}

export function LabCard({ lab, onSelect, isSelected }: LabCardProps) {
  return (
    <Card
      className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
        isSelected ? "ring-2 ring-blue-500 shadow-xl scale-105" : "hover:shadow-lg"
      } bg-white dark:bg-slate-800 border-0 shadow-md`}
    >
      <CardHeader className={`${lab.color || "bg-[#336699]"} text-white pb-4`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Monitor className="h-5 w-5" />
              <span className="text-white">{lab.name}</span>
            </CardTitle>
            <CardDescription className="mt-2 text-white/90">
              <div className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {lab.building}, {lab.floor}
              </div>
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {lab.capacity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-4">
        <h4 className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          Equipamiento:
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {lab.equipment.map((item, index) => (
            <Badge
              key={item}
              variant="outline"
              className={`text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                index % 4 === 0
                  ? "border-[#336699] text-[#336699] dark:text-[#4A8FCC]"
                  : index % 4 === 1
                    ? "border-[#00AAAA] text-[#00AAAA] dark:text-[#33CCCC]"
                    : index % 4 === 2
                      ? "border-[#FFBF00] text-[#FFBF00] dark:text-[#FFD700]"
                      : "border-[#336699]/70 text-[#336699] dark:text-[#4A8FCC]"
              }`}
            >
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t bg-slate-50 dark:bg-slate-700 p-3">
        <Button
          onClick={onSelect}
          variant={isSelected ? "default" : "outline"}
          className={
            isSelected
              ? "bg-[#FFBF00] hover:bg-[#E6A800] text-white shadow-md"
              : "border-slate-300 hover:bg-slate-50 dark:border-slate-500 dark:hover:bg-slate-700"
          }
        >
          {isSelected ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Seleccionado
            </>
          ) : (
            "Seleccionar"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
