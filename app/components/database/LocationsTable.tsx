// app/components/database/LocationsTable.tsx
"use client";

import * as React from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Calendar, Settings, Star, Trash2 } from "lucide-react";

export type UiLocationRow = {
  id: string | number;
  name: string;
  address: string;
  category: string;
  createdAt: string; // ISO
  connected: boolean;
  avgRating: number;
  totalReviews: number;
  monthlyReviews: number;
  lastSync: string;
  status: string;
  responseRate: number;
};

function getStatusBadge(status: string, connected: boolean) {
  if (!connected) return <Badge variant="destructive">Desconectado</Badge>;

  switch (status) {
    case "active":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Activo</Badge>;
    case "pending":
      return <Badge variant="secondary">Pendiente</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
}

function getRatingColor(rating: number) {
  if (rating >= 4.5) return "text-green-600";
  if (rating >= 4.0) return "text-yellow-600";
  return "text-red-600";
}

export default function LocationsTable({
  rows,
  loading,
  selectedId,
  onSelect,
}: {
  rows: UiLocationRow[];
  loading: boolean;
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
}) {
  return (
    <Card>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ubicaciones Registradas</h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Conectado</span>
            <div className="ml-4 h-2 w-2 rounded-full bg-red-500" />
            <span>Desconectado</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Ubicación</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead className="text-center">Reviews</TableHead>
                <TableHead className="text-center">Este Mes</TableHead>
                <TableHead className="text-center">% Respuestas</TableHead>
                <TableHead>Última Sync</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`s-${i}`}>
                    <TableCell colSpan={10}>
                      <div className="h-10 w-full animate-pulse rounded bg-muted/40" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-6 text-center text-sm text-muted-foreground">
                    No hay ubicaciones todavía.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((location) => (
                  <TableRow
                    key={location.id}
                    className={`cursor-pointer transition-colors ${
                      selectedId === location.id ? "bg-muted/50" : "hover:bg-muted/30"
                    }`}
                    onClick={() => onSelect(location.id)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            location.connected ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-sm text-muted-foreground">{location.address}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">{location.category}</Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(location.createdAt).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(location.status, location.connected)}</TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Star className={`h-4 w-4 ${getRatingColor(location.avgRating)}`} />
                        <span className={`font-medium ${getRatingColor(location.avgRating)}`}>
                          {location.avgRating.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-medium">{location.totalReviews}</TableCell>

                    <TableCell className="text-center">
                      <Badge variant={location.monthlyReviews > 0 ? "default" : "secondary"}>
                        {location.monthlyReviews > 0 ? `+${location.monthlyReviews}` : "0"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <div
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          location.responseRate >= 90
                            ? "bg-green-100 text-green-700"
                            : location.responseRate >= 70
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {location.responseRate}%
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">{location.lastSync}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
