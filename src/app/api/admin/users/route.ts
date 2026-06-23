import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users — Danh sách người dùng
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role"); // "PATIENT" | "DOCTOR" | "ADMIN" | null
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        image: true,
        doctor: { select: { id: true, specialty: true, isVerified: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
}

// PATCH /api/admin/users — Khóa / mở khóa tài khoản
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { userId, isActive } = body;

  if (!userId || isActive === undefined) {
    return NextResponse.json({ error: "userId and isActive are required" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, name: true, email: true, isActive: true, role: true },
  });

  return NextResponse.json(user);
}
