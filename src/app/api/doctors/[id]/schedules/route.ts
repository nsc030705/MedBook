import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/doctors/[id]/schedules
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const schedules = await prisma.schedule.findMany({
    where: { doctorId: id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(schedules);
}

// POST /api/doctors/[id]/schedules — Thêm khung giờ mới
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: doctorId } = await params;

  // Check ownership (doctor must own this profile or admin)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctor: true },
  });

  const isOwner = user?.doctor?.id === doctorId;
  const isAdmin = user?.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { dayOfWeek, startTime, endTime, maxSlots } = body;

  if (!dayOfWeek || !startTime || !endTime) {
    return NextResponse.json(
      { error: "dayOfWeek, startTime, endTime are required" },
      { status: 400 }
    );
  }

  // Check duplicate
  const existing = await prisma.schedule.findFirst({
    where: { doctorId, dayOfWeek, startTime, endTime },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Khung giờ này đã tồn tại" },
      { status: 409 }
    );
  }

  const schedule = await prisma.schedule.create({
    data: {
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable: true,
      maxSlots: maxSlots || 1,
    },
  });

  return NextResponse.json(schedule, { status: 201 });
}

// DELETE /api/doctors/[id]/schedules?scheduleId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: doctorId } = await params;
  const { searchParams } = new URL(request.url);
  const scheduleId = searchParams.get("scheduleId");

  if (!scheduleId) {
    return NextResponse.json({ error: "scheduleId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctor: true },
  });

  const isOwner = user?.doctor?.id === doctorId;
  const isAdmin = user?.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.schedule.delete({ where: { id: scheduleId } });

  return NextResponse.json({ success: true });
}
