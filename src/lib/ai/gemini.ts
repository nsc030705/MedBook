// AI Chatbot — Groq integration với Function Calling + Simple RAG
// Sử dụng mô hình Llama 3 qua Groq API miễn phí

import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { MEDICAL_DOCS } from "@/data/medical-docs";
import { getMockResponse } from "@/lib/ai/mock-booking";

// ===================== Confirmation Pending State =====================

interface PendingBooking {
  doctor_id: string;
  schedule_id: string;
  date: string;
  reason?: string;
  // Resolved display info
  doctorName: string;
  specialty: string;
  hospital: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
}

// In-memory store for pending booking confirmations (keyed by userId)
const pendingBookings = new Map<string, PendingBooking>();

const DAY_VI_GEMINI: Record<string, string> = {
  MONDAY: "Thứ 2", TUESDAY: "Thứ 3", WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5", FRIDAY: "Thứ 6", SATURDAY: "Thứ 7", SUNDAY: "Chủ nhật",
};

/** Build a Vietnamese confirmation message for a pending booking */
function buildConfirmMessage(p: PendingBooking): string {
  const dateObj = new Date(p.date);
  const dateViStr = dateObj.toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "numeric", year: "numeric",
  });
  return (
    "📋 **Xác nhận thông tin đặt lịch:**\n\n" +
    `- 🏥 Bác sĩ: **${p.doctorName}** (${p.specialty})\n` +
    `- 🏨 Bệnh viện: ${p.hospital || "Chưa có thông tin"}\n` +
    `- 🕐 Giờ khám: **${p.startTime} - ${p.endTime}** (${DAY_VI_GEMINI[p.dayOfWeek] || p.dayOfWeek})\n` +
    `- 📅 Ngày khám: **${dateViStr}**\n` +
    (p.reason ? `- 📝 Lý do: ${p.reason}\n` : "") +
    "\nGõ **\"xác nhận\"** để đặt lịch hoặc **\"hủy\"** để bắt đầu lại."
  );
}

/** Check if user message is a confirmation or cancellation */
function isConfirmation(msg: string): boolean {
  const m = msg.toLowerCase().trim();
  return (
    m.includes("xác nhận") || m.includes("đồng ý") ||
    m === "ok" || m === "được" || m === "yes" ||
    m.includes("đặt") || m.includes("confirm")
  );
}

function isCancellation(msg: string): boolean {
  const m = msg.toLowerCase().trim();
  return (
    m.includes("hủy") || m.includes("thôi") || m === "không" ||
    m === "no" || m.includes("cancel")
  );
}

// Lazy initialization — tránh lỗi khi build nếu chưa có API key
let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "placeholder" });
  }
  return _groq;
}

// ===================== RAG — Simple keyword-based retrieval =====================

function retrieveRelevantDocs(query: string, topK: number = 3): string {
  const queryLower = query.toLowerCase();

  const scored = MEDICAL_DOCS.map((doc) => {
    const text = (doc.title + " " + doc.content).toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);
    const score = queryWords.reduce((acc, word) => {
      return acc + (text.includes(word) ? 1 : 0);
    }, 0);
    return { doc, score };
  });

  const relevant = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.doc);

  if (relevant.length === 0) return "";

  return (
    "\n\n--- Thông tin y tế liên quan ---\n" +
    relevant
      .map((doc) => `**${doc.title}**\n${doc.content}`)
      .join("\n\n---\n")
  );
}

// ===================== Tool Implementations =====================

