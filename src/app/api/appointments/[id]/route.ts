import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAppointmentResult } from "@/lib/email";

// PATCH /api/appointments/[id] — Cập nhật trạng thái lịch hẹn
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      doctor: { include: { user: true } },
      patient: true,
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Authorization check
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctor: true },
  });

  const isPatient = appointment.patientId === session.user.id;
  const isDoctor = user?.doctor?.id === appointment.doctorId;
  const isAdmin = user?.role === "ADMIN";

  if (!isPatient && !isDoctor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Patients can only CANCEL
  if (isPatient && !isAdmin && status !== "CANCELLED") {
    return NextResponse.json(
      { error: "Bệnh nhân chỉ có thể hủy lịch hẹn" },
      { status: 403 }
    );
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status,
      notes: notes || appointment.notes,
    },
  });

  // Send result email to patient when doctor confirms/rejects
  if (
    (isDoctor || isAdmin) &&
    (status === "CONFIRMED" || status === "CANCELLED") &&
    appointment.patient.email
  ) {
    sendAppointmentResult({
      patientEmail: appointment.patient.email,
      patientName: appointment.patient.name || "Bệnh nhân",
      doctorName: appointment.doctor.user.name || "Bác sĩ",
      date: appointment.date,
      status: status as "CONFIRMED" | "CANCELLED",
      notes: notes || undefined,
    }).catch((err) => console.error("[Email] Result email error:", err));
  }

  return NextResponse.json(updated);
}

// DELETE /api/appointments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment || appointment.patientId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
