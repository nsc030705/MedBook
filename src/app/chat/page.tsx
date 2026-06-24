"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  _count: { messages: number };
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code style='background:rgba(14,165,233,0.15);padding:1px 6px;border-radius:4px;font-size:0.85em;color:#7dd3fc'>$1</code>")
    .replace(/\n/g, "<br/>");
}

function timeAgo(dateStr: string, c: ReturnType<typeof useLanguage>["t"]["chat"]): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return c.timeJustNow;
  if (diff < 3600) return `${Math.floor(diff / 60)} ${c.timeMinutes}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${c.timeHours}`;
  return `${Math.floor(diff / 86400)} ${c.timeDays}`;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const c = t.chat;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (Array.isArray(data)) setSessions(data);
    } catch {
      /* ignore */
    }
    setSessionsLoading(false);
  }, []);

  useEffect(() => {
    if (session) loadSessions();
  }, [session, loadSessions]);

  const getWelcomeMessage = useCallback((): Message => ({
    role: "assistant",
    content: c.welcomeContent(session?.user?.name ?? ""),
    timestamp: new Date(),
  }), [session, c]);

  useEffect(() => {
    if (session && messages.length === 0) {
      setMessages([getWelcomeMessage()]);
    }
  }, [session, messages.length, getWelcomeMessage]);

  // Re-generate welcome message when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [getWelcomeMessage()];
      }
      return prev;
    });
  }, [c, getWelcomeMessage]);

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([getWelcomeMessage()]);
    setInput("");
  };

  const loadSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        const msgs: Message[] = data.messages.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.createdAt),
        }));
        setMessages(msgs);
        setCurrentSessionId(sessionId);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) startNewChat();
    } catch {
      /* ignore */
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
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
          sessionId: currentSessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = res.status === 401
          ? "Phiên đăng nhập đã hết hạn. Vui lòng **đăng xuất và đăng nhập lại** để tiếp tục sử dụng chatbot."
          : (data.error || c.errorGeneral);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errMsg, timestamp: new Date() },
        ]);
      } else {
        if (data.sessionId && !currentSessionId) {
          setCurrentSessionId(data.sessionId);
          loadSessions();
        } else if (data.sessionId) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === data.sessionId
                ? { ...s, updatedAt: new Date().toISOString(), _count: { messages: s._count.messages + 2 } }
                : s
            )
          );
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response || c.errorGeneral,
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: c.errorConnect,
          timestamp: new Date(),
        },
      ]);
    }

    setLoading(false);
  };

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 64, height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Sidebar */}
        <div
          style={{
            width: sidebarOpen ? 260 : 0,
            minWidth: sidebarOpen ? 260 : 0,
            transition: "all 0.3s ease",
            overflow: "hidden",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(5,11,20,0.95)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sidebar header */}
          <div style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={startNewChat}
              style={{
                width: "100%",
                padding: "0.55rem 0.85rem",
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))",
                border: "1px solid rgba(14,165,233,0.25)",
                color: "var(--primary)",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s",
              }}
            >
              {c.newChat}
            </button>
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
            {sessionsLoading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-dim)", fontSize: "0.8rem" }}>
                <div className="spinner" style={{ margin: "0 auto 0.5rem", width: 20, height: 20 }} />
                {c.loading}
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-dim)", fontSize: "0.78rem" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}></div>
                {c.noHistory}
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  style={{
                    padding: "0.6rem 0.75rem",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: currentSessionId === s.id ? "rgba(14,165,233,0.12)" : "transparent",
                    border: currentSessionId === s.id ? "1px solid rgba(14,165,233,0.2)" : "1px solid transparent",
                    marginBottom: "0.2rem",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    position: "relative",
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    if (currentSessionId !== s.id) {
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                    }
                    const btn = e.currentTarget.querySelector(".del-btn") as HTMLElement;
                    if (btn) btn.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    if (currentSessionId !== s.id) {
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    }
                    const btn = e.currentTarget.querySelector(".del-btn") as HTMLElement;
                    if (btn) btn.style.opacity = "0";
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "0.78rem",
                      fontWeight: 500,
                      color: currentSessionId === s.id ? "var(--primary)" : "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>
                      {s._count.messages} {c.msgs} · {timeAgo(s.updatedAt, c)}
                    </div>
                  </div>
                  <button
                    className="del-btn"
                    onClick={(e) => deleteSession(s.id, e)}
                    style={{
                      opacity: 0,
                      background: "none",
                      border: "none",
                      color: "var(--text-dim)",
                      cursor: "pointer",
                      padding: "2px 4px",
                      fontSize: "0.8rem",
                      borderRadius: 4,
                      flexShrink: 0,
                      transition: "opacity 0.15s",
                    }}
                    title={c.deleteConversation}
                  >
                    X
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div
            style={{
              background: "rgba(5, 11, 20, 0.9)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              padding: "0.75rem 1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            {/* Toggle sidebar */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "0.35rem 0.5rem",
                fontSize: "0.85rem",
                flexShrink: 0,
              }}
              title={sidebarOpen ? c.hideSidebar : c.showSidebar}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>

            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                animation: "pulse-glow 2s infinite",
                flexShrink: 0,
              }}
            >
              AI
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.95rem" }}>MedBot AI</div>
              <div style={{ fontSize: "0.72rem", color: "var(--accent)" }}>
              </div>
            </div>
            <Link href="/doctors" className="btn-ghost" style={{ fontSize: "0.8rem", padding: "0.35rem 0.85rem" }}>
              {c.viewDoctors}
            </Link>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              maxWidth: 800,
              width: "100%",
              margin: "0 auto",
              alignSelf: "center",
              boxSizing: "border-box",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                  animation: "fadeInUp 0.3s ease",
                }}
              >
                {msg.role === "assistant" && (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    AI
                  </div>
                )}

                <div
                  style={{
                    maxWidth: "75%",
                    padding: "0.75rem 1.1rem",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                        : "rgba(255,255,255,0.05)",
                    border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                    color: "var(--text)",
                    fontSize: "0.88rem",
                    lineHeight: 1.65,
                  }}
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                />

                {msg.role === "user" && session?.user?.name && (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {session.user.name[0].toUpperCase()}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  AI
                </div>
                <div
                  style={{
                    padding: "0.85rem 1.1rem",
                    borderRadius: "16px 16px 16px 4px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="typing-dot"
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--primary)",
                        opacity: 0.3,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div
              style={{
                padding: "0 1.5rem 0.75rem",
                maxWidth: 800,
                width: "100%",
                margin: "0 auto",
                alignSelf: "center",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-dim)",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {c.suggestionsLabel}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {c.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: 8,
                      background: "rgba(14,165,233,0.08)",
                      border: "1px solid rgba(14,165,233,0.2)",
                      color: "var(--primary)",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(14,165,233,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(14,165,233,0.08)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div
            style={{
              background: "rgba(5, 11, 20, 0.9)",
              backdropFilter: "blur(20px)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "1rem 1.5rem",
            }}
          >
            <div
              style={{
                maxWidth: 800,
                margin: "0 auto",
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-end",
              }}
            >
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder={c.inputPlaceholder}
                  className="input"
                  rows={1}
                  style={{
                    resize: "none",
                    paddingRight: "3rem",
                    maxHeight: 120,
                    overflowY: "auto",
                  }}
                />
              </div>
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background:
                    input.trim() && !loading
                      ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                      : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : "↑"}
              </button>
            </div>
            <div
              style={{
                maxWidth: 800,
                margin: "0.4rem auto 0",
                fontSize: "0.68rem",
                color: "var(--text-dim)",
                textAlign: "center",
              }}
            >
              {c.disclaimer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
