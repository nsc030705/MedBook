"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const DAY_VI_FULL: Record<string, string> = {
  MONDAY: "Thứ 2", TUESDAY: "Thứ 3", WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5", FRIDAY: "Thứ 6", SATURDAY: "Thứ 7", SUNDAY: "Chủ nhật",
};
const DAY_EN_FULL: Record<string, string> = {
  MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday",
};

interface Schedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface Doctor {
  id: string;
  specialty: string;
  hospital: string;
  bio: string;
  experience: number;
  rating: number;
  reviewCount: number;
  fee: number;
  user: { name: string; email: string };
  schedules: Schedule[];
}

export default function DoctorDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { t, locale } = useLanguage();
  const dd = t.doctorDetail;
  const DAY_FULL = locale === "vi" ? DAY_VI_FULL : DAY_EN_FULL;

  useEffect(() => {
    if (params.id) {
      fetch(`/api/doctors/${params.id}`)
        .then((r) => r.json())
        .then((data) => { setDoctor(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  const getNextDateForDay = (dayOfWeek: string): string => {
    const dayMap: Record<string, number> = {
      MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4,
      FRIDAY: 5, SATURDAY: 6, SUNDAY: 0,
    };
    const today = new Date();
    const targetDay = dayMap[dayOfWeek];
    const diff = (targetDay - today.getDay() + 7) % 7 || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toISOString().split("T")[0];
  };

  const handleBook = async () => {
    if (!session) return router.push("/login");
    if (!selectedSchedule || !selectedDate) return setError(dd.selectDate);

    setBooking(true);
    setError("");

    const dateTime = new Date(`${selectedDate}T${selectedSchedule.startTime}:00`);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: doctor!.id,
        scheduleId: selectedSchedule.id,
        date: dateTime.toISOString(),
        reason,
      }),
    });

    if (res.ok) {
      setSuccess(true);
      setBooking(false);
    } else {
      const data = await res.json();
      setError(data.error || dd.bookingTitle);
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div style={{ textAlign: "center", padding: "5rem", paddingTop: "8rem" }}>
        <h1 style={{ color: "var(--text)" }}>{dd.notFound}</h1>
        <Link href="/doctors" className="btn-primary" style={{ display: "inline-flex", marginTop: "1rem" }}>
          {dd.backToList}
        </Link>
      </div>
    );
  }

  const groupedSchedules = DAY_ORDER.reduce(
    (acc, day) => {
      const slots = doctor.schedules.filter((s) => s.dayOfWeek === day);
      if (slots.length > 0) acc[day] = slots;
      return acc;
    },
    {} as Record<string, Schedule[]>
  );

  const initials = doctor.user.name.split(" ").slice(-2).map((w) => w[0]).join("");

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div className="container" style={{ padding: "2rem 1.5rem" }}>
        <Link
          href="/doctors"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          {dd.backToList}
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem" }}>
          {/* Left: Doctor info */}
          <div>
            <div className="glass" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "white",
                    flexShrink: 0,
                    boxShadow: "0 0 30px rgba(14,165,233,0.3)",
                  }}
                >
                  {initials}
                </div>
                <div>
                  <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
                    {doctor.user.name}
                  </h1>
                  <div style={{ color: "var(--primary)", fontWeight: 600, marginBottom: "0.35rem" }}>
                    {doctor.specialty}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    🏥 {doctor.hospital}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text)" }}>
                    <span style={{ color: "#fbbf24" }}>★</span> {doctor.rating}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {doctor.reviewCount} {dd.reviews}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text)" }}>{doctor.experience}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{dd.yearsExp}</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent)" }}>
                    {doctor.fee.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                    {locale === "vi" ? "đ" : " VND"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{dd.fee}</div>
                </div>
              </div>

              {doctor.bio && (
                <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                  {doctor.bio}
                </p>
              )}
            </div>

            {/* Schedule */}
            <div className="glass" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginBottom: "1.25rem" }}>
                📅 {dd.scheduleTitle}
              </h2>
              {Object.keys(groupedSchedules).length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{dd.noSlots}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {Object.entries(groupedSchedules).map(([day, slots]) => (
                    <div key={day} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div
                        style={{
                          width: 90,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          flexShrink: 0,
                        }}
                      >
                        {DAY_FULL[day]}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {slots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => {
                              setSelectedSchedule(slot);
                              setSelectedDate(getNextDateForDay(day));
                            }}
                            style={{
                              padding: "0.35rem 0.75rem",
                              borderRadius: 8,
                              border: "1px solid",
                              borderColor:
                                selectedSchedule?.id === slot.id
                                  ? "rgba(14,165,233,0.6)"
                                  : "rgba(255,255,255,0.1)",
                              background:
                                selectedSchedule?.id === slot.id
                                  ? "rgba(14,165,233,0.2)"
                                  : "rgba(255,255,255,0.04)",
                              color:
                                selectedSchedule?.id === slot.id
                                  ? "var(--primary)"
                                  : "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              transition: "all 0.2s",
                            }}
                          >
                            {slot.startTime} – {slot.endTime}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking form */}
          <div>
            <div className="glass" style={{ padding: "1.5rem", position: "sticky", top: 80 }}>
              {success ? (
                <div style={{ textAlign: "center", padding: "1.5rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
                  <h3 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>
                    {dd.successTitle}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    {dd.successDesc}
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
                    <Link href="/dashboard" className="btn-primary" style={{ justifyContent: "center" }}>
                      {dd.viewDashboard}
                    </Link>
                    <button
                      onClick={() => { setSuccess(false); setSelectedSchedule(null); setReason(""); }}
                      className="btn-ghost"
                      style={{ justifyContent: "center" }}
                    >
                      {dd.bookAnother}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginBottom: "1.25rem" }}>
                    📝 {dd.bookingTitle} {doctor.user.name.split(" ").pop()}
                  </h2>

                  {!session && (
                    <div
                      style={{
                        background: "rgba(14,165,233,0.08)",
                        border: "1px solid rgba(14,165,233,0.2)",
                        borderRadius: 10,
                        padding: "1rem",
                        marginBottom: "1rem",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                        {dd.loginRequired}
                      </p>
                      <Link href="/login" className="btn-primary" style={{ justifyContent: "center" }}>
                        {dd.loginBtn}
                      </Link>
                    </div>
                  )}

                  {selectedSchedule && (
                    <div
                      style={{
                        background: "rgba(14,165,233,0.08)",
                        border: "1px solid rgba(14,165,233,0.2)",
                        borderRadius: 10,
                        padding: "0.75rem 1rem",
                        marginBottom: "1rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>
                        ✅ {DAY_FULL[selectedSchedule.dayOfWeek]} {selectedSchedule.startTime}–{selectedSchedule.endTime}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "0.25rem" }}>
                        {selectedDate && new Date(selectedDate).toLocaleDateString(
                          locale === "vi" ? "vi-VN" : "en-US",
                          { weekday: "long", day: "numeric", month: "long" }
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedSchedule && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                      👆 {dd.selectTime}
                    </p>
                  )}

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                      {dd.selectDate}
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                      {dd.reason}
                    </label>
                    <textarea
                      className="input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={dd.reasonPlaceholder}
                      rows={3}
                      style={{ resize: "none" }}
                    />
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
                    onClick={handleBook}
                    disabled={booking || !selectedSchedule}
                    className="btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "0.75rem",
                      opacity: !selectedSchedule ? 0.5 : 1,
                    }}
                  >
                    {booking ? (
                      <>
                        <div className="spinner" />
                        {dd.booking}
                      </>
                    ) : (
                      dd.confirmBook
                    )}
                  </button>

                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "0.75rem",
                      background: "rgba(16,185,129,0.08)",
                      borderRadius: 8,
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      border: "1px solid rgba(16,185,129,0.15)",
                    }}
                  >
                    💡 {dd.fee}:{" "}
                    <strong style={{ color: "var(--accent)" }}>
                      {doctor.fee.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                      {locale === "vi" ? "đ" : " VND"}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .container > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
