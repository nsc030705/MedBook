import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { chatWithAI } from "@/lib/ai/bot";
import { prisma } from "@/lib/prisma";

// POST /api/chat — AI Chatbot endpoint, lưu lịch sử vào DB
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messages, message, sessionId } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Kiểm tra user có tồn tại trong DB không (JWT có thể còn hiệu lực sau khi DB reset)
    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!dbUser) {
      return NextResponse.json(
        { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại." },
        { status: 401 }
      );
    }

    // Lấy hoặc tạo ChatSession
    let chatSession;
    if (sessionId) {
      chatSession = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId: session.user.id },
      });
    }

    if (!chatSession) {
      // Tạo session mới, dùng 30 ký tự đầu của tin nhắn làm tiêu đề
      const title = message.length > 40 ? message.substring(0, 40) + "..." : message;
      chatSession = await prisma.chatSession.create({
        data: {
          userId: session.user.id,
          title,
        },
      });
    }

    // Lưu tin nhắn của user vào DB
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "user",
        content: message,
      },
    });

    // Gọi AI
    const response = await chatWithAI(messages || [], message, session.user.id);

    // Lưu phản hồi của AI vào DB
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: response,
      },
    });

    // Cập nhật updatedAt của session
    await prisma.chatSession.update({
      where: { id: chatSession.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ response, sessionId: chatSession.id });
  } catch (err: any) {
    console.error("[/api/chat POST] Error:", err?.message ?? err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}

// GET /api/chat — Lấy danh sách các phiên trò chuyện của user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: {
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(sessions);
}
