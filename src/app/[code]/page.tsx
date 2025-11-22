import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function CodeRedirectPage({ params }: PageProps) {
  const { code } = await params;

  if (!code) {
    notFound();
  }

  const link = await prisma.linkGenerator.findUnique({
    where: { code },
  });

  if (!link) {
    notFound();
  }

  await prisma.linkGenerator.update({
    where: { id: link.id },
    data: {
      clicks: link.clicks + 1,
      lastAccessedAt: new Date(),
    },
  });

  redirect(link.originalUrl);
}
