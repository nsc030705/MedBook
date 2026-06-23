import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/doctors — Danh sách tất cả bác sĩ (kể cả chưa verify)
export async function GET(request: NextRequest) {
  // Note: middleware already enforces ADMIN role
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const verified = searchParams.get("verified"); // "true" | "false" | null

  const where: any = {};
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { specialty: { contains: search, mode: "insensitive" } },
      { hospital: { contains: search, mode: "insensitive" } },
    ];
  }
  if (verified === "true") where.isVerified = true;
  if (verified === "false") where.isVerified = false;

  const doctors = await prisma.doctor.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, image: true, isActive: true, createdAt: true } },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(doctors);
}

// PATCH /api/admin/doctors — Phê duyệt / vô hiệu hóa bác sĩ
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { doctorId, action } = body;
  // action: "verify" | "unverify"

  if (!doctorId || !action) {
    return NextResponse.json({ error: "doctorId and action are required" }, { status: 400 });
  }

  const doctor = await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      isVerified: action === "verify",
    },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(doctor);
}
