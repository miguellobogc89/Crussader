// app/connect/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/server/db";
import ConnectClient from "./ConnectClient";

export default async function ConnectPage() {
  const session = await getServerSession(authOptions);

  console.log("[connect/page] session email =", session?.user?.email ?? null);

  if (!session?.user?.email) {
    console.log("[connect/page] no session -> render ConnectClient");
    return <ConnectClient />;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  console.log("[connect/page] db user =", user);

  if (!user?.id) {
    console.log("[connect/page] user not found -> render ConnectClient");
    return <ConnectClient />;
  }

  const hasAnyLocation = await prisma.userCompany.findFirst({
    where: {
      userId: user.id,
      Company: {
        Location: { some: {} },
      },
    },
    select: {
      id: true,
      companyId: true,
      Company: {
        select: {
          id: true,
          _count: { select: { Location: true } },
        },
      },
    },
  });

  console.log("[connect/page] hasAnyLocation =", hasAnyLocation);

  if (hasAnyLocation?.id) {
    console.log("[connect/page] redirect -> /dashboard/home");
    redirect("/dashboard/home");
  }

  console.log("[connect/page] no locations for user -> render ConnectClient");
  return <ConnectClient />;
}
