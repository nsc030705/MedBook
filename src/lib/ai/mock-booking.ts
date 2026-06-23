// Mock booking state machine for demo mode (no OpenAI API key)
// Flow: ask doctor -> show schedules -> ask date -> confirm -> book

import { prisma } from "@/lib/prisma";

const DAY_VI: Record<string, string> = {
  MONDAY: "Thứ 2", TUESDAY: "Thứ 3", WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5", FRIDAY: "Thứ 6", SATURDAY: "Thứ 7", SUNDAY: "Chủ nhật",
};

interface MockBookingState {
  step: "pending_date" | "pending_confirm";
  doctorId: string;
  doctorName: string;
  specialty: string;
  hospital: string | null;
  scheduleId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  pendingDate: string; // YYYY-MM-DD, filled after user picks date
  reason: string;
}

// In-memory store keyed by userId (resets on server restart)
const mockBookingStates = new Map<string, MockBookingState>();

/** Parse "DD/MM/YYYY", "YYYY-MM-DD", or "ngày DD tháng MM" from user input */
function parseViDate(text: string): Date | null {
  // YYYY-MM-DD
  let m = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    if (!isNaN(d.getTime())) return d;
  }
  // DD/MM/YYYY or D/M/YYYY
  m = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
    if (!isNaN(d.getTime())) return d;
  }
  // "ngày 20 tháng 6" (assumes current or next year)
  m = text.match(/ng[aà]y\s*(\d{1,2})\s*th[aá]ng\s*(\d{1,2})/);
  if (m) {
    const now = new Date();
    let d = new Date(now.getFullYear(), parseInt(m[2]) - 1, parseInt(m[1]));
    if (d < now) d = new Date(now.getFullYear() + 1, parseInt(m[2]) - 1, parseInt(m[1]));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/** Returns the next occurrence of a given day-of-week as DD/MM/YYYY */
function getNextDayOfWeek(dayOfWeek: string): string {
  const dayMap: Record<string, number> = {
    SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
  };
  const target = dayMap[dayOfWeek] ?? 1;
  const today = new Date();
  const daysUntil = ((target + 7 - today.getDay()) % 7) || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + daysUntil);
  const d = String(next.getDate()).padStart(2, "0");
  const mo = String(next.getMonth() + 1).padStart(2, "0");
  const y = next.getFullYear();
  return `${d}/${mo}/${y}`;
}

/** Returns true only if keyword appears as a whole word in name (space-delimited, case-insensitive) */
function isWholeWordMatch(name: string, keyword: string): boolean {
  const words = name.toLowerCase().split(/\s+/);
  return words.some((w) => w === keyword.toLowerCase());
}

