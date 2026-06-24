"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

interface Appointment {
  id: string;
  date: string;
  status: string;
  reason?: string;
  doctor: {
    specialty: string;
    hospital: string;
    user: { name: string };
  };
  patient: { name: string; email: string };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, locale } = useLanguage();
  const d = t.dashboard;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/appointments")
        .then((r) => r.json())
        .then((data) => {
          setAppointments(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || !session) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  const isDoctor = (session.user as any).role === "DOCTOR";
  const upcoming = appointments.filter(
    (a) => ["PENDING", "CONFIRMED"].includes(a.status) && new Date(a.date) > new Date()
  );
  const past = appointments.filter(
    (a) => a.status === "COMPLETED" || new Date(a.date) < new Date()
  );

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    PENDING: { label: d.statusPending, cls: "badge-pending" },
    CONFIRMED: { label: d.statusConfirmed, cls: "badge-confirmed" },
    CANCELLED: { label: d.statusCancelled, cls: "badge-cancelled" },
    COMPLETED: { label: d.statusCompleted, cls: "badge-completed" },
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div className="container" style={{ padding: "2rem 1.5rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text)",
                marginBottom: "0.25rem",
              }}
            >
              {d.greeting} {session.user?.name?.split(" ").pop()}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {isDoctor ? d.roleDoctor : d.rolePatient} · {session.user?.email}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {!isDoctor && (
              <Link href="/doctors" className="btn-primary">
                {d.newAppointment}
              </Link>
            )}
            <Link href="/chat" className="btn-ghost">
              {d.chatAI}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {[
            { label: d.statTotal, value: appointments.length, icon: "" },
            { label: d.statUpcoming, value: upcoming.length, icon: "" },
            { label: d.statCompleted, value: past.length, icon: "" },
            {
              label: d.statPending,
              value: appointments.filter((a) => a.status === "PENDING").length,
              icon: "",
            },
          ].map((stat) => (
            <div key={stat.label} className="glass" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "var(--primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Appointments */}
        <div className="glass" style={{ padding: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "1.25rem",
            }}
          >
            {isDoctor ? d.appointmentsDoctor : d.appointmentsPatient}
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : appointments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}></div>
              <p>{d.noAppointments}</p>
              {!isDoctor && (
                <Link
                  href="/doctors"
                  className="btn-primary"
                  style={{ display: "inline-flex", marginTop: "1rem" }}
                >
                  {d.bookNow}
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {appointments.map((apt) => {
                const s = STATUS_MAP[apt.status] || { label: apt.status, cls: "" };
                const date = new Date(apt.date);
                return (
                  <div
                    key={apt.id}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "1rem 1.25rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.3rem",
                          flexShrink: 0,
                        }}
                      >
                        
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                          {isDoctor
                            ? apt.patient.name
                            : `BS. ${apt.doctor.user.name}`}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {isDoctor ? apt.patient.email : apt.doctor.specialty} ·{" "}
                          {date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                        {apt.reason && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                            {apt.reason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className={`badge ${s.cls}`}>{s.label}</span>

                      {isDoctor && apt.status === "PENDING" && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleStatusChange(apt.id, "CONFIRMED")}
                            className="btn-success"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                          >
                            {d.confirm}
                          </button>
                          <button
                            onClick={() => handleStatusChange(apt.id, "CANCELLED")}
                            className="btn-danger"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                          >
                            {d.reject}
                          </button>
                        </div>
                      )}

                      {!isDoctor && apt.status === "PENDING" && (
                        <button
                          onClick={() => handleStatusChange(apt.id, "CANCELLED")}
                          className="btn-danger"
                          style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                        >
                          {d.cancel}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
