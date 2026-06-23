import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "month"; // "week" | "month" | "year"

  const now = new Date();
  let startDate: Date;

  if (period === "week") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1);
  }

  const [
    totalUsers,
    totalDoctors,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    cancelledAppointments,
    completedAppointments,
    periodAppointments,
    topDoctors,
    recentAppointments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.doctor.count({ where: { isVerified: true } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({ where: { status: "CONFIRMED" } }),
    prisma.appointment.count({ where: { status: "CANCELLED" } }),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),

    // Appointments in period (grouped by day)
    prisma.appointment.groupBy({
      by: ["date"],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      orderBy: { date: "asc" },
    }),

    // Top 5 doctors by appointment count
    prisma.doctor.findMany({
      take: 5,
      include: {
        user: { select: { name: true, image: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { appointments: { _count: "desc" } },
    }),

    // Recent 10 appointments
    prisma.appointment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { name: true, email: true } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    }),
  ]);

  // Build daily chart data
  const dayMap = new Map<string, number>();
  periodAppointments.forEach((row) => {
    const key = new Date(row.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    dayMap.set(key, (dayMap.get(key) || 0) + row._count.id);
  });

  const chartData = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    overview: {
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      cancelledAppointments,
      completedAppointments,
      confirmRate: totalAppointments > 0
        ? Math.round((confirmedAppointments / totalAppointments) * 100)
        : 0,
      cancelRate: totalAppointments > 0
        ? Math.round((cancelledAppointments / totalAppointments) * 100)
        : 0,
    },
    chartData,
    topDoctors: topDoctors.map((d) => ({
      id: d.id,
      name: d.user.name,
      specialty: d.specialty,
      appointmentCount: d._count.appointments,
      rating: d.rating,
    })),
    recentAppointments: recentAppointments.map((a) => ({
      id: a.id,
      patientName: a.patient.name,
      doctorName: a.doctor.user.name,
      date: a.date,
      status: a.status,
      createdAt: a.createdAt,
    })),
  });
}