export async function getMockResponse(userMessage: string, userId?: string): Promise<string> {
  const msg = userMessage.toLowerCase().trim();

  if (!userId) {
    return "Xin chào! Tôi là **MedBot**\n\nVui lòng **đăng nhập** để sử dụng tính năng đặt lịch.";
  }

  const pendingState = mockBookingStates.get(userId);

  // ── Bước 2: đang chờ ngày ──────────────────────────────────────────────────
  if (pendingState?.step === "pending_date") {
    if (msg.includes("hủy") || msg.includes("thôi") || msg.includes("cancel")) {
      mockBookingStates.delete(userId);
      return "Đã hủy quá trình đặt lịch. Bạn cần hỗ trợ gì khác không?";
    }

    const date = parseViDate(userMessage);
    if (!date) {
      return (
        "Tôi chưa hiểu ngày bạn muốn khám.\n\n" +
        "Vui lòng nhập theo định dạng **DD/MM/YYYY**, ví dụ:\n" +
        "- `20/06/2025`\n" +
        "- `2025-06-20`\n" +
        "- `ngày 20 tháng 6`\n\n" +
        "Hoặc gõ **\"hủy\"** để bắt đầu lại."
      );
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (date < today) {
      return "Ngày **" + date.toLocaleDateString("vi-VN") + "** đã qua rồi. Vui lòng chọn ngày từ hôm nay trở đi.";
    }

    // Check day-of-week matches the schedule
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const chosenDay = dayNames[date.getDay()];
    const dateStr = date.toISOString().split("T")[0];
    const dateViStr = date.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" });

    if (chosenDay !== pendingState.dayOfWeek) {
      const neededDay = DAY_VI[pendingState.dayOfWeek];
      return (
        "Khung giờ bạn chọn (**" + pendingState.startTime + " - " + pendingState.endTime + "**) " +
        "chỉ có vào **" + neededDay + "**, nhưng ngày **" + dateViStr + "** là **" + (DAY_VI[chosenDay] || chosenDay) + "**.\n\n" +
        "Vui lòng chọn ngày là **" + neededDay + "** hoặc gõ **\"hủy\"** để bắt đầu lại.\n\n" +
        "Gợi ý: **" + getNextDayOfWeek(pendingState.dayOfWeek) + "**"
      );
    }

    mockBookingStates.set(userId, { ...pendingState, step: "pending_confirm", pendingDate: dateStr });

    return (
      "**Xác nhận thông tin đặt lịch:**\n\n" +
      "- Bác sĩ: **" + pendingState.doctorName + "** (" + pendingState.specialty + ")\n" +
      "- Bệnh viện: " + (pendingState.hospital || "Chưa có thông tin") + "\n" +
      "- Giờ khám: **" + pendingState.startTime + " - " + pendingState.endTime + "** (" + DAY_VI[pendingState.dayOfWeek] + ")\n" +
      "- Ngày khám: **" + dateViStr + "**\n" +
      "- Lý do: " + pendingState.reason + "\n\n" +
      "Gõ **\"xác nhận\"** để đặt lịch hoặc **\"hủy\"** để bắt đầu lại."
    );
  }

  // ── Bước 3: đang chờ xác nhận ─────────────────────────────────────────────
  if (pendingState?.step === "pending_confirm") {
    if (msg.includes("hủy") || msg.includes("thôi") || msg.includes("cancel") || msg === "không") {
      mockBookingStates.delete(userId);
      return "Đã hủy. Bạn cần hỗ trợ gì khác không?";
    }

    if (
      msg.includes("xác nhận") || msg.includes("đồng ý") ||
      msg === "ok" || msg === "được" || msg.includes("có") ||
      msg.includes("đặt")
    ) {
      try {
        const patient = await prisma.user.findUnique({ where: { id: userId } });
        if (!patient) {
          mockBookingStates.delete(userId);
          return "**Phiên đăng nhập đã hết hạn.** Vui lòng **đăng xuất và đăng nhập lại**.";
        }

        const appointmentDate = new Date(pendingState.pendingDate);

        const existing = await prisma.appointment.findFirst({
          where: {
            doctorId: pendingState.doctorId,
            scheduleId: pendingState.scheduleId,
            date: appointmentDate,
            status: { in: ["PENDING", "CONFIRMED"] },
          },
        });
        if (existing) {
          mockBookingStates.delete(userId);
          return "**Khung giờ này đã có người đặt rồi!**\n\nVui lòng thử lại với ngày khác hoặc chọn bác sĩ khác.";
        }

        await prisma.appointment.create({
          data: {
            patientId: userId,
            doctorId: pendingState.doctorId,
            scheduleId: pendingState.scheduleId,
            date: appointmentDate,
            reason: pendingState.reason,
            status: "PENDING",
          },
        });

        mockBookingStates.delete(userId);
        const dateViStr = appointmentDate.toLocaleDateString("vi-VN", {
          weekday: "long", day: "numeric", month: "numeric", year: "numeric",
        });

        return (
          "🎉 **[DEMO] ĐẶT LỊCH THÀNH CÔNG!**\n\n" +
          `- 🏥 Bác sĩ: **${pendingState.doctorName}** (${pendingState.specialty})\n` +
          `- 🏨 Bệnh viện: ${pendingState.hospital || "Chưa có thông tin"}\n` +
          `- 🕐 Giờ khám: **${pendingState.startTime} - ${pendingState.endTime}** (${DAY_VI[pendingState.dayOfWeek]})\n` +
          `- 📅 Ngày khám: **${dateViStr}**\n` +
          `- 📌 Trạng thái: **Chờ xác nhận từ bác sĩ**\n\n` +
          "Bạn có thể vào trang **\"Lịch Hẹn\"** để theo dõi nhé! 🗓️"
        );
      } catch (err: any) {
        mockBookingStates.delete(userId);
        return "Loi khi tao lich hen: **" + err.message + "**";
      }
    }

    return "Vui lòng gõ **\"xác nhận\"** để hoàn tất đặt lịch hoặc **\"hủy\"** để bắt đầu lại.";
  }

  // ── Bước 1: bắt đầu đặt lịch ──────────────────────────────────────────────
  if (msg.includes("đặt lịch") || msg.includes("book") || msg.includes("đăng ký khám")) {
    const doctorKeywords: Record<string, string> = {
      "hùng": "Hùng", "mai": "Mai", "đức": "Đức", "lan": "Lan",
      "nam": "Nam", "dũng": "Dũng", "an": "An", "tuấn": "Tuấn", "giang": "Giang",
    };

    let doctorKeyword = "";
    for (const [key, val] of Object.entries(doctorKeywords)) {
      if (msg.includes(key)) { doctorKeyword = val; break; }
    }

    if (!doctorKeyword) {
      return (
        "**Đặt lịch khám**\n\n" +
        "Vui lòng cho biết tên bác sĩ bạn muốn khám:\n\n" +
        "- *\"Đặt lịch bác sĩ Dũng\"*\n" +
        "- *\"Đặt lịch bác sĩ Hùng\"*\n" +
        "- *\"Đặt lịch bác sĩ An\"*\n" +
        "- *\"Đặt lịch bác sĩ Đức\"*\n\n" +
        "Hoặc hỏi *\"Bác sĩ Tim mạch còn lịch không?\"* để xem danh sách."
      );
    }

    try {
      const patient = await prisma.user.findUnique({ where: { id: userId } });
      if (!patient) {
        return "**Phiên đăng nhập đã hết hạn.** Vui lòng **đăng xuất và đăng nhập lại**.";
      }

      // findFirst with contains may return false positives (e.g. "An" matches "Lan")
      // Fetch a small batch and find the first whose name is a true whole-word match
      const candidates = await prisma.doctor.findMany({
        where: { user: { name: { contains: doctorKeyword, mode: "insensitive" } } },
        include: {
          user: { select: { name: true } },
          schedules: {
            where: { isAvailable: true },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          },
        },
        take: 10,
      });

      // Prefer exact whole-word match first, fall back to any match
      const doctor =
        candidates.find((d) => isWholeWordMatch(d.user.name || "", doctorKeyword)) ??
        candidates[0] ?? null;

      if (!doctor) {
        return (
          "Không tìm thấy bác sĩ **\"" + doctorKeyword + "\"**.\n\n" +
          "Thử: *\"Đặt lịch bác sĩ Dũng\"*, *\"Đặt lịch bác sĩ Hùng\"*, *\"Đặt lịch bác sĩ An\"*"
        );
      }

      if (doctor.schedules.length === 0) {
        return "Bác sĩ **" + doctor.user.name + "** hiện không có lịch rảnh.";
      }

      // Show available slots — use first slot as default in demo
      const schedule = doctor.schedules[0];
      const slotsText = doctor.schedules
        .map((s, i) => "  " + (i + 1) + ". **" + DAY_VI[s.dayOfWeek] + "** - " + s.startTime + " – " + s.endTime)
        .join("\n");

      const reasonMatch = msg.match(/(?:vì|do|lý do|triệu chứng|bị)[:\s]+(.+)/);
      const reason = reasonMatch ? reasonMatch[1].trim() : "Đặt lịch qua MedBot";

      mockBookingStates.set(userId, {
        step: "pending_date",
        doctorId: doctor.id,
        doctorName: doctor.user.name || "Bác sĩ",
        specialty: doctor.specialty,
        hospital: doctor.hospital,
        scheduleId: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        pendingDate: "",
        reason,
      });

      return (
        "**Bác sĩ " + (doctor.user.name || "Bác sĩ") + "** (" + doctor.specialty + " - " + (doctor.hospital || "") + ")\n" +
        "Phí khám: **" + doctor.fee.toLocaleString("vi-VN") + "đ**\n\n" +
        "**Khung giờ khám:**\n" + slotsText + "\n\n" +
        "Bạn muốn khám khung giờ nào? (Mặc định: **" + DAY_VI[schedule.dayOfWeek] + ", " + schedule.startTime + " - " + schedule.endTime + "**)\n\n" +
        "**Bạn muốn khám vào ngày nào?**\n" +
        "Nhập ngày theo định dạng **DD/MM/YYYY**, ví dụ: `" + getNextDayOfWeek(schedule.dayOfWeek) + "`\n\n" +
        "Gõ **\"hủy\"** để bắt đầu lại."
      );
    } catch (err: any) {
      return "Lỗi: **" + err.message + "**";
    }
  }

  if (msg.includes("lịch") || msg.includes("rảnh") || msg.includes("khám") || msg.includes("bác sĩ")) {
    return (
      "Một số bác sĩ có lịch rảnh trong hệ thống:\n\n" +
      "**PGS.TS Nguyễn Trung Dũng** (Tiêu hóa - BV Đại học Y Hà Nội)\n" +
      "  - Thứ 2 & Thứ 3 - *\"Đặt lịch bác sĩ Dũng\"*\n\n" +
      "**TS.BS Lê Thị Hoài An** (Da liễu - BV Đại học Y Hà Nội)\n" +
      "  - Thứ 4 & Thứ 5 - *\"Đặt lịch bác sĩ An\"*\n\n" +
      "**TS.BS Nguyễn Văn Hùng** (Tim mạch - BV Đại học Y Dược TP.HCM)\n" +
      "  - Thứ 2 & Thứ 4 - *\"Đặt lịch bác sĩ Hùng\"*\n\n" +
      "**BS.CKI Lê Minh Đức** (Thần kinh - BV Chợ Rẫy)\n" +
      "  - Thứ 3 & Thứ 5 - *\"Đặt lịch bác sĩ Đức\"*\n\n" +
      "Gõ *\"Đặt lịch bác sĩ [Tên]\"* để bắt đầu!"
    );
  }

  if (msg.includes("đau đầu") || msg.includes("đau")) {
    return (
      "Đau đầu có nhiều nguyên nhân:\n" +
      "- **Căng thẳng/stress** - đau quanh đầu\n" +
      "- **Migraine** - đau nửa đầu kèm buồn nôn\n" +
      "- **Tăng huyết áp** - đau sau gáy, chóng mặt\n\n" +
      "Gặp bác sĩ ngay nếu đau dữ dội đột ngột, kèm sốt hoặc yếu liệt.\n\n" +
      "Bạn muốn đặt lịch **Bác sĩ Thần kinh** hoặc **Nội khoa** không?"
    );
  }

  return (
    "Xin chào! Tôi là **MedBot**\n\n" +
    "Tôi có thể giúp bạn:\n" +
    "- **Kiểm tra lịch rảnh** bác sĩ (*\"Bác sĩ Da liễu còn lịch không?\"*)\n" +
    "- **Đặt lịch khám** trực tiếp (*\"Đặt lịch bác sĩ Dũng\"*)\n" +
    "- **Tư vấn sức khỏe** và chọn đúng chuyên khoa\n\n" +
    "Bạn cần hỗ trợ gì hôm nay?"
  );
}
