import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma"; // ajusta la ruta a tu prisma

const PutSchema = z.object({
  title: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  companyId: z.string().min(1).nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // TODO: auth/permissions
  const loc = await prisma.location.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      postalCode: true,
      companyId: true,
      company: { select: { id: true, name: true } },
    },
  });
  if (!loc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(loc);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  // TODO: auth/permissions
  const json = await req.json();
  const body = PutSchema.parse(json);

  const updated = await prisma.location.update({
    where: { id: params.id },
    data: {
      title: body.title,
      address: body.address,
      city: body.city,
      postalCode: body.postalCode,
      companyId: body.companyId ?? undefined,
    },
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      postalCode: true,
      companyId: true,
      company: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // TODO: auth/permissions + soft delete si aplica
  await prisma.location.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
