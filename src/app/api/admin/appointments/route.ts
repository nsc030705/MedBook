import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") return null;
  return user;
}

// GET /api/admin/appointments — Toàn bộ lịch hẹn (admin)
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { patient: { name: { contains: search, mode: "insensitive" } } },
      { patient: { email: { contains: search, mode: "insensitive" } } },
      { doctor: { user: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, email: true, image: true } },
        doctor: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        schedule: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  return NextResponse.json({ appointments, total, page, totalPages: Math.ceil(total / limit) });
}

// POST /api/admin/appointments — Admin tạo lịch hẹn mới
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { patientId, doctorId, scheduleId, date, reason, notes } = body;

  if (!patientId || !doctorId || !date) {
    return NextResponse.json(
      { error: "patientId, doctorId và date là bắt buộc" },
      { status: 400 }
    );
  }

  // Validate patient & doctor exist
  const [patient, doctor] = await Promise.all([
    prisma.user.findUnique({ where: { id: patientId } }),
    prisma.doctor.findUnique({ where: { id: doctorId } }),
  ]);

  if (!patient) return NextResponse.json({ error: "Bệnh nhân không tồn tại" }, { status: 404 });
  if (!doctor) return NextResponse.json({ error: "Bác sĩ không tồn tại" }, { status: 404 });

  // Check slot conflict
  if (scheduleId) {
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        scheduleId,
        date: new Date(date),
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Slot đã được đặt. Vui lòng chọn giờ khác." },
        { status: 409 }
      );
    }
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      scheduleId: scheduleId || null,
      date: new Date(date),
      reason: reason || null,
      notes: notes || null,
      status: "PENDING",
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
      schedule: true,
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