async function checkDoctorSchedule(args: {
  doctor_name?: string;
  specialty?: string;
  day_of_week?: string;
}): Promise<string> {
  const { doctor_name, specialty, day_of_week } = args;

  const dayMap: Record<string, string> = {
    "thứ 2": "MONDAY", "thứ hai": "MONDAY", "monday": "MONDAY",
    "thứ 3": "TUESDAY", "thứ ba": "TUESDAY", "tuesday": "TUESDAY",
    "thứ 4": "WEDNESDAY", "thứ tư": "WEDNESDAY", "wednesday": "WEDNESDAY",
    "thứ 5": "THURSDAY", "thứ năm": "THURSDAY", "thursday": "THURSDAY",
    "thứ 6": "FRIDAY", "thứ sáu": "FRIDAY", "friday": "FRIDAY",
    "thứ 7": "SATURDAY", "thứ bảy": "SATURDAY", "saturday": "SATURDAY",
    "chủ nhật": "SUNDAY", "sunday": "SUNDAY",
  };

  const dayOfWeekKey = day_of_week
    ? dayMap[day_of_week.toLowerCase()] || undefined
    : undefined;

  const allDoctors = await prisma.doctor.findMany({
    where: {
      ...(specialty && { specialty: { contains: specialty, mode: "insensitive" } }),
      ...(doctor_name && { user: { name: { contains: doctor_name, mode: "insensitive" } } }),
    },
    include: {
      user: { select: { name: true } },
      schedules: {
        where: {
          isAvailable: true,
          ...(dayOfWeekKey && { dayOfWeek: dayOfWeekKey as any }),
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
    take: 10,
  });

  // Filter: prefer whole-word name matches to avoid "An" matching "Lan"
  let doctors = allDoctors;
  if (doctor_name) {
    const kw = doctor_name.toLowerCase();
    const wholeWord = allDoctors.filter((d) =>
      (d.user.name || "").toLowerCase().split(/\s+/).some((w) => w === kw)
    );
    if (wholeWord.length > 0) doctors = wholeWord.slice(0, 3);
    else doctors = allDoctors.slice(0, 3);
  } else {
    doctors = allDoctors.slice(0, 3);
  }

  if (doctors.length === 0) {
    return "Không tìm thấy bác sĩ phù hợp. Vui lòng thử với tên hoặc chuyên khoa khác.";
  }

  const dayVi: Record<string, string> = {
    MONDAY: "Thứ 2", TUESDAY: "Thứ 3", WEDNESDAY: "Thứ 4",
    THURSDAY: "Thứ 5", FRIDAY: "Thứ 6", SATURDAY: "Thứ 7", SUNDAY: "Chủ nhật",
  };

  return doctors
    .map((doc) => {
      const name = doc.user.name;
      const slots =
        doc.schedules.length === 0
          ? "Hiện không có lịch rảnh"
          : doc.schedules
              .map((s) => `  • Khung giờ ID: \`${s.id}\` | ${dayVi[s.dayOfWeek]} (${s.startTime} – ${s.endTime})`)
              .join("\n");
      return `**${name}** (Mã bác sĩ: \`${doc.id}\`) [${doc.specialty} – ${doc.hospital}]\n${slots}\nPhí khám: ${doc.fee.toLocaleString("vi-VN")}đ`;
    })
    .join("\n\n");
}

async function getDoctorList(args: { specialty?: string }): Promise<string> {
  const doctors = await prisma.doctor.findMany({
    where: args.specialty
      ? { specialty: { contains: args.specialty, mode: "insensitive" } }
      : {},
    include: { user: { select: { name: true } } },
    orderBy: { rating: "desc" },
    take: 6,
  });

  if (doctors.length === 0) {
    return "Không tìm thấy bác sĩ chuyên khoa " + (args.specialty || "");
  }

  return doctors
    .map((d) => `• **${d.user.name}** — Mã: \`${d.id}\` — ${d.specialty} — ⭐ ${d.rating} — ${d.fee.toLocaleString("vi-VN")}đ — ${d.hospital}`)
    .join("\n");
}

/**
 * Stage 1 — intercepted by the agentic loop: save pending state, return confirm prompt.
 * Stage 2 — executePendingBooking: called after user confirms.
 */
async function preparePendingBooking(args: {
  userId: string;
  doctor_id: string;
  schedule_id: string;
  date: string;
  reason?: string;
}): Promise<string> {
  const { userId, doctor_id, schedule_id, date, reason } = args;
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctor_id },
      include: { user: { select: { name: true } } },
    });
    if (!doctor) return "Lỗi: Không tìm thấy bác sĩ có mã ID này.";

    const schedule = await prisma.schedule.findUnique({ where: { id: schedule_id } });
    if (!schedule) return "Lỗi: Không tìm thấy khung giờ có mã ID này.";

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return "Lỗi: Định dạng ngày không hợp lệ. Dùng định dạng YYYY-MM-DD.";
    }

    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor_id,
        scheduleId: schedule_id,
        date: appointmentDate,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (existing) return "Khung giờ này đã có người đặt. Vui lòng chọn ngày hoặc giờ khác!";

    // Save pending state
    const pending: PendingBooking = {
      doctor_id,
      schedule_id,
      date,
      reason,
      doctorName: doctor.user.name || "Bác sĩ",
      specialty: doctor.specialty,
      hospital: doctor.hospital || "",
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      dayOfWeek: schedule.dayOfWeek,
    };
    pendingBookings.set(userId, pending);

    // Return confirmation prompt (NOT yet booked)
    return buildConfirmMessage(pending);
  } catch (error: any) {
    console.error("preparePendingBooking error:", error);
    return `Lỗi khi chuẩn bị đặt lịch: ${error.message}`;
  }
}

