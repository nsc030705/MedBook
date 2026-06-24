"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code style='background:rgba(14,165,233,0.15);padding:1px 5px;border-radius:3px;font-size:0.82em;color:#7dd3fc'>$1</code>")
    .replace(/\n/g, "<br/>");
}

export function ChatWidget() {
  const { data: session } = useSession();
  const { t, locale } = useLanguage();
  const c = t.chat;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const welcome = useCallback((): Message => ({
    role: "assistant",
    content: c.welcomeContent(session?.user?.name ?? ""),
  }), [session, c]);

  // Init welcome message
  useEffect(() => {
    if (session && messages.length === 0) {
      setMessages([welcome()]);
    }
  }, [session, messages.length, welcome]);

  // Re-generate welcome when locale changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") return [welcome()];
      return prev;
    });
  }, [c, welcome]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading || !session) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          message: text,
          sessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 401 = session expired / user not found in DB
        const errMsg = res.status === 401
          ? "Phiên đăng nhập đã hết hạn. Vui lòng **đăng xuất và đăng nhập lại** để tiếp tục sử dụng chatbot."
          : (data.error || c.errorGeneral);
        setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
      } else {
        if (data.sessionId) setSessionId(data.sessionId);
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.response || c.errorGeneral,
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: c.errorConnect,
      }]);
    }
    setLoading(false);
  };

  const SUGGESTIONS_WIDGET = locale === "vi"
    ? ["Bác sĩ tim mạch có lịch không?", "Tư vấn chọn chuyên khoa"]
    : ["Is a cardiologist available?", "Which specialty should I see?"];

  return (
    <>
      {/* Floating button */}
      <button
        id="chat-widget-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label="Mở chat AI"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg, #6366f1, #0ea5e9)"
            : "linear-gradient(135deg, #0ea5e9, #6366f1)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(14,165,233,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.4rem",
          transition: "all 0.3s ease",
          transform: open ? "scale(1.05)" : "scale(1)",
          animation: open ? "none" : "pulse-glow 2.5s infinite",
        }}
      >
        {open ? "✕" : "AI"}
      </button>

      {/* Widget panel */}
      <div
        style={{
          position: "fixed",
          bottom: "5rem",
          right: "1.5rem",
          zIndex: 9998,
          width: 360,
          maxHeight: 520,
          borderRadius: 16,
          background: "rgba(8, 15, 26, 0.97)",
          border: "1px solid rgba(14,165,233,0.25)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(14,165,233,0.1)",
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transformOrigin: "bottom right",
          opacity: open ? 1 : 0,
          transform: open ? "scale(1) translateY(0)" : "scale(0.85) translateY(20px)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              flexShrink: 0,
              animation: "pulse-glow 2s infinite",
            }}
          >
            AI
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>
              MedBot AI
            </div>
            </div>
          </div>
          <Link
            href="/chat"
            style={{
              fontSize: "0.7rem",
              color: "var(--primary)",
              textDecoration: "none",
              padding: "3px 8px",
              borderRadius: 5,
              background: "rgba(14,165,233,0.1)",
              border: "1px solid rgba(14,165,233,0.2)",
              whiteSpace: "nowrap",
            }}
          >
            Mở rộng ↗
          </Link>
        </div>

        {/* Not logged in */}
        {!session ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}></div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: 1.6 }}>
              Đăng nhập để chat với MedBot AI
            </p>
            <Link href="/login" className="btn-primary" style={{ padding: "0.5rem 1.5rem", fontSize: "0.85rem" }}>
              Đăng nhập
            </Link>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    gap: "0.4rem",
                    alignItems: "flex-start",
                  }}
                >
                  {msg.role === "assistant" && (
                    <div
                      style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", flexShrink: 0, marginTop: 2,
                      }}
                    >
                      AI
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "0.55rem 0.85rem",
                      borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                      background: msg.role === "user"
                        ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                        : "rgba(255,255,255,0.06)",
                      border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                      color: "var(--text)",
                      fontSize: "0.8rem",
                      lineHeight: 1.6,
                    }}
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                  />
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", flexShrink: 0,
                  }}>
                    AI
                  </div>
                  <div style={{
                    padding: "0.55rem 0.85rem",
                    borderRadius: "12px 12px 12px 4px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", gap: "0.25rem", alignItems: "center",
                  }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="typing-dot" style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "var(--primary)", opacity: 0.3,
                        animationDelay: `${i * 0.2}s`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && (
              <div style={{ padding: "0 0.75rem 0.5rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {SUGGESTIONS_WIDGET.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      padding: "0.3rem 0.65rem",
                      borderRadius: 6,
                      background: "rgba(14,165,233,0.08)",
                      border: "1px solid rgba(14,165,233,0.2)",
                      color: "var(--primary)",
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      fontWeight: 500,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                padding: "0.65rem 0.75rem",
                display: "flex",
                gap: "0.5rem",
                flexShrink: 0,
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder={locale === "vi" ? "Hỏi MedBot..." : "Ask MedBot..."}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "0.5rem 0.75rem",
                  color: "var(--text)",
                  fontSize: "0.82rem",
                  outline: "none",
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                    : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.9rem", flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {loading ? <div className="spinner" style={{ width: 12, height: 12 }} /> : "↑"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
