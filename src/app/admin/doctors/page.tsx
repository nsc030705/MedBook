"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Doctor {
  id: string;
  specialty: string;
  hospital: string;
  experience: number;
  fee: number;
  rating: number;
  isVerified: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string; image: string; isActive: boolean; createdAt: string };
  _count: { appointments: number };
}

export default function AdminDoctorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session as any).user?.role !== "ADMIN") router.push("/dashboard");
  }, [status, session, router]);

  const loadDoctors = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter === "verified") params.set("verified", "true");
    if (filter === "pending") params.set("verified", "false");
    const res = await fetch(`/api/admin/doctors?${params}`);
    const data = await res.json();
    setDoctors(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { if (session) loadDoctors(); }, [session, search, filter]);

  const handleVerify = async (doctorId: string, action: "verify" | "unverify") => {
    setUpdating(doctorId);
    const res = await fetch("/api/admin/doctors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, action }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDoctors((prev) =>
        prev.map((d) => d.id === doctorId ? { ...d, isVerified: updated.isVerified } : d)
      );
    }
    setUpdating(null);
  };

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div className="container" style={{ padding: "2rem 1.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/admin" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem" }}>
              ← Admin
            </Link>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: "0.25rem 0 0" }}>
              Quản lý Bác Sĩ
            </h1>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{
              background: "rgba(251,191,36,0.15)", color: "#fbbf24",
              padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700,
            }}>
              {doctors.filter((d) => !d.isVerified).length} chờ duyệt
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="glass" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="input"
            placeholder="Tìm kiếm bác sĩ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          {(["all", "pending", "verified"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "0.4rem 0.85rem", borderRadius: 8, cursor: "pointer",
                border: "1px solid",
                borderColor: filter === f ? "rgba(14,165,233,0.5)" : "var(--border)",
                background: filter === f ? "rgba(14,165,233,0.15)" : "transparent",
                color: filter === f ? "var(--primary)" : "var(--text-muted)",
                fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap",
              }}
            >
              {f === "all" ? "Tất cả" : f === "pending" ? "Chờ duyệt" : "Đã duyệt"}
            </button>
          ))}
        </div>

        {/* Doctor list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {doctors.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}></div>
                <p>Không tìm thấy bác sĩ nào</p>
              </div>
            ) : doctors.map((doc) => (
              <div
                key={doc.id}
                className="glass"
                style={{
                  padding: "1.25rem 1.5rem",
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", flexWrap: "wrap", gap: "1rem",
                  borderColor: !doc.isVerified ? "rgba(251,191,36,0.2)" : undefined,
                }}
              >
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div
                    style={{
                      width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem", fontWeight: 800, color: "white",
                    }}
                  >
                    {doc.user.name?.split(" ").slice(-1)[0]?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text)" }}>
                      {doc.user.name}
                      {" "}
                      {doc.isVerified
                        ? <span style={{ color: "#34d399", fontSize: "0.75rem" }}>Xác nhận</span>
                        : <span style={{ color: "#fbbf24", fontSize: "0.75rem" }}>Chờ duyệt</span>
                      }
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {doc.user.email} · {doc.specialty}
                      {doc.hospital && ` · ${doc.hospital}`}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>
                      {doc._count.appointments} lịch hẹn · {doc.rating} sao
                      · Đăng ký {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  {!doc.isVerified ? (
                    <button
                      onClick={() => handleVerify(doc.id, "verify")}
                      disabled={updating === doc.id}
                      className="btn-success"
                      style={{ padding: "0.4rem 0.9rem", fontSize: "0.82rem", opacity: updating === doc.id ? 0.7 : 1 }}
                    >
                      {updating === doc.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : "Phê duyệt"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerify(doc.id, "unverify")}
                      disabled={updating === doc.id}
                      className="btn-danger"
                      style={{ padding: "0.4rem 0.9rem", fontSize: "0.82rem", opacity: updating === doc.id ? 0.7 : 1 }}
                    >
                      {updating === doc.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : "Thu hồi"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
