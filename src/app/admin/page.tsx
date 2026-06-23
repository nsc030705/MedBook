"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Stats {
  overview: {
    totalUsers: number;
    totalDoctors: number;
    totalAppointments: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    cancelledAppointments: number;
    completedAppointments: number;
    confirmRate: number;
    cancelRate: number;
  };
  chartData: { date: string; count: number }[];
  topDoctors: { id: string; name: string; specialty: string; appointmentCount: number; rating: number }[];
  recentAppointments: {
    id: string;
    patientName: string;
    doctorName: string;
    date: string;
    status: string;
    createdAt: string;
  }[];
}

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24", label: "Chờ xác nhận" },
  CONFIRMED: { bg: "rgba(52,211,153,0.15)",  color: "#34d399", label: "Đã xác nhận" },
  CANCELLED: { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "Đã hủy" },
  COMPLETED: { bg: "rgba(99,102,241,0.15)",  color: "#818cf8", label: "Hoàn thành" },
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session as any).user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stats?period=${period}`)
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (status === "loading" || !stats) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  const ov = stats.overview;
  const maxCount = Math.max(...(stats.chartData.map((d) => d.count)), 1);

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div className="container" style={{ padding: "2rem 1.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", margin: 0, marginBottom: "0.25rem" }}>
              🛡️ Admin Dashboard
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
              Quản trị hệ thống MedBook
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/admin/appointments" className="btn-ghost" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
              📋 Lịch hẹn
            </Link>
            <Link href="/admin/doctors" className="btn-ghost" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
              🩺 Bác sĩ
            </Link>
            <Link href="/admin/users" className="btn-ghost" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
              👥 Người dùng
            </Link>
          </div>
        </div>

        {/* Overview stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Người dùng", value: ov.totalUsers, icon: "👥", color: "#0ea5e9" },
            { label: "Bác sĩ xác minh", value: ov.totalDoctors, icon: "🩺", color: "#6366f1" },
            { label: "Tổng lịch hẹn", value: ov.totalAppointments, icon: "📋", color: "#8b5cf6" },
            { label: "Đang chờ", value: ov.pendingAppointments, icon: "⏳", color: "#fbbf24" },
            { label: "Đã xác nhận", value: ov.confirmedAppointments, icon: "✅", color: "#34d399" },
            { label: "Đã hủy", value: ov.cancelledAppointments, icon: "❌", color: "#f87171" },
          ].map((stat) => (
            <div key={stat.label} className="glass" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{stat.icon}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: stat.color, letterSpacing: "-0.02em" }}>
                {stat.value.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
          {/* Chart */}
          <div className="glass" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontWeight: 700, color: "var(--text)", fontSize: "1rem", margin: 0 }}>
                📊 Lịch hẹn theo thời gian
              </h2>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {(["week", "month", "year"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: "0.25rem 0.65rem", borderRadius: 6, border: "1px solid",
                      borderColor: period === p ? "rgba(14,165,233,0.5)" : "var(--border)",
                      background: period === p ? "rgba(14,165,233,0.15)" : "transparent",
                      color: period === p ? "var(--primary)" : "var(--text-muted)",
                      cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
                    }}
                  >
                    {p === "week" ? "7 ngày" : p === "month" ? "30 ngày" : "1 năm"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                <div className="spinner" />
              </div>
            ) : stats.chartData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Chưa có dữ liệu trong kỳ này
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: 160, padding: "0 4px" }}>
                {stats.chartData.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count} lịch hẹn`}
                    style={{
                      flex: 1,
                      minWidth: 4,
                      height: `${(d.count / maxCount) * 100}%`,
                      minHeight: 4,
                      background: "linear-gradient(to top, #0ea5e9, #6366f1)",
                      borderRadius: "3px 3px 0 0",
                      transition: "opacity 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  />
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              {[
                { label: "Tỷ lệ xác nhận", value: `${ov.confirmRate}%`, color: "#34d399" },
                { label: "Tỷ lệ hủy", value: `${ov.cancelRate}%`, color: "#f87171" },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Doctors */}
          <div className="glass" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontWeight: 700, color: "var(--text)", fontSize: "1rem", marginBottom: "1rem" }}>
              🏆 Top Bác Sĩ
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {stats.topDoctors.map((doc, i) => (
                <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: i === 0 ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                      : i === 1 ? "linear-gradient(135deg, #94a3b8, #64748b)"
                      : "linear-gradient(135deg, #78716c, #57534e)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.72rem", fontWeight: 800, color: "white",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{doc.specialty}</div>
                  </div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}>
                    {doc.appointmentCount} lịch
                  </div>
                </div>
              ))}
              {stats.topDoctors.length === 0 && (
                <p style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>Chưa có dữ liệu</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent appointments */}
        <div className="glass" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontWeight: 700, color: "var(--text)", fontSize: "1rem", margin: 0 }}>
              🕐 Lịch hẹn gần đây
            </h2>
            <Link href="/admin/appointments" style={{ fontSize: "0.78rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
              Xem tất cả →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {stats.recentAppointments.map((apt) => {
              const s = STATUS_COLOR[apt.status] || STATUS_COLOR.PENDING;
              return (
                <div
                  key={apt.id}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "0.75rem 1rem",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)", borderRadius: 10,
                    flexWrap: "wrap", gap: "0.5rem",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>
                      {apt.patientName} → BS. {apt.doctorName}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {new Date(apt.date).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric" })}
                      {" · "}
                      {new Date(apt.date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span style={{
                    background: s.bg, color: s.color,
                    padding: "3px 10px", borderRadius: 20,
                    fontSize: "0.72rem", fontWeight: 600,
                  }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
            {stats.recentAppointments.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "1rem" }}>
                Chưa có lịch hẹn nào
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
