"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type Role = "PATIENT" | "DOCTOR";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("PATIENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { t } = useLanguage();
  const r = t.register;

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, label: r.strengthWeak, color: "#ef4444" };
    if (score <= 2) return { level: 2, label: r.strengthFair, color: "#f59e0b" };
    if (score <= 3) return { level: 3, label: r.strengthGood, color: "#3b82f6" };
    return { level: 4, label: r.strengthStrong, color: "#10b981" };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError(r.errorName);
    if (password.length < 6) return setError(r.errorPasswordLength);
    if (password !== confirmPassword) return setError(r.errorPasswordMatch);

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || r.errorDefault);
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError(r.errorServer);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        paddingTop: "5rem",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 30%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(14,165,233,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              margin: "0 auto 1rem",
              boxShadow: "0 0 30px rgba(99,102,241,0.35)",
              animation: "pulse-glow 2s infinite",
            }}
          >
            +
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: "0.4rem",
            }}
          >
            {r.title}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            {r.subtitle}
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div
            className="glass"
            style={{
              padding: "2.5rem",
              textAlign: "center",
              animation: "fadeInUp 0.4s ease",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}></div>
            <h2 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>
              {r.successTitle}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "0.5rem" }}>
              {r.successDesc}
            </p>
            <div className="spinner" style={{ margin: "1rem auto 0", width: 24, height: 24 }} />
          </div>
        ) : (
          <div className="glass" style={{ padding: "2rem" }}>
            {/* Role selection */}
            <div style={{ marginBottom: "1.5rem" }}>
              <p
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-dim)",
                  marginBottom: "0.65rem",
                }}
              >
                {r.roleLabel}
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {(["PATIENT", "DOCTOR"] as Role[]).map((rv) => (
                  <button
                    key={rv}
                    type="button"
                    onClick={() => setRole(rv)}
                    style={{
                      flex: 1,
                      padding: "0.75rem 0.5rem",
                      borderRadius: 10,
                      background:
                        role === rv
                          ? rv === "PATIENT"
                            ? "rgba(14,165,233,0.15)"
                            : "rgba(99,102,241,0.15)"
                          : "rgba(255,255,255,0.04)",
                      border:
                        role === rv
                          ? rv === "PATIENT"
                            ? "1px solid rgba(14,165,233,0.4)"
                            : "1px solid rgba(99,102,241,0.4)"
                          : "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer",
                      color: role === rv ? "var(--text)" : "var(--text-muted)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      transition: "all 0.2s",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "1.4rem", marginBottom: "0.2rem" }}>
                      {rv === "PATIENT" ? "P" : "D"}
                    </div>
                    {rv === "PATIENT" ? r.rolePatient : r.roleDoctor}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: "0.4rem",
                  }}
                >
                  {r.nameLabel}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={r.namePlaceholder}
                  className="input"
                  required
                  autoFocus
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: "0.4rem",
                  }}
                >
                  {r.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={r.emailPlaceholder}
                  className="input"
                  required
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: "0.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: "0.4rem",
                  }}
                >
                  {r.passwordLabel}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={r.passwordPlaceholder}
                    className="input"
                    required
                    style={{ paddingRight: "2.8rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1rem",
                      color: "var(--text-dim)",
                    }}
                  >
                    {showPass ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

              {/* Password strength */}
              {password && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 2,
                          background:
                            i <= strength.level ? strength.color : "rgba(255,255,255,0.1)",
                          transition: "all 0.3s",
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.72rem", color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}

              {/* Confirm Password */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: "0.4rem",
                  }}
                >
                  {r.confirmPasswordLabel}
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={r.confirmPasswordPlaceholder}
                  className="input"
                  required
                  style={{
                    borderColor:
                      confirmPassword && confirmPassword !== password
                        ? "rgba(239,68,68,0.5)"
                        : undefined,
                  }}
                />
                {confirmPassword && confirmPassword !== password && (
                  <p style={{ fontSize: "0.75rem", color: "#f87171", marginTop: "0.3rem" }}>
                    {r.passwordMismatch}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 8,
                    padding: "0.6rem 1rem",
                    fontSize: "0.82rem",
                    color: "#f87171",
                    marginBottom: "1rem",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "0.75rem",
                  fontSize: "0.95rem",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    {r.submitting}
                  </>
                ) : (
                  r.submitBtn
                )}
              </button>
            </form>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                margin: "1.25rem 0",
              }}
            >
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                {r.hasAccount}
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <Link
              href="/login"
              className="btn-ghost"
              style={{ width: "100%", justifyContent: "center", display: "flex" }}
            >
              {r.signInBtn}
            </Link>
          </div>
        )}

        <p
          style={{
            textAlign: "center",
            fontSize: "0.72rem",
            color: "var(--text-dim)",
            marginTop: "1.5rem",
          }}
        >
          {r.terms}
        </p>
      </div>
    </div>
  );
}
