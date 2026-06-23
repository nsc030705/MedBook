"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

interface Doctor {
  id: string;
  specialty: string;
  hospital: string;
  bio: string;
  experience: number;
  rating: number;
  reviewCount: number;
  fee: number;
  user: { name: string; image?: string };
  schedules: { dayOfWeek: string; startTime: string; endTime: string }[];
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { t, locale } = useLanguage();
  const doc = t.doctors;

  // Reset specialty filter when locale changes (specialty keys differ)
  useEffect(() => {
    setSpecialty("");
    setPage(1);
  }, [locale]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    // Map EN specialty back to VI for the API (API uses VI names)
    if (specialty && specialty !== doc.specialties[0]) {
      // Map display specialty back to VI equivalent by index position
      const idx = doc.specialties.findIndex((s) => s === specialty);
      const VI_SPECIALTIES = [
        "Tất cả", "Tim mạch", "Nội tiết", "Thần kinh", "Sản phụ khoa",
        "Nội khoa", "Nhi", "Da liễu", "Tiêu hóa", "Hô hấp",
      ];
      if (idx > 0) params.set("specialty", VI_SPECIALTIES[idx]);
    }
    params.set("page", page.toString());

    fetch(`/api/doctors?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setDoctors(data.doctors || []);
        setTotal(data.pagination?.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, specialty, page, locale]);

  const DAY_LABELS = t.doctorDetail.dayLabels;

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div className="container" style={{ padding: "2rem 1.5rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: "0.5rem",
            }}
          >
            {doc.title1}{" "}
            <span className="gradient-text">{doc.title2}</span>
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            {total} {doc.subtitle}
          </p>
        </div>

        {/* Search + Filter */}
        <div
          className="glass"
          style={{
            padding: "1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              className="input"
              placeholder={doc.searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {doc.specialties.map((sp) => (
              <button
                key={sp}
                onClick={() => { setSpecialty(sp === doc.specialties[0] ? "" : sp); setPage(1); }}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor:
                    (specialty === sp || (sp === doc.specialties[0] && !specialty))
                      ? "rgba(14,165,233,0.5)"
                      : "var(--border)",
                  background:
                    (specialty === sp || (sp === doc.specialties[0] && !specialty))
                      ? "rgba(14,165,233,0.15)"
                      : "rgba(255,255,255,0.03)",
                  color:
                    (specialty === sp || (sp === doc.specialties[0] && !specialty))
                      ? "var(--primary)"
                      : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass"
                style={{ height: 280, borderRadius: 16, opacity: 0.5 }}
              />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍</div>
            <p>{doc.notFound}</p>
          </div>
        ) : (
          <div className="doctor-grid">
            {doctors.map((doctor) => {
              const initials = doctor.user.name.split(" ").slice(-2).map((w) => w[0]).join("");
              const uniqueDays = [...new Set(doctor.schedules.map((s) => s.dayOfWeek))];

              return (
                <div
                  key={doctor.id}
                  className="glass"
                  style={{
                    padding: "1.5rem",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 40px rgba(14,165,233,0.1)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(14,165,233,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                >
                  {/* Doctor header */}
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>
                        {doctor.user.name}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, marginBottom: "0.2rem" }}>
                        {doctor.specialty}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        🏥 {doctor.hospital}
                      </div>
                    </div>
                  </div>

                  {/* Rating + experience */}
                  <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.8rem" }}>
                    <div>
                      <span style={{ color: "#fbbf24" }}>★</span>{" "}
                      <span style={{ fontWeight: 700, color: "var(--text)" }}>{doctor.rating}</span>{" "}
                      <span style={{ color: "var(--text-muted)" }}>({doctor.reviewCount})</span>
                    </div>
                    <div style={{ color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--text)", fontWeight: 600 }}>{doctor.experience}</span>{" "}
                      {doc.yearsExp}
                    </div>
                    <div style={{ color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                        {doctor.fee.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                        {locale === "vi" ? "đ" : " VND"}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {doctor.bio && (
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.6,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {doctor.bio}
                    </p>
                  )}

                  {/* Schedule days */}
                  {uniqueDays.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginBottom: "0.4rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {doc.schedule}
                      </div>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {uniqueDays.map((day) => (
                          <span
                            key={day}
                            style={{
                              padding: "0.2rem 0.5rem",
                              borderRadius: 5,
                              background: "rgba(14,165,233,0.1)",
                              border: "1px solid rgba(14,165,233,0.2)",
                              color: "var(--primary)",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                            }}
                          >
                            {DAY_LABELS[day as keyof typeof DAY_LABELS] ?? day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action */}
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="btn-primary"
                    style={{ textAlign: "center", justifyContent: "center" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {doc.viewBook}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
