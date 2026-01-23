// app/connect/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/server/db";
import ConnectClient from "./ConnectClient";

function devLog(...args: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
}

export default async function ConnectPage() {
  const session = await getServerSession(authOptions);

  devLog("[connect/page] session email =", session?.user?.email ?? null);

  if (!session?.user?.email) {
    devLog("[connect/page] no session -> render ConnectClient");
    return <ConnectClient initialEmail={session?.user?.email ?? null} />;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  devLog("[connect/page] db user =", user);

  if (!user?.id) {
    devLog("[connect/page] user not found -> render ConnectClient");
    return <ConnectClient initialEmail={session.user.email} />;
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

  devLog("[connect/page] hasAnyLocation =", hasAnyLocation);

  if (hasAnyLocation?.id) {
    devLog("[connect/page] redirect -> /dashboard/home");
    redirect("/dashboard/home");
  }

  devLog("[connect/page] no locations for user -> render ConnectClient");
  return <ConnectClient initialEmail={session.user.email} />;
}
