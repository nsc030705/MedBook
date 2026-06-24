"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  date: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  reason: string | null;
  notes: string | null;
  createdAt: string;
  patient: { id: string; name: string | null; email: string; image: string | null };
  doctor: {
    id: string;
    specialty: string;
    hospital: string | null;
    fee: number;
    user: { id: string; name: string | null; email: string };
  };
  schedule: { dayOfWeek: string; startTime: string; endTime: string } | null;
}

interface Doctor {
  id: string;
  specialty: string;
  hospital: string | null;
  fee: number;
  user: { name: string | null; email: string };
}

interface Patient {
  id: string;
  name: string | null;
  email: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { bg: string; color: string; border: string; label: string; icon: string }> = {
  PENDING:   { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.3)",  label: "Chờ xác nhận", icon: "" },
  CONFIRMED: { bg: "rgba(52,211,153,0.12)",  color: "#34d399", border: "rgba(52,211,153,0.3)",  label: "Đã xác nhận",  icon: "" },
  CANCELLED: { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.3)", label: "Đã hủy",        icon: "" },
  COMPLETED: { bg: "rgba(99,102,241,0.12)",  color: "#a5b4fc", border: "rgba(99,102,241,0.3)",  label: "Hoàn thành",   icon: "" },
};

const FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "PENDING",   label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "COMPLETED", label: "Hoàn thành" },
] as const;

// ─── Modal — Confirm / Cancel / Delete ───────────────────────────────────────

