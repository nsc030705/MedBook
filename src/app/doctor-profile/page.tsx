"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_VI: Record<string, string> = {
  MONDAY: "Thứ 2", TUESDAY: "Thứ 3", WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5", FRIDAY: "Thứ 6", SATURDAY: "Thứ 7", SUNDAY: "Chủ nhật",
};
const DAY_EN: Record<string, string> = {
  MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday",
};

const TIME_SLOTS = [
  "07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00",
];

interface Schedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface DoctorProfile {
  id: string;
  specialty: string;
  bio: string;
  hospital: string;
  experience: number;
  fee: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  user: { name: string; email: string };
  schedules: Schedule[];
}

export default function DoctorProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { locale } = useLanguage();
  const DAY_LABELS = locale === "vi" ? DAY_VI : DAY_EN;

  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "schedules">("profile");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Profile form state
  const [form, setForm] = useState({
    name: "", specialty: "", hospital: "", bio: "", experience: "", fee: "",
  });

  // New schedule form
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: "MONDAY", startTime: "08:00", endTime: "09:00",
  });
  const [addingSchedule, setAddingSchedule] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session as any).user?.role !== "DOCTOR") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/doctors/me")
        .then((r) => r.json())
        .then((data) => {
          if (data.id) {
            setProfile(data);
            setForm({
              name: data.user.name || "",
              specialty: data.specialty || "",
              hospital: data.hospital || "",
              bio: data.bio || "",
              experience: String(data.experience || ""),
              fee: String(data.fee || ""),
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/doctors/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Lưu thất bại");
      const data = await res.json();
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleAddSchedule = async () => {
    if (newSchedule.startTime >= newSchedule.endTime) {
      return setError("Giờ bắt đầu phải trước giờ kết thúc");
    }
    setAddingSchedule(true);
    setError("");
    try {
      const res = await fetch(`/api/doctors/${profile?.id}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSchedule),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Thêm thất bại");
      }
      const schedule = await res.json();
      setProfile((prev) => prev ? { ...prev, schedules: [...prev.schedules, schedule] } : prev);
    } catch (err: any) {
      setError(err.message);
    }
    setAddingSchedule(false);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!profile) return;
    try {
      await fetch(`/api/doctors/${profile.id}/schedules?scheduleId=${scheduleId}`, {
        method: "DELETE",
      });
      setProfile((prev) =>
        prev ? { ...prev, schedules: prev.schedules.filter((s) => s.id !== scheduleId) } : prev
      );
    } catch {
      setError("Xóa thất bại");
    }
  };

  if (loading || status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  const groupedSchedules = DAY_ORDER.reduce(
    (acc, day) => {
      const slots = profile?.schedules.filter((s) => s.dayOfWeek === day) || [];
      if (slots.length) acc[day] = slots;
      return acc;
    },
    {} as Record<string, Schedule[]>
  );

  const tabStyle = (tab: typeof activeTab) => ({
    padding: "0.6rem 1.25rem",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 600,
    transition: "all 0.2s",
    background: activeTab === tab ? "rgba(14,165,233,0.15)" : "transparent",
    color: activeTab === tab ? "var(--primary)" : "var(--text-muted)",
    borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
  });

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div className="container" style={{ padding: "2rem 1.5rem", maxWidth: 900 }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", fontWeight: 800, color: "white",
              }}
            >
              {form.name ? form.name.split(" ").slice(-1)[0]?.[0]?.toUpperCase() : "?"}
            </div>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
                Hồ sơ bác sĩ
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                {profile?.isVerified
                  ? <span style={{ color: "var(--accent)" }}>✅ Đã xác minh — hiển thị cho bệnh nhân</span>
                  : <span style={{ color: "#fbbf24" }}>⏳ Chờ admin phê duyệt</span>
                }
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
          <button style={tabStyle("profile")} onClick={() => setActiveTab("profile")}>
            👤 Thông tin hồ sơ
          </button>
          <button style={tabStyle("schedules")} onClick={() => setActiveTab("schedules")}>
            📅 Lịch làm việc
          </button>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem",
            color: "#f87171", fontSize: "0.85rem",
          }}>
            {error}
          </div>
        )}

        {saved && (
          <div style={{
            background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)",
            borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem",
            color: "#34d399", fontSize: "0.85rem",
          }}>
            ✅ Đã lưu thay đổi thành công!
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <div className="glass" style={{ padding: "2rem" }}>
            <form onSubmit={handleSaveProfile}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    Họ và tên *
                  </label>
                  <input
                    className="input" required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="TS.BS Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    Chuyên khoa *
                  </label>
                  <select
                    className="input"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  >
                    {["Tim mạch","Nội tiết","Thần kinh","Sản phụ khoa","Nội khoa","Nhi","Da liễu","Tiêu hóa","Hô hấp","Ngoại khoa","Ung bướu","Chỉnh hình","Mắt","Tai mũi họng","Tâm thần"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    Bệnh viện / Phòng khám
                  </label>
                  <input
                    className="input"
                    value={form.hospital}
                    onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                    placeholder="Bệnh viện Bạch Mai"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    Số năm kinh nghiệm
                  </label>
                  <input
                    className="input" type="number" min="0" max="60"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    Phí khám (VND)
                  </label>
                  <input
                    className="input" type="number" min="0" step="50000"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: e.target.value })}
                    placeholder="300000"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    Đánh giá hiện tại
                  </label>
                  <div className="input" style={{ background: "rgba(255,255,255,0.02)", cursor: "not-allowed", color: "var(--text-muted)" }}>
                    ⭐ {profile?.rating?.toFixed(1) || "—"} ({profile?.reviewCount || 0} đánh giá)
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                  Giới thiệu bản thân
                </label>
                <textarea
                  className="input" rows={5}
                  style={{ resize: "vertical" }}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Mô tả kinh nghiệm, chuyên môn, phương pháp điều trị..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ padding: "0.75rem 2rem", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? <><div className="spinner" />Đang lưu...</> : "💾 Lưu hồ sơ"}
              </button>
            </form>
          </div>
        )}

        {/* ── SCHEDULES TAB ── */}
        {activeTab === "schedules" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Add new schedule */}
            <div className="glass" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "1rem", fontSize: "0.95rem" }}>
                ➕ Thêm khung giờ làm việc
              </h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                    Thứ
                  </label>
                  <select
                    className="input"
                    style={{ minWidth: 130 }}
                    value={newSchedule.dayOfWeek}
                    onChange={(e) => setNewSchedule({ ...newSchedule, dayOfWeek: e.target.value })}
                  >
                    {DAY_ORDER.map((d) => (
                      <option key={d} value={d}>{DAY_LABELS[d]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                    Từ
                  </label>
                  <select
                    className="input"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                  >
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                    Đến
                  </label>
                  <select
                    className="input"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                  >
                    {TIME_SLOTS.filter((t) => t > newSchedule.startTime).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddSchedule}
                  disabled={addingSchedule}
                  className="btn-primary"
                  style={{ padding: "0.55rem 1.25rem", opacity: addingSchedule ? 0.7 : 1 }}
                >
                  {addingSchedule ? <div className="spinner" /> : "Thêm"}
                </button>
              </div>
            </div>

            {/* Current schedules */}
            <div className="glass" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "1.25rem", fontSize: "0.95rem" }}>
                📅 Lịch làm việc hiện tại
              </h3>
              {Object.keys(groupedSchedules).length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</div>
                  <p>Chưa có lịch làm việc. Thêm khung giờ để bệnh nhân có thể đặt lịch.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {DAY_ORDER.filter((d) => groupedSchedules[d]).map((day) => (
                    <div key={day}>
                      <div style={{
                        fontSize: "0.75rem", fontWeight: 700, color: "var(--text-dim)",
                        textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem",
                      }}>
                        {DAY_LABELS[day]}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {groupedSchedules[day].map((slot) => (
                          <div
                            key={slot.id}
                            style={{
                              display: "flex", alignItems: "center", gap: "0.5rem",
                              padding: "0.35rem 0.75rem",
                              borderRadius: 8,
                              background: "rgba(14,165,233,0.1)",
                              border: "1px solid rgba(14,165,233,0.2)",
                            }}
                          >
                            <span style={{ color: "var(--primary)", fontSize: "0.82rem", fontWeight: 600 }}>
                              {slot.startTime} – {slot.endTime}
                            </span>
                            <button
                              onClick={() => handleDeleteSchedule(slot.id)}
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "rgba(248,113,113,0.7)", fontSize: "0.8rem", padding: 0, lineHeight: 1,
                              }}
                              title="Xóa khung giờ này"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