async function executePendingBooking(userId: string): Promise<string> {
  const pending = pendingBookings.get(userId);
  if (!pending) return "Không tìm thấy thông tin đặt lịch đang chờ. Vui lòng thử lại từ đầu.";

  try {
    const appointmentDate = new Date(pending.date);

    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId: pending.doctor_id,
        scheduleId: pending.schedule_id,
        date: appointmentDate,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (existing) {
      pendingBookings.delete(userId);
      return "⚠️ Khung giờ này vừa có người đặt rồi! Vui lòng chọn ngày hoặc giờ khác.";
    }

    await prisma.appointment.create({
      data: {
        patientId: userId,
        doctorId: pending.doctor_id,
        scheduleId: pending.schedule_id,
        date: appointmentDate,
        reason: pending.reason || "Đặt lịch qua AI Chatbot",
        status: "PENDING",
      },
    });

    pendingBookings.delete(userId);

    const dateViStr = appointmentDate.toLocaleDateString("vi-VN", {
      weekday: "long", day: "numeric", month: "numeric", year: "numeric",
    });

    return (
      "🎉 **ĐẶT LỊCH THÀNH CÔNG!**\n\n" +
      `- 🏥 Bác sĩ: **${pending.doctorName}** (${pending.specialty})\n` +
      `- 🏨 Bệnh viện: ${pending.hospital || "Chưa có thông tin"}\n` +
      `- 🕐 Giờ khám: **${pending.startTime} - ${pending.endTime}** (${DAY_VI_GEMINI[pending.dayOfWeek] || pending.dayOfWeek})\n` +
      `- 📅 Ngày khám: **${dateViStr}**\n` +
      `- 📌 Trạng thái: **Chờ xác nhận từ bác sĩ**\n\n` +
      "Bạn có thể vào trang **\"Lịch Hẹn\"** để theo dõi nhé! 🗓️"
    );
  } catch (error: any) {
    pendingBookings.delete(userId);
    console.error("executePendingBooking error:", error);
    return `Lỗi khi đặt lịch: ${error.message}`;
  }
}

// ===================== OpenAI Tool Definitions =====================

