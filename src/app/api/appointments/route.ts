import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendAppointmentConfirmation,
  sendDoctorNewAppointment,
} from "@/lib/email";

// GET /api/appointments — Lấy danh sách lịch hẹn
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctor: { select: { id: true } } },
  });

  let appointments;

  if (user?.role === "DOCTOR" && user.doctor) {
    // Doctor sees their appointments
    appointments = await prisma.appointment.findMany({
      where: {
        doctorId: user.doctor.id,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        patient: { select: { name: true, email: true, image: true } },
        doctor: {
          include: { user: { select: { name: true } } },
        },
        schedule: true,
      },
      orderBy: { date: "asc" },
    });
  } else {
    // Patient sees their appointments
    appointments = await prisma.appointment.findMany({
      where: {
        patientId: session.user.id,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        patient: { select: { name: true, email: true, image: true } },
        doctor: {
          include: { user: { select: { name: true, image: true } } },
        },
        schedule: true,
      },
      orderBy: { date: "asc" },
    });
  }

  return NextResponse.json(appointments);
}

// POST /api/appointments — Tạo lịch hẹn mới
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { doctorId, scheduleId, date, reason } = body;

  if (!doctorId || !date) {
    return NextResponse.json(
      { error: "doctorId and date are required" },
      { status: 400 }
    );
  }

  // Check doctor exists
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  // Check if slot is already taken
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
      patientId: session.user.id,
      doctorId,
      scheduleId: scheduleId || null,
      date: new Date(date),
      reason: reason || null,
      status: "PENDING",
    },
    include: {
      doctor: { include: { user: { select: { name: true, email: true } } } },
      patient: { select: { name: true, email: true } },
    },
  });

  // Send emails (non-blocking)
  Promise.all([
    sendAppointmentConfirmation({
      patientEmail: appointment.patient.email!,
      patientName: appointment.patient.name || "Bệnh nhân",
      doctorName: appointment.doctor.user.name || "Bác sĩ",
      specialty: appointment.doctor.specialty,
      hospital: appointment.doctor.hospital || "Bệnh viện",
      date: appointment.date,
      appointmentId: appointment.id,
    }),
    sendDoctorNewAppointment({
      doctorEmail: appointment.doctor.user.email!,
      doctorName: appointment.doctor.user.name || "Bác sĩ",
      patientName: appointment.patient.name || "Bệnh nhân",
      patientEmail: appointment.patient.email!,
      date: appointment.date,
      reason: appointment.reason || undefined,
    }),
  ]).catch((err) => console.error("[Email] Error sending appointment emails:", err));

  return NextResponse.json(appointment, { status: 201 });
}
