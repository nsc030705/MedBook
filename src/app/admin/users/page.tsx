"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  image: string;
  doctor: { id: string; specialty: string; isVerified: boolean } | null;
  _count: { appointments: number };
}

const ROLE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  PATIENT: { bg: "rgba(14,165,233,0.15)", color: "#0ea5e9", label: "Bệnh nhân" },
  DOCTOR:  { bg: "rgba(99,102,241,0.15)", color: "#818cf8", label: "Bác sĩ" },
  ADMIN:   { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", label: "Admin" },
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session as any).user?.role !== "ADMIN") router.push("/dashboard");
  }, [status, session, router]);

  const loadUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    params.set("page", String(page));
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { if (session) loadUsers(); }, [session, search, roleFilter, page]);

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setUpdating(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isActive: !currentActive }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, isActive: !currentActive } : u)
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
              👥 Quản lý Người Dùng
            </h1>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {total.toLocaleString()} người dùng
          </span>
        </div>

        {/* Filters */}
        <div className="glass" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="input"
            placeholder="🔍 Tìm tên hoặc email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select
            className="input"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={{ width: 150 }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="PATIENT">Bệnh nhân</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Users table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {users.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
                  <p>Không tìm thấy người dùng nào</p>
                </div>
              ) : users.map((user) => {
                const rb = ROLE_BADGE[user.role] || ROLE_BADGE.PATIENT;
                return (
                  <div
                    key={user.id}
                    className="glass"
                    style={{
                      padding: "1rem 1.25rem",
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", flexWrap: "wrap", gap: "0.75rem",
                      opacity: user.isActive ? 1 : 0.6,
                      borderColor: !user.isActive ? "rgba(248,113,113,0.2)" : undefined,
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      {user.image ? (
                        <img src={user.image} alt="" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                          background: "rgba(255,255,255,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)",
                        }}>
                          {user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>
                            {user.name || "(Không có tên)"}
                          </span>
                          <span style={{
                            background: rb.bg, color: rb.color,
                            padding: "2px 8px", borderRadius: 20,
                            fontSize: "0.68rem", fontWeight: 700,
                          }}>
                            {rb.label}
                          </span>
                          {!user.isActive && (
                            <span style={{
                              background: "rgba(248,113,113,0.15)", color: "#f87171",
                              padding: "2px 8px", borderRadius: 20,
                              fontSize: "0.68rem", fontWeight: 700,
                            }}>
                              🔒 Đã khóa
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {user.email}
                          {user.doctor && ` · ${user.doctor.specialty}`}
                          {" · "}Tham gia {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                        {user._count.appointments > 0 && (
                          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>
                            {user._count.appointments} lịch hẹn
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {user.role !== "ADMIN" && (
                      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          disabled={updating === user.id}
                          className={user.isActive ? "btn-danger" : "btn-success"}
                          style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem", opacity: updating === user.id ? 0.7 : 1 }}
                        >
                          {updating === user.id
                            ? <div className="spinner" style={{ width: 14, height: 14 }} />
                            : user.isActive ? "🔒 Khóa" : "🔓 Mở khóa"
                          }
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {Math.ceil(total / 20) > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost"
                  style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem", opacity: page === 1 ? 0.4 : 1 }}
                >
                  ← Trước
                </button>
                <span style={{ padding: "0.4rem 1rem", color: "var(--text-muted)", fontSize: "0.82rem", alignSelf: "center" }}>
                  Trang {page} / {Math.ceil(total / 20)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 20)}
                  className="btn-ghost"
                  style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem", opacity: page >= Math.ceil(total / 20) ? 0.4 : 1 }}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
