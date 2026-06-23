import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import { ChatWidget } from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "MedBook — Book Medical Appointments Online",
  description:
    "Smart medical appointment system with AI chatbot support 24/7. Find doctors, book appointments, health consultation — fast and convenient.",
  keywords: "book medical appointment, doctor online, medical consultation, AI chatbot, appointments",
  openGraph: {
    title: "MedBook — Book Medical Appointments Online",
    description: "Smart medical appointment system with AI chatbot",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-animated min-h-screen">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
