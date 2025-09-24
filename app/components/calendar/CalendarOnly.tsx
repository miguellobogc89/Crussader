"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Props = {
  selectedView: "month" | "week" | "day";
  onChangeView: (v: "month" | "week" | "day") => void;
  selectedDate?: Date;
  onChangeDate: (d?: Date) => void;
};

type MockEvent = {
  id: number;
  date: Date;
  title: string;
  time: string;  // "HH:mm"
  type: "appointment" | "checkup" | "surgery" | "cleaning" | string;
};

// Mock events (solo demo visual)
const mockEvents: MockEvent[] = [
  { id: 1, date: new Date(), title: "Consulta Dr. López", time: "09:00", type: "appointment" },
  { id: 2, date: new Date(), title: "Revisión dental", time: "14:30", type: "checkup" },
  { id: 3, date: addDays(new Date(), 1), title: "Cirugía menor", time: "11:00", type: "surgery" },
  { id: 4, date: addDays(new Date(), 2), title: "Limpieza", time: "16:00", type: "cleaning" },
];

export default function EnhancedCalendar({
  selectedView,
  onChangeView,
  selectedDate,
  onChangeDate,
}: Props) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const today = new Date();

  // Si el padre cambia selectedDate, mantenemos el periodo visible coherente (mes/semana/día)
  useEffect(() => {
    if (selectedDate) setCurrentDate(selectedDate);
  }, [selectedDate]);

  const getEventsForDate = (date: Date): MockEvent[] => {
    return mockEvents.filter((event: MockEvent) => isSameDay(event.date, date));
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (selectedView === "month") newDate.setMonth(newDate.getMonth() - 1);
    else if (selectedView === "week") newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (selectedView === "month") newDate.setMonth(newDate.getMonth() + 1);
    else if (selectedView === "week") newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(today);
    onChangeDate(today);
  };

  const renderMonthView = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

    const days: Date[] = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((dayLabel: string) => (
            <div key={dayLabel} className="text-center text-sm font-medium text-muted-foreground py-2">
              {dayLabel}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day: Date) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => onChangeDate(day)}
                className={cn(
                  "relative min-h-[120px] p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md",
                  "flex flex-col bg-card/50 backdrop-blur-sm",
                  isCurrentMonth ? "opacity-100" : "opacity-40",
                  isTodayDate && "ring-2 ring-primary/50 bg-primary/5",
                  isSelected && "border-primary bg-primary/10 shadow-lg shadow-primary/20",
                  !isSelected && "border-border/50 hover:border-primary/30"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-2",
                    isTodayDate && "text-primary font-bold",
                    isSelected && "text-primary"
                  )}
                >
                  {day.getDate()}
                </div>

                <div className="flex-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event: MockEvent) => (
                    <div key={event.id} className="text-xs p-1 rounded bg-accent/20 text-accent-foreground truncate">
                      <div className="font-medium">{event.time}</div>
                      <div className="opacity-75">{event.title}</div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays: Date[] = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(weekStart, { weekStartsOn: 1 }),
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day: Date) => {
            const dayEvents = getEventsForDate(day);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => onChangeDate(day)}
                className={cn(
                  "relative min-h-[200px] p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                  "flex flex-col bg-card/50 backdrop-blur-sm hover:shadow-lg",
                  isTodayDate && "ring-2 ring-primary/50 bg-primary/5",
                  isSelected && "border-primary bg-primary/10 shadow-lg shadow-primary/20",
                  !isSelected && "border-border/50 hover:border-primary/30"
                )}
              >
                <div className="text-center mb-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {format(day, "EEE", { locale: es })}
                  </div>
                  <div className={cn("text-lg font-bold", isTodayDate && "text-primary", isSelected && "text-primary")}>
                    {day.getDate()}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  {dayEvents.map((event: MockEvent) => (
                    <div key={event.id} className="p-2 rounded-md bg-accent/20 text-accent-foreground">
                      <div className="font-medium text-sm">{event.time}</div>
                      <div className="text-xs opacity-90">{event.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours: number[] = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-4">
        <div
          className={cn(
            "text-center p-6 rounded-lg border-2 bg-card/50 backdrop-blur-sm",
            isToday(currentDate) && "ring-2 ring-primary/50 bg-primary/5",
            "border-primary/30"
          )}
        >
          <div className="text-2xl font-bold mb-2">{format(currentDate, "EEEE, d MMMM yyyy", { locale: es })}</div>
          <div className="text-muted-foreground">
            {dayEvents.length} {dayEvents.length === 1 ? "cita" : "citas"} programadas
          </div>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {hours.map((hour: number) => {
            const hourEvents = dayEvents.filter((event: MockEvent) => parseInt(event.time.split(":")[0] || "0", 10) === hour);

            return (
              <div key={hour} className="flex border-b border-border/30 pb-2">
                <div className="w-16 text-sm text-muted-foreground font-medium">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                <div className="flex-1 ml-4 space-y-1">
                  {hourEvents.map((event: MockEvent) => (
                    <div key={event.id} className="p-3 rounded-md bg-accent/20 text-accent-foreground border-l-4 border-primary">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm opacity-75">{event.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getCurrentPeriodText = () => {
    if (selectedView === "month") {
      return format(currentDate, "MMMM yyyy", { locale: es });
    } else if (selectedView === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`;
    } else {
      return format(currentDate, "EEEE, d MMMM yyyy", { locale: es });
    }
  };

  return (
    <div className="w-full max-w-none">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalIcon className="h-5 w-5 text-primary" />
              Agenda
            </CardTitle>
            <div className="flex items-center gap-2">
              <Tabs value={selectedView} onValueChange={(v) => onChangeView(v as "month" | "week" | "day")}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="month">Mes</TabsTrigger>
                  <TabsTrigger value="week">Semana</TabsTrigger>
                  <TabsTrigger value="day">Día</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <h2 className="text-lg font-semibold text-center flex-1 capitalize">{getCurrentPeriodText()}</h2>

            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoy
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="w-full">
            {selectedView === "month" && renderMonthView()}
            {selectedView === "week" && renderWeekView()}
            {selectedView === "day" && renderDayView()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
