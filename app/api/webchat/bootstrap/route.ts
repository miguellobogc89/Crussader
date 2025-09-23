import { NextResponse } from "next/server";
import { prismaRaw as prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth"; // v5: no necesita authOptions

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Puedes pasar ?key=PUBLIC_KEY o ?siteId=... (prefiere key)
    const key = searchParams.get("key");
    const siteIdParam = searchParams.get("siteId");

    // 1) Resolver el WebchatSite
    let site = null as null | {
      id: string;
      name: string | null;
      companyId: string;
      settings: any | null;
    };

    if (key) {
      site = await prisma.webchatSite.findUnique({
        where: { publicKey: key },
        select: { id: true, name: true, companyId: true, settings: true },
      });
    } else if (siteIdParam) {
      site = await prisma.webchatSite.findUnique({
        where: { id: siteIdParam },
        select: { id: true, name: true, companyId: true, settings: true },
      });
    }

    if (!site) {
      return NextResponse.json({ ok: false, error: "Webchat site not found (key/siteId)" }, { status: 404 });
    }

    // 2) Leer sesión del usuario (NextAuth v5)
    const session = await getServerSession();
    const email = session?.user?.email ?? null;

    // Si no hay sesión, devolvemos solo datos del site + flag allowPrivate=false
    if (!email) {
      return NextResponse.json({
        ok: true,
        allowPrivate: false,
        site: {
          id: site.id,
          name: site.name,
          companyId: site.companyId,
          settings: site.settings ?? {},
        },
        user: null,
        company: null,
        counts: null,
        billing: null,
        responseSettings: null,
        debug: { reason: "no_session" },
      });
    }

    // 3) Cargar user y comprobar pertenencia a la company del site
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    let allowPrivate = false;
    if (user) {
      const membership = await prisma.userCompany.findFirst({
        where: { userId: user.id, companyId: site.companyId },
        select: { id: true },
      });
      allowPrivate = Boolean(membership);
    }

    // 4) Si pertenece, cargamos “datos vivos” de la cuenta/empresa
    let companySummary: any = null;
    let counts: any = null;
    let billing: any = null;
    let responseSettings: any = null;

    if (allowPrivate) {
      const [company, locCount, respSet] = await Promise.all([
        prisma.company.findUnique({
          where: { id: site.companyId },
          select: {
            id: true,
            name: true,
            plan: true,
            stripeSubscriptionId: true,
          },
        }),
        prisma.location.count({ where: { companyId: site.companyId } }),
        prisma.responseSettings.findUnique({
          where: { companyId: site.companyId },
          select: { id: true, updatedAt: true },
        }),
      ]);

      companySummary = company;
      counts = { locations: locCount };
      billing = {
        hasStripe: Boolean(company?.stripeSubscriptionId),
      };
      responseSettings = {
        configured: Boolean(respSet),
        updatedAt: respSet?.updatedAt ?? null,
      };
    }

    // 5) Devolver TODO junto (para que el widget pueda saludar/configurar)
    return NextResponse.json({
      ok: true,
      allowPrivate,
      site: {
        id: site.id,
        name: site.name,
        companyId: site.companyId,
        settings: site.settings ?? {},
      },
      user: user
        ? { id: user.id, name: user.name, email: user.email }
        : null,
      company: companySummary,
      counts,
      billing,
      responseSettings,
      debug: { email },
    });
  } catch (e: any) {
    console.error("[webchat/bootstrap]", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
