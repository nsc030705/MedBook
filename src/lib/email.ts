/**
 * Email Service — Resend (with console fallback when no API key)
 *
 * Usage:
 *   await sendAppointmentConfirmation({ patientEmail, patientName, doctorName, date, specialty })
 *   await sendDoctorNewAppointment({ doctorEmail, doctorName, patientName, date, reason })
 *   await sendAppointmentResult({ patientEmail, patientName, doctorName, status, date })
 *   await sendAppointmentReminder({ patientEmail, patientName, doctorName, date })
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ── HTML email base template ─────────────────────────────────────────────────
function emailBase(content: string) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MedBook</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#0d1627;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:32px 40px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">+</div>
              <h1 style="margin:0;color:white;font-size:24px;font-weight:800;letter-spacing:-0.02em;">MedBook</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Hệ Thống Đặt Lịch Y Tế Thông Minh</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;">
                © 2025 MedBook · <a href="${APP_URL}" style="color:#0ea5e9;text-decoration:none;">medbook.vn</a>
                <br/>Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Send helper ───────────────────────────────────────────────────────────────
async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) {
    // Graceful fallback — log to console when no API key
    console.log(`\n[EMAIL LOG - No RESEND_API_KEY set]\nTo: ${opts.to}\nSubject: ${opts.subject}\n`);
    return { success: true, mock: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Email] Resend error:", err);
      return { success: false, error: err };
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (err) {
    console.error("[Email] Network error:", err);
    return { success: false, error: err };
  }
}

// ── 1. Bệnh nhân đặt lịch thành công ─────────────────────────────────────────
export async function sendAppointmentConfirmation(opts: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: Date;
  appointmentId: string;
}) {
  const dateStr = opts.date.toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = opts.date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const html = emailBase(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">Lịch hẹn đã được ghi nhận</h2>
    <p style="color:rgba(255,255,255,0.6);margin:0 0 28px;font-size:14px;line-height:1.6;">
      Xin chào <strong style="color:#fff;">${opts.patientName}</strong>, lịch hẹn của bạn đã được tạo thành công và đang chờ bác sĩ xác nhận.
    </p>
    <div style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.25);border-radius:12px;padding:24px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;width:120px;">Bác sĩ</td><td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600;">BS. ${opts.doctorName}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Chuyên khoa</td><td style="padding:6px 0;color:#7dd3fc;font-size:14px;">${opts.specialty}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Bệnh viện</td><td style="padding:6px 0;color:#fff;font-size:14px;">${opts.hospital}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Ngày khám</td><td style="padding:6px 0;color:#fff;font-size:14px;">${dateStr}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Giờ khám</td><td style="padding:6px 0;color:#34d399;font-size:14px;font-weight:600;">${timeStr}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Trạng thái</td><td style="padding:6px 0;"><span style="background:rgba(251,191,36,0.15);color:#fbbf24;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">Chờ xác nhận</span></td></tr>
      </table>
    </div>
    <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 20px;line-height:1.6;">
      Bác sĩ sẽ xem xét và xác nhận lịch hẹn của bạn. Bạn sẽ nhận được email thông báo kết quả.
    </p>
    <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">
      Xem lịch hẹn →
    </a>
  `);

  return sendEmail({
    to: opts.patientEmail,
    subject: `Đã ghi nhận lịch hẹn với BS. ${opts.doctorName}`,
    html,
  });
}

// ── 2. Thông báo cho bác sĩ có lịch hẹn mới ─────────────────────────────────
export async function sendDoctorNewAppointment(opts: {
  doctorEmail: string;
  doctorName: string;
  patientName: string;
  patientEmail: string;
  date: Date;
  reason?: string;
}) {
  const dateStr = opts.date.toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = opts.date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const html = emailBase(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">Lịch hẹn mới cần xác nhận</h2>
    <p style="color:rgba(255,255,255,0.6);margin:0 0 28px;font-size:14px;line-height:1.6;">
      Xin chào <strong style="color:#fff;">BS. ${opts.doctorName}</strong>, bạn vừa nhận được một yêu cầu đặt lịch hẹn mới.
    </p>
    <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:24px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;width:120px;">Bệnh nhân</td><td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600;">${opts.patientName}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Email</td><td style="padding:6px 0;color:#7dd3fc;font-size:14px;">${opts.patientEmail}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Ngày hẹn</td><td style="padding:6px 0;color:#fff;font-size:14px;">${dateStr}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Giờ hẹn</td><td style="padding:6px 0;color:#34d399;font-size:14px;font-weight:600;">${timeStr}</td></tr>
        ${opts.reason ? `<tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;vertical-align:top;">Lý do</td><td style="padding:6px 0;color:rgba(255,255,255,0.8);font-size:14px;">${opts.reason}</td></tr>` : ""}
      </table>
    </div>
    <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 20px;">
      Vui lòng vào dashboard để xác nhận hoặc từ chối lịch hẹn này.
    </p>
    <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#0ea5e9);color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">
      Xem và xác nhận →
    </a>
  `);

  return sendEmail({
    to: opts.doctorEmail,
    subject: `Lịch hẹn mới từ ${opts.patientName} — ${timeStr} ${dateStr}`,
    html,
  });
}

// ── 3. Kết quả xác nhận/từ chối gửi cho bệnh nhân ───────────────────────────
export async function sendAppointmentResult(opts: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  date: Date;
  status: "CONFIRMED" | "CANCELLED";
  notes?: string;
}) {
  const dateStr = opts.date.toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = opts.date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const isConfirmed = opts.status === "CONFIRMED";

  const html = emailBase(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">
      ${isConfirmed ? "Lịch hẹn đã được xác nhận" : "Lịch hẹn đã bị từ chối"}
    </h2>
    <p style="color:rgba(255,255,255,0.6);margin:0 0 28px;font-size:14px;line-height:1.6;">
      Xin chào <strong style="color:#fff;">${opts.patientName}</strong>,
      BS. <strong style="color:#fff;">${opts.doctorName}</strong> đã
      ${isConfirmed ? "<span style='color:#34d399;font-weight:600;'>xác nhận</span>" : "<span style='color:#f87171;font-weight:600;'>từ chối</span>"}
      lịch hẹn của bạn.
    </p>
    <div style="background:${isConfirmed ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)"};border:1px solid ${isConfirmed ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"};border-radius:12px;padding:24px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;width:120px;">Bác sĩ</td><td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600;">BS. ${opts.doctorName}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Ngày hẹn</td><td style="padding:6px 0;color:#fff;font-size:14px;">${dateStr}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Giờ hẹn</td><td style="padding:6px 0;color:#fff;font-size:14px;">${timeStr}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Trạng thái</td>
          <td style="padding:6px 0;">
            <span style="background:${isConfirmed ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"};color:${isConfirmed ? "#34d399" : "#f87171"};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">
              ${isConfirmed ? "Đã xác nhận" : "Đã từ chối"}
            </span>
          </td>
        </tr>
        ${opts.notes ? `<tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;vertical-align:top;">Ghi chú</td><td style="padding:6px 0;color:rgba(255,255,255,0.8);font-size:14px;">${opts.notes}</td></tr>` : ""}
      </table>
    </div>
    ${isConfirmed
      ? `<p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 20px;">Hãy đến đúng giờ và mang theo CMND/CCCD. Chúc bạn sức khỏe!</p>`
      : `<p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 20px;">Bạn có thể đặt lịch với bác sĩ khác hoặc chọn thời điểm khác phù hợp hơn.</p>`
    }
    <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">
      ${isConfirmed ? "Xem lịch hẹn →" : "Đặt lịch khác →"}
    </a>
  `);

  return sendEmail({
    to: opts.patientEmail,
    subject: `${isConfirmed ? "Xác nhận" : "Từ chối"} lịch hẹn với BS. ${opts.doctorName}`,
    html,
  });
}

// ── 4. Nhắc lịch hẹn 24h trước ───────────────────────────────────────────────
export async function sendAppointmentReminder(opts: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: Date;
}) {
  const dateStr = opts.date.toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "long",
  });
  const timeStr = opts.date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const html = emailBase(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">Nhắc nhở lịch hẹn ngày mai</h2>
    <p style="color:rgba(255,255,255,0.6);margin:0 0 28px;font-size:14px;line-height:1.6;">
      Xin chào <strong style="color:#fff;">${opts.patientName}</strong>, đây là nhắc nhở lịch hẹn khám bệnh của bạn vào <strong style="color:#0ea5e9;">ngày mai</strong>.
    </p>
    <div style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.25);border-radius:12px;padding:24px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;width:120px;">Bác sĩ</td><td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600;">BS. ${opts.doctorName}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Chuyên khoa</td><td style="padding:6px 0;color:#7dd3fc;font-size:14px;">${opts.specialty}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Địa điểm</td><td style="padding:6px 0;color:#fff;font-size:14px;">${opts.hospital}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Ngày</td><td style="padding:6px 0;color:#fff;font-size:14px;">${dateStr}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Giờ</td><td style="padding:6px 0;color:#34d399;font-size:16px;font-weight:800;">${timeStr}</td></tr>
      </table>
    </div>
    <div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;line-height:1.6;">
        <strong style="color:#fbbf24;">Lưu ý:</strong> Vui lòng mang theo CMND/CCCD và đến trước 15 phút để làm thủ tục.
      </p>
    </div>
    <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">
      Xem chi tiết lịch hẹn →
    </a>
  `);

  return sendEmail({
    to: opts.patientEmail,
    subject: `Nhắc nhở: Lịch hẹn với BS. ${opts.doctorName} vào ${timeStr} ngày mai`,
    html,
  });
}
