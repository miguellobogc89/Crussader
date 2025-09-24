"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/app/components/ui/calendar";
import { Calendar as CalIcon } from "lucide-react";

type Props = {
  selectedView: "month" | "week" | "day";
  onChangeView: (v: "month" | "week" | "day") => void;
  selectedDate?: Date;
  onChangeDate: (d?: Date) => void;
};

export default function CalendarOnly({
  selectedView,
  onChangeView,
  selectedDate,
  onChangeDate,
}: Props) {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalIcon className="h-5 w-5 text-primary" />
            Calendario
          </CardTitle>
          <Tabs value={selectedView} onValueChange={(v) => onChangeView(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="month">Mes</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="day">Día</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        <CalendarComponent
        mode="single"
        selected={selectedDate}
        onSelect={onChangeDate}
        className="rounded-md border border-border/50 bg-background/50 backdrop-blur-sm"
        classNames={{
            day: "h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100",
            day_selected:
            "h-9 w-9 rounded-md ring-2 ring-purple-500 ring-offset-2 ring-offset-background bg-purple-50 text-foreground hover:bg-purple-100 hover:text-foreground",
            day_today: "h-9 w-9 rounded-md border-2 border-purple-300",
        }}
        />

      </CardContent>
    </Card>
  );
}
