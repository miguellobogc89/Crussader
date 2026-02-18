// app/components/crm/lead/NewLeadModal.tsx
"use client";

import { useState } from "react";
import { createLead, LeadLite } from "@/app/components/crm/lead/leadsApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (lead: LeadLite) => void;
};

export default function NewLeadModal({ open, onOpenChange, onCreated }: Props) {
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [rating, setRating] = useState("");
  const [reviewCount, setReviewCount] = useState("");

  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [website, setWebsite] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [placeId, setPlaceId] = useState("");

  async function onSubmit() {
    if (!name.trim() || !email.trim()) return;

    setSaving(true);
    try {
      const lead = await createLead({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        rating: rating.trim() || undefined,
        reviewCount: reviewCount.trim() || undefined,
        city: city.trim() || undefined,
        category: category.trim() || undefined,
        website: website.trim() || undefined,
        mapsUrl: mapsUrl.trim() || undefined,
        placeId: placeId.trim() || undefined,
        type: "TEST_USER",
      });

      onCreated(lead);
      onOpenChange(false);

      setName("");
      setEmail("");
      setPhone("");
      setRating("");
      setReviewCount("");
      setCity("");
      setCategory("");
      setWebsite("");
      setMapsUrl("");
      setPlaceId("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Nuevo lead</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Clínica Dental X" />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@..." />
          </div>

          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 ..." />
          </div>

          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <Input value={rating} onChange={(e) => setRating(e.target.value)} placeholder="4.6" />
          </div>

          <div className="space-y-2">
            <Label>Volumen (reseñas)</Label>
            <Input value={reviewCount} onChange={(e) => setReviewCount(e.target.value)} placeholder="120" />
          </div>

          <div className="space-y-2">
            <Label>Ciudad</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Madrid" />
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Dentista" />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Google Maps URL</Label>
            <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Place ID</Label>
            <Input value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder="ChIJ..." />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void onSubmit()} disabled={saving || !name.trim() || !email.trim()}>
            Crear
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
