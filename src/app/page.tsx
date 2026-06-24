"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const STATS_VALUES = ["50+", "15+", "1,000+", "24/7"];

const DOCTORS_PREVIEW = [
  { name: "TS.BS Nguyễn Văn Hùng", specialty: "Cardiology", specialtyVi: "Tim mạch", rating: 4.9 },
  { name: "PGS.TS Trần Thị Mai", specialty: "Endocrinology", specialtyVi: "Nội tiết", rating: 4.8 },
  { name: "BS.CKII Phạm Thị Lan", specialty: "Obstetrics", specialtyVi: "Sản phụ khoa", rating: 4.9 },
];

export default function HomePage() {
  const { t, locale } = useLanguage();
  const h = t.home;

  const stats = STATS_VALUES.map((value, i) => ({
    value,
    label: [h.statsLabel0, h.statsLabel1, h.statsLabel2, h.statsLabel3][i],
  }));

  return (
    <div style={{ paddingTop: 64 }}>
      {/* ===== HERO ===== */}
      <section
        className="section"
        style={{
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "-5%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="container">
          <div style={{ maxWidth: 720 }}>
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 1rem",
                borderRadius: 999,
                background: "rgba(14,165,233,0.1)",
                border: "1px solid rgba(14,165,233,0.25)",
                marginBottom: "1.75rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--primary)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  display: "inline-block",
                  animation: "pulse-glow 2s infinite",
                }}
              />
              {h.badge}
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: locale === "en" ? "clamp(2rem, 5vw, 4rem)" : "clamp(2.5rem, 6vw, 4rem)",
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                marginBottom: "1.5rem",
                color: "var(--text)",
              }}
            >
              {h.heroTitle1}{" "}
              <span className="gradient-text">{h.heroTitle2}{" "}</span>
              {/* <br /> */}
              {h.heroTitle3}{" "}
              <span style={{ color: "var(--primary)" }}>{h.heroTitle4}</span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "1.15rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                marginBottom: "2.5rem",
                maxWidth: 580,
              }}
            >
              {h.heroSubtitle}
            </p>

            {/* CTA Buttons */}
            <div
              style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}
            >
              <Link href="/doctors" className="btn-primary" style={{ fontSize: "1rem", padding: "0.85rem 2rem" }}>
                {h.ctaBook}
                <span>→</span>
              </Link>
              <Link href="/chat" className="btn-ghost" style={{ fontSize: "1rem", padding: "0.85rem 2rem" }}>
                {h.ctaChat}
              </Link>
            </div>

            {/* Trust indicators */}
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                marginTop: "2.5rem",
                flexWrap: "wrap",
              }}
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "var(--primary)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== DOCTOR CARDS PREVIEW ===== */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div
            style={{
              textAlign: "center",
              marginBottom: "3rem",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "var(--text-dim)",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              {h.teamLabel}
            </div>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.02em",
              }}
            >
              {h.teamTitle1}{" "}
              <span className="gradient-text">{h.teamTitle2}</span>{" "}
              {h.teamTitle3}
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
              marginBottom: "2rem",
            }}
          >
            {DOCTORS_PREVIEW.map((doc, i) => (
              <div
                key={doc.name}
                className="glass"
                style={{
                  padding: "1.5rem",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  animationDelay: `${i * 0.1}s`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 40px rgba(14,165,233,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(99,102,241,0.2))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.75rem",
                    marginBottom: "1rem",
                    border: "1px solid rgba(14,165,233,0.2)",
                  }}
                >
                  {doc.name[0]}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "var(--text)",
                    marginBottom: "0.25rem",
                  }}
                >
                  {doc.name}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--primary)",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  {locale === "vi" ? doc.specialtyVi : doc.specialty}
                </div>
                <div className="stars">
                  {"*".repeat(5)}{" "}
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {doc.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link href="/doctors" className="btn-ghost">
              {h.viewAllDoctors}
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.02em",
                marginBottom: "1rem",
              }}
            >
              {h.featuresTitle1}{" "}
              <span className="gradient-text">{h.featuresTitle2}</span>
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: 500, margin: "0 auto" }}>
              {h.featuresSubtitle}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {h.features.map((feat, i) => (
              <div
                key={i}
                className="glass"
                style={{
                  padding: "1.5rem",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(14,165,233,0.3)";
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(14,22,36,0.9)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(13, 22, 36, 0.8)";
                }}
              >
                <div
                  style={{
                    fontSize: "2rem",
                    marginBottom: "0.85rem",
                    display: "inline-block",
                  }}
                >
                  {feat.icon || ""}
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--text)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {feat.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.65,
                  }}
                >
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI HIGHLIGHT ===== */}
      <section className="section">
        <div className="container">
          <div
            style={{
              background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.08))",
              border: "1px solid rgba(14,165,233,0.2)",
              borderRadius: 24,
              padding: "3rem",
              display: "flex",
              gap: "3rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 280 }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  color: "var(--primary)",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                {h.aiSectionLabel}
              </div>
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  letterSpacing: "-0.02em",
                  marginBottom: "1rem",
                  lineHeight: 1.3,
                }}
              >
                {h.aiSectionTitle1}{" "}
                <span className="gradient-text">{h.aiSectionTitle2}</span>
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  marginBottom: "1.5rem",
                  lineHeight: 1.7,
                  fontSize: "0.95rem",
                }}
              >
                {h.aiSectionDesc}
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link href="/chat" className="btn-primary">
                  {h.aiTryNow}
                </Link>
                <Link href="/doctors" className="btn-ghost">
                  {h.aiViewDoctors}
                </Link>
              </div>
            </div>

            {/* Demo chat bubble */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div
                style={{
                  background: "rgba(5, 11, 20, 0.8)",
                  borderRadius: 16,
                  padding: "1.25rem",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* User message */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      background: "var(--primary)",
                      color: "white",
                      padding: "0.6rem 1rem",
                      borderRadius: "12px 12px 4px 12px",
                      fontSize: "0.85rem",
                      maxWidth: "80%",
                    }}
                  >
                    {h.aiDemoUser}
                  </div>
                </div>

                {/* AI response */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      flexShrink: 0,
                    }}
                  >
                    AI
                  </div>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: "0.6rem 1rem",
                      borderRadius: "12px 12px 12px 4px",
                      fontSize: "0.82rem",
                      color: "var(--text)",
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>TS.BS Nguyễn Văn Hùng</strong>{" "}
                    {h.aiDemoBot1}{" "}
                    <span style={{ color: "var(--primary)" }}>09:00–10:00</span>{" "}
                    {locale === "vi" ? "và" : "and"}{" "}
                    <span style={{ color: "var(--primary)" }}>14:00–15:00</span>.
                    <br /><br />
                    {h.aiDemoBot2}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section" style={{ paddingBottom: "6rem" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: "1.25rem",
              color: "var(--text)",
            }}
          >
            {h.ctaTitle1}{" "}
            <span className="gradient-text">{h.ctaTitle2}</span>
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1.05rem",
              marginBottom: "2.5rem",
              maxWidth: 480,
              margin: "0 auto 2.5rem",
            }}
          >
            {h.ctaSubtitle}
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" className="btn-primary" style={{ fontSize: "1rem", padding: "0.9rem 2.5rem" }}>
              {h.ctaCreateAccount}
            </Link>
            <Link href="/doctors" className="btn-ghost" style={{ fontSize: "1rem", padding: "0.9rem 2.5rem" }}>
              {h.ctaFindDoctor}
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "2rem 1.5rem",
          textAlign: "center",
          color: "var(--text-dim)",
          fontSize: "0.8rem",
        }}
      >
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ fontWeight: 700, color: "var(--text-muted)" }}>
              {h.footerBrand}
            </div>
            <div>{h.footerPowered}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
