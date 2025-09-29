"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Monitor, Users, Check } from "lucide-react"

interface Lab {
  id: string
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
      <CardHeader className={`bg-gradient-to-r ${lab.color || "from-blue-500 to-purple-500"} text-white pb-4`}>
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
                  ? "border-blue-300 text-blue-700 dark:text-blue-400"
                  : index % 4 === 1
                    ? "border-purple-300 text-purple-700 dark:text-purple-400"
                    : index % 4 === 2
                      ? "border-green-300 text-green-700 dark:text-green-400"
                      : "border-orange-300 text-orange-700 dark:text-orange-400"
              }`}
            >
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 p-3">
        <Button
          onClick={onSelect}
          variant={isSelected ? "default" : "outline"}
          className={
            isSelected
              ? "bg-gradient-to-r from-yellow-600 to-yellow-600 hover:from-yellow-700 hover:to-yellow-700 text-white shadow-md"
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