const TOOLS_OPENAI: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "check_doctor_schedule",
      description: "Kiểm tra lịch rảnh của bác sĩ. Dùng khi người dùng hỏi về lịch khám của bác sĩ cụ thể hoặc theo chuyên khoa.",
      parameters: {
        type: "object",
        properties: {
          doctor_name: { type: "string", description: "Tên bác sĩ (một phần hoặc đầy đủ)" },
          specialty: { type: "string", description: "Chuyên khoa (ví dụ: Tim mạch, Nội khoa, Da liễu, Tiêu hóa...)" },
          day_of_week: { type: "string", description: "Ngày trong tuần (thứ 2, thứ 3, thứ 4, thứ 5, thứ 6, thứ 7, chủ nhật)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_doctor_list",
      description: "Lấy danh sách bác sĩ theo chuyên khoa với rating và phí khám.",
      parameters: {
        type: "object",
        properties: {
          specialty: { type: "string", description: "Chuyên khoa cần tìm" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Đặt lịch hẹn khám bệnh trực tiếp. Cần mã bác sĩ (doctor_id), mã lịch rảnh (schedule_id) và ngày hẹn (date dạng YYYY-MM-DD). Hỏi bệnh nhân để xác nhận trước khi đặt.",
      parameters: {
        type: "object",
        properties: {
          doctor_id: { type: "string", description: "Mã ID bác sĩ từ check_doctor_schedule hoặc get_doctor_list" },
          schedule_id: { type: "string", description: "Mã ID khung giờ rảnh từ check_doctor_schedule" },
          date: { type: "string", description: "Ngày khám dạng YYYY-MM-DD (tính ngày dương lịch tương ứng với thứ trong tuần gần nhất)" },
          reason: { type: "string", description: "Lý do khám hoặc triệu chứng của bệnh nhân" },
        },
        required: ["doctor_id", "schedule_id", "date"],
      },
    },
  },
];

// ===================== Main Chat Function =====================

const getSystemPrompt = () => {
  const todayStr = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  return `Bạn là MedBot, trợ lý AI của hệ thống đặt lịch y tế MedBook. Hôm nay là: ${todayStr}.

QUY TRÌNH ĐẶT LỊCH (bắt buộc theo đúng thứ tự):
1. Dùng check_doctor_schedule để tra lịch rảnh, hiển thị danh sách khung giờ rõ ràng (mã ID, thứ, giờ).
2. Hỏi bệnh nhân chọn khung giờ nào (schedule_id).
3. Hỏi ngày khám cụ thể — KHÔNG tự chọn ngày, phải hỏi bệnh nhân. Ví dụ: "Bạn muốn khám ngày mấy? Ví dụ: 20/06/2025".
4. Hỏi lý do khám nếu chưa biết.
5. Xác nhận lại thông tin: tên bác sĩ, ngày, giờ, lý do — rồi hỏi "Bạn xác nhận đặt lịch không?".
6. Khi bệnh nhân đồng ý mới gọi book_appointment với date dạng YYYY-MM-DD chính xác.

Nguyên tắc:
- KHÔNG bao giờ tự đặt lịch mà không có ngày cụ thể từ bệnh nhân.
- KHÔNG tự chọn ngày thay bệnh nhân — phải hỏi và chờ bệnh nhân trả lời.
- Luôn trả lời tiếng Việt, thân thiện và chuyên nghiệp.
- Sau khi đặt lịch thành công, thông báo đầy đủ: bác sĩ, ngày, giờ, trạng thái.
- Câu trả lời ngắn gọn, dễ hiểu, không quá 200 từ trừ khi cần thiết.
- Tư vấn sức khỏe cơ bản — KHÔNG chẩn đoán bệnh nặng, luôn khuyên gặp bác sĩ.`;
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Execute a single tool call
// book_appointment now saves pending state instead of booking directly
async function executeTool(name: string, args: Record<string, any>, userId?: string): Promise<string> {
  if (name === "check_doctor_schedule") return await checkDoctorSchedule(args);
  if (name === "get_doctor_list") return await getDoctorList(args);
  if (name === "book_appointment") return await preparePendingBooking({ userId: userId || "", ...args } as any);
  return "Tool không được hỗ trợ";
}

export async function chatWithAI(
  messages: ChatMessage[],
  userMessage: string,
  userId?: string
): Promise<string> {
  // ── Handle pending confirmation from previous book_appointment call ──────
  if (userId && pendingBookings.has(userId)) {
    if (isCancellation(userMessage)) {
      pendingBookings.delete(userId);
      return "Đã hủy đặt lịch. Bạn cần hỗ trợ gì khác không? 😊";
    }
    if (isConfirmation(userMessage)) {
      return await executePendingBooking(userId);
    }
    // Remind user that a booking is still pending
    const pending = pendingBookings.get(userId)!;
    return (
      "⏳ Bạn vẫn còn một lịch hẹn đang chờ xác nhận:\n\n" +
      buildConfirmMessage(pending) +
      "\n\nNếu bạn muốn hủy và hỏi câu khác, gõ **\"hủy\"**."
    );
  }

  // No API key — use built-in assistant (no AI, rule-based)
  if (!process.env.GROQ_API_KEY) {
    return getMockResponse(userMessage, userId);
  }

  try {
    const ragContext = retrieveRelevantDocs(userMessage);

    // Build Groq message array (tương thích hoàn toàn API OpenAI)
    const history: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: getSystemPrompt() },
      ...messages.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: userMessage + ragContext },
    ];

    let response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: history,
      tools: TOOLS_OPENAI as any, // Ép kiểu vì Groq type slightly differs but runtime is same
      tool_choice: "auto",
      max_tokens: 1000,
    });

    let message = response.choices[0].message;

    // Agentic loop — handle tool calls
    const MAX_ITERATIONS = 4;
    let iterations = 0;

    while (message.tool_calls && message.tool_calls.length > 0 && iterations < MAX_ITERATIONS) {
      // Add assistant message with tool calls
      history.push(message as Groq.Chat.Completions.ChatCompletionMessageParam);

      // Execute all tool calls in parallel
      const toolResults = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (message.tool_calls as any[]).map(async (tc) => {
          const args = JSON.parse(tc.function?.arguments || "{}");
          const result = await executeTool(tc.function?.name || "", args, userId);
          return {
            role: "tool" as const,
            tool_call_id: tc.id,
            content: result,
          };
        })
      );

      history.push(...toolResults);

      // Continue the conversation
      response = await getGroq().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: history,
        tools: TOOLS_OPENAI as any,
        tool_choice: "auto",
        max_tokens: 1000,
      });

      message = response.choices[0].message;
      iterations++;
    }

    return message.content || "Xin lỗi, tôi không thể xử lý yêu cầu này.";
  } catch (error: any) {
    console.error("Groq API error:", error?.message);
    // Phân tích lỗi để trả về thông báo rõ ràng hơn
    const msg = error?.message || "";
    if (msg.includes("401") || msg.includes("Incorrect API key") || msg.includes("invalid_api_key")) {
      return "⚠️ **API key không hợp lệ.** Vui lòng kiểm tra lại `GROQ_API_KEY` trong file `.env`.";
    }
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota")) {
      return "⏳ **Quá giới hạn request.** Vui lòng chờ vài giây rồi thử lại.";
    }
    if (msg.includes("timeout") || msg.includes("ECONNRESET") || msg.includes("ENOTFOUND")) {
      return "🌐 **Không thể kết nối máy chủ AI.** Kiểm tra kết nối mạng và thử lại.";
    }
    return "⚠️ **MedBot gặp lỗi.** Vui lòng thử lại sau vài giây.";
  }
}

// ===================== Built-in Assistant (không có API key) =====================
// Được import từ @/lib/ai/mock-booking — xem file đó để biết logic.
