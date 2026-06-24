"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"PATIENT" | "DOCTOR">("PATIENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const { t } = useLanguage();
  const l = t.login;

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError(l.errorEmail);
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      role,
      redirect: false,
    });

    if (result?.error) {
      setError(l.errorCredentials);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const DEMO_ACCOUNTS = [
    { email: "patient@demo.com", role: "PATIENT" as const, label: l.demoPatient, icon: "" },
    { email: "nguyen.van.hung@medbook.vn", role: "DOCTOR" as const, label: l.demoDoctor, icon: "" },
  ];

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
      {/* Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(14,165,233,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              margin: "0 auto 1rem",
              boxShadow: "0 0 30px rgba(14,165,233,0.3)",
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
              marginBottom: "0.5rem",
            }}
          >
            {l.title}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {l.subtitle}
          </p>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding: "2rem" }}>
          {/* Demo accounts */}
          <div style={{ marginBottom: "1.5rem" }}>
            <p
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-dim)",
                marginBottom: "0.75rem",
              }}
            >
              {l.demoLabel}
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => {
                    setEmail(acc.email);
                    setRole(acc.role);
                  }}
                  style={{
                    flex: 1,
                    padding: "0.6rem",
                    borderRadius: 10,
                    background:
                      email === acc.email
                        ? "rgba(14,165,233,0.15)"
                        : "rgba(255,255,255,0.04)",
                    border:
                      email === acc.email
                        ? "1px solid rgba(14,165,233,0.4)"
                        : "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    color: "var(--text)",
                    transition: "all 0.2s",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>{acc.icon}</div>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              {l.orLogin}
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleDemoLogin}>
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
                {l.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={l.emailPlaceholder}
                className="input"
                required
              />
            </div>

            {/* Password */}
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
                {l.passwordLabel}
                <span style={{ fontWeight: 400, color: "var(--text-dim)", marginLeft: 6 }}>
                  {l.passwordHint}
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={l.passwordPlaceholder}
                  className="input"
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
                  {l.signingIn}
                </>
              ) : (
                l.signInBtn
              )}
            </button>
          </form>

          {/* Google OAuth */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              margin: "1.25rem 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{l.orLabel || "hoặc"}</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <button
            id="google-signin-btn"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.65rem",
              padding: "0.7rem 1.25rem",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "var(--text)",
              fontSize: "0.92rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.09)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Google "G" logo */}
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Đăng nhập với Google
          </button>
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            marginTop: "1.25rem",
          }}
        >
          {l.noAccount}{" "}
          <Link
            href="/register"
            style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
          >
            {l.registerLink}
          </Link>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.72rem",
            color: "var(--text-dim)",
            marginTop: "0.75rem",
          }}
        >
          {l.terms}
        </p>
      </div>
    </div>
  );
}
