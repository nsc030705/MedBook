"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, locale, toggleLocale } = useLanguage();

  const role = (session?.user as any)?.role;

  const navLinks = [
    { href: "/doctors", label: t.nav.doctors },
    { href: "/dashboard", label: t.nav.appointments },
    { href: "/chat", label: t.nav.aiChat },
    ...(role === "DOCTOR" ? [{ href: "/doctor-profile", label: locale === "vi" ? "Hồ sơ BS" : "My Profile" }] : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "🛡️ Admin" }] : []),
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(5, 11, 20, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            fontSize: "1.2rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
            }}
          >
            🏥
          </span>
          <span className="gradient-text">MedBook</span>
        </Link>

        {/* Desktop Nav */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
          className="hidden-mobile"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
                transition: "all 0.2s",
                color:
                  pathname === link.href ? "var(--primary)" : "var(--text-muted)",
                background:
                  pathname === link.href
                    ? "rgba(14,165,233,0.1)"
                    : "transparent",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: Language toggle + Auth */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Language toggle */}
          <button
            id="lang-toggle"
            onClick={toggleLocale}
            title={t.settings.language}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.3rem 0.7rem",
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              transition: "all 0.2s",
              color: "var(--text-muted)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(14,165,233,0.15)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(14,165,233,0.4)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-muted)";
            }}
          >
            🌐
            <span
              style={{
                color: locale === "vi" ? "var(--primary)" : "var(--text-muted)",
                transition: "color 0.2s",
              }}
            >
              VI
            </span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span
              style={{
                color: locale === "en" ? "var(--primary)" : "var(--text-muted)",
                transition: "color 0.2s",
              }}
            >
              EN
            </span>
          </button>

          {/* Auth buttons */}
          {session ? (
            <>
              <Link
                href="/dashboard"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.35rem 0.85rem",
                  borderRadius: 8,
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    "👤"
                  )}
                </span>
                <span className="hidden-mobile">{session.user?.name?.split(" ").pop()}</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-ghost"
                style={{ padding: "0.35rem 0.85rem", fontSize: "0.85rem" }}
              >
                {t.nav.signOut}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost" style={{ padding: "0.45rem 1rem", fontSize: "0.875rem" }}>
                {t.nav.signIn}
              </Link>
              <Link href="/login" className="btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.875rem" }}>
                {t.nav.bookNow}
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
