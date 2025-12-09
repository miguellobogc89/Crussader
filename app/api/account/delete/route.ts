// app/api/account/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        account_User_account_idToaccount: true,
      },
    });

    if (!user?.account_id)
      return NextResponse.json({ error: "No account" }, { status: 400 });

    const account = await prisma.account.findUnique({
      where: { id: user.account_id },
    });

    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });

    if (account.owner_user_id !== user.id)
      return NextResponse.json({ error: "Only owner can delete account" }, { status: 403 });

    // Option A: Hard delete (cascade)
    await prisma.account.delete({
      where: { id: account.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
