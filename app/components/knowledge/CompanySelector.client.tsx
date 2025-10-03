"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";

type Company = { id: string; name: string | null };

export default function CompanySelectorClient({
  companies,
  selectedCompanyId,
  basePath,
}: {
  companies: Company[];
  selectedCompanyId: string;
  basePath: string;
}) {
  return (
    <Card className="p-4 flex items-end justify-between gap-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Empresa</Label>
        <Select
          defaultValue={selectedCompanyId}
          onValueChange={(val) => {
            const form = document.createElement("form");
            form.method = "get";
            form.action = basePath;
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "companyId";
            input.value = val;
            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
          }}
        >
          <SelectTrigger className="w-[340px]">
            <SelectValue placeholder="Selecciona empresa" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name ?? c.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