function ConfirmModal({
  type,
  appointment,
  onConfirm,
  onClose,
  loading,
}: {
  type: "confirm" | "cancel" | "delete";
  appointment: Appointment;
  onConfirm: (notes?: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState(appointment.notes || "");
  const cfg = {
    confirm: { title: "Xác nhận lịch hẹn", btnClass: "btn-success", btnText: "Xác nhận", color: "#34d399" },
    cancel:  { title: "Hủy lịch hẹn",      btnClass: "btn-danger",   btnText: "Hủy lịch",  color: "#f87171" },
    delete:  { title: "Xóa lịch hẹn",      btnClass: "btn-danger",   btnText: "Xóa",       color: "#f87171" },
  }[type];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem",
    }}>
      <div className="glass" style={{ width: "100%", maxWidth: 460, padding: "2rem", borderColor: cfg.color + "55" }}>
        <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: "0.5rem" }}>
          {cfg.title}
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
          {type === "delete"
            ? "Thao tác này không thể hoàn tác. Lịch hẹn sẽ bị xóa vĩnh viễn."
            : `Lịch hẹn của ${appointment.patient.name || appointment.patient.email} với BS. ${appointment.doctor.user.name || appointment.doctor.user.email}`}
        </p>

        {type !== "delete" && (
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Nhập ghi chú cho bệnh nhân..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "0.45rem 1.1rem", fontSize: "0.85rem" }} disabled={loading}>
            Đóng
          </button>
          <button
            onClick={() => onConfirm(type !== "delete" ? notes : undefined)}
            className={cfg.btnClass}
            style={{ padding: "0.45rem 1.25rem", fontSize: "0.85rem", opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : cfg.btnText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal — Create Appointment ───────────────────────────────────────────────

function CreateModal({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    date: "",
    time: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/doctors").then((r) => r.json()),
      fetch("/api/admin/users?role=PATIENT&limit=100").then((r) => r.json()),
    ]).then(([docs, usersData]) => {
      setDoctors(Array.isArray(docs) ? docs : []);
      setPatients(Array.isArray(usersData?.users) ? usersData.users : []);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.patientId || !form.doctorId || !form.date || !form.time) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    setSubmitting(true);
    const dateTime = new Date(`${form.date}T${form.time}:00`);
    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: form.patientId,
        doctorId: form.doctorId,
        date: dateTime.toISOString(),
        reason: form.reason || null,
        notes: form.notes || null,
      }),
    });
    if (res.ok) {
      onCreated();
    } else {
      const data = await res.json();
      setError(data.error || "Có lỗi xảy ra. Vui lòng thử lại.");
    }
    setSubmitting(false);
  };

  const field = (label: string, required: boolean, children: React.ReactNode) => (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
        {label} {required && <span style={{ color: "#f87171" }}>*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem",
      overflowY: "auto",
    }}>
      <div className="glass" style={{ width: "100%", maxWidth: 560, padding: "2rem", margin: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text)" }}>
            Thêm lịch hẹn mới
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
        </div>

        {loadingData ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {field("Bệnh nhân", true,
              <select
                className="input"
                value={form.patientId}
                onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
              >
                <option value="">-- Chọn bệnh nhân --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.email} ({p.email})
                  </option>
                ))}
              </select>
            )}

            {field("Bác sĩ", true,
              <select
                className="input"
                value={form.doctorId}
                onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
              >
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    BS. {d.user.name || d.user.email} — {d.specialty}
                    {d.hospital ? ` · ${d.hospital}` : ""}
                  </option>
                ))}
              </select>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {field("Ngày hẹn", true,
                <input
                  type="date"
                  className="input"
                  value={form.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              )}
              {field("Giờ hẹn", true,
                <input
                  type="time"
                  className="input"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                />
              )}
            </div>

            {field("Lý do khám", false,
              <input
                type="text"
                className="input"
                placeholder="VD: Khám tổng quát, đau đầu..."
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            )}

            {field("Ghi chú của admin", false,
              <textarea
                className="input"
                rows={2}
                placeholder="Ghi chú nội bộ (tuỳ chọn)..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                style={{ resize: "vertical" }}
              />
            )}

            {error && (
              <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "0.6rem 0.9rem", color: "#f87171", fontSize: "0.82rem", marginBottom: "1rem" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="button" onClick={onClose} className="btn-ghost" style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem" }}>
                Hủy
              </button>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1 }}>
                {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Tạo lịch hẹn"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const [actionModal, setActionModal] = useState<{ type: "confirm" | "cancel" | "delete"; apt: Appointment } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session as any).user?.role !== "ADMIN") router.push("/dashboard");
  }, [status, session, router]);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/admin/appointments?${params}`);
      const data = await res.json();
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      setTotal(data.total || 0);
    } catch {
      setAppointments([]);
    }
    setLoading(false);
  }, [statusFilter, search, page]);

  useEffect(() => {
    if (status === "authenticated") fetchAppointments();
  }, [status, fetchAppointments]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [statusFilter, search]);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleAction = async (notes?: string) => {
    if (!actionModal) return;
    setActionLoading(true);
    const { type, apt } = actionModal;

    if (type === "delete") {
      const res = await fetch(`/api/admin/appointments/${apt.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Đã xóa lịch hẹn");
        setActionModal(null);
        fetchAppointments();
      } else {
        showToast("Không thể xóa lịch hẹn", false);
      }
    } else {
      const newStatus = type === "confirm" ? "CONFIRMED" : "CANCELLED";
      const res = await fetch(`/api/admin/appointments/${apt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (res.ok) {
        showToast(type === "confirm" ? "Đã xác nhận lịch hẹn" : "Đã hủy lịch hẹn");
        setActionModal(null);
        fetchAppointments();
      } else {
        showToast("Có lỗi xảy ra. Vui lòng thử lại.", false);
      }
    }
    setActionLoading(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div className="container" style={{ padding: "2rem 1.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/admin" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem" }}>
              ← Admin
            </Link>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: "0.25rem 0 0", letterSpacing: "-0.02em" }}>
              Quản lý Lịch Hẹn
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
              {total.toLocaleString()} lịch hẹn tổng cộng
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowCreate(true)}
            style={{ flexShrink: 0 }}
          >
            + Thêm lịch hẹn
          </button>
        </div>

        {/* Filters */}
        <div className="glass" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="input"
            placeholder="Tìm bệnh nhân hoặc bác sĩ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                style={{
                  padding: "0.35rem 0.85rem", borderRadius: 8, cursor: "pointer",
                  border: "1px solid",
                  borderColor: statusFilter === f.value ? "rgba(14,165,233,0.5)" : "var(--border)",
                  background: statusFilter === f.value ? "rgba(14,165,233,0.12)" : "transparent",
                  color: statusFilter === f.value ? "var(--primary)" : "var(--text-muted)",
                  fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <div className="spinner" style={{ margin: "0 auto", width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="glass" style={{ textAlign: "center", padding: "4rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}></div>
            <p style={{ color: "var(--text-muted)" }}>Không có lịch hẹn nào{search || statusFilter ? " phù hợp" : ""}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {appointments.map((apt) => {
              const s = STATUS_META[apt.status] || STATUS_META.PENDING;
              const dateObj = new Date(apt.date);
              const isPast = dateObj < new Date();
              return (
                <div
                  key={apt.id}
                  className="glass"
                  style={{
                    padding: "1rem 1.25rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    flexWrap: "wrap", gap: "0.75rem",
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Left: patient + doctor */}
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.8rem", fontWeight: 800, color: "white",
                      }}>
                        {(apt.patient.name || apt.patient.email)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text)" }}>
                          {apt.patient.name || apt.patient.email}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          → BS. {apt.doctor.user.name || apt.doctor.user.email} · {apt.doctor.specialty}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", paddingLeft: 2 }}>
                      {dateObj.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric", year: "numeric" })}
                      {" "}
                      {dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      {apt.reason && <span style={{ marginLeft: "0.5rem" }}>- {apt.reason}</span>}
                      {apt.notes && <span style={{ marginLeft: "0.5rem", color: "var(--primary)" }}>- {apt.notes}</span>}
                    </div>
                  </div>

                  {/* Right: status + actions */}
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                    <span style={{
                      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                      padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600,
                    }}>
                      {s.label}
                    </span>

                    {/* Action buttons */}
                    {apt.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => setActionModal({ type: "confirm", apt })}
                          className="btn-success"
                          style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                        >
                          Xác nhận
                        </button>
                        <button
                          onClick={() => setActionModal({ type: "cancel", apt })}
                          className="btn-danger"
                          style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                        >
                          Hủy
                        </button>
                      </>
                    )}
                    {apt.status === "CONFIRMED" && (
                      <button
                        onClick={() => setActionModal({ type: "cancel", apt })}
                        className="btn-danger"
                        style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      onClick={() => setActionModal({ type: "delete", apt })}
                      style={{
                        background: "transparent", border: "1px solid rgba(248,113,113,0.3)",
                        color: "#f87171", borderRadius: 8, padding: "0.3rem 0.65rem",
                        fontSize: "0.75rem", cursor: "pointer", transition: "all 0.15s",
                      }}
                      title="Xóa lịch hẹn"
                    >
                      X
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem", alignItems: "center" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost"
              style={{ padding: "0.35rem 0.9rem", fontSize: "0.82rem", opacity: page === 1 ? 0.4 : 1 }}
            >
              ← Trước
            </button>
            <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost"
              style={{ padding: "0.35rem 0.9rem", fontSize: "0.82rem", opacity: page === totalPages ? 0.4 : 1 }}
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {actionModal && (
        <ConfirmModal
          type={actionModal.type}
          appointment={actionModal.apt}
          onConfirm={handleAction}
          onClose={() => setActionModal(null)}
          loading={actionLoading}
        />
      )}
      {showCreate && (
        <CreateModal
          onCreated={() => { setShowCreate(false); showToast("Tạo lịch hẹn thành công"); fetchAppointments(); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 2000,
          background: toast.ok ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
          border: `1px solid ${toast.ok ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)"}`,
          color: toast.ok ? "#34d399" : "#f87171",
          backdropFilter: "blur(12px)", borderRadius: 12,
          padding: "0.8rem 1.25rem", fontWeight: 600, fontSize: "0.88rem",
          animation: "fadeInUp 0.3s ease",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
