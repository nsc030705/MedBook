import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/doctors — Lấy danh sách bác sĩ với filter
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const specialty = searchParams.get("specialty");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const where: any = {};

  if (specialty && specialty !== "all") {
    where.specialty = { contains: specialty, mode: "insensitive" };
  }

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { specialty: { contains: search, mode: "insensitive" } },
      { hospital: { contains: search, mode: "insensitive" } },
    ];
  }

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: {
        user: { select: { name: true, image: true } },
        schedules: {
          where: { isAvailable: true },
          select: { dayOfWeek: true, startTime: true, endTime: true },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
      orderBy: { rating: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.doctor.count({ where }),
  ]);

  return NextResponse.json({
    doctors,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
