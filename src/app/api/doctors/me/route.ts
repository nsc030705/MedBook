import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/doctors/me — Lấy profile bác sĩ đang đăng nhập
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { name: true, email: true, image: true } },
      schedules: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
    },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
  }

  return NextResponse.json(doctor);
}

// PUT /api/doctors/me — Bác sĩ cập nhật profile của mình
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "DOCTOR") {
    return NextResponse.json({ error: "Forbidden: Doctor only" }, { status: 403 });
  }

  const body = await request.json();
  const { specialty, bio, hospital, experience, fee, avatarUrl, name } = body;

  // Update both Doctor profile and User name in parallel
  const [doctor] = await Promise.all([
    prisma.doctor.upsert({
      where: { userId: session.user.id },
      update: {
        ...(specialty !== undefined && { specialty }),
        ...(bio !== undefined && { bio }),
        ...(hospital !== undefined && { hospital }),
        ...(experience !== undefined && { experience: parseInt(experience) }),
        ...(fee !== undefined && { fee: parseInt(fee) }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      create: {
        userId: session.user.id,
        specialty: specialty || "Chưa cập nhật",
        bio,
        hospital,
        experience: parseInt(experience) || 0,
        fee: parseInt(fee) || 200000,
        avatarUrl,
      },
      include: { user: { select: { name: true, email: true } }, schedules: true },
    }),
    name
      ? prisma.user.update({
          where: { id: session.user.id },
          data: { name },
        })
      : Promise.resolve(null),
  ]);

  return NextResponse.json(doctor);
}
