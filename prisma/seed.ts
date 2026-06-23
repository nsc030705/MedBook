// Seed data — 5 bác sĩ mẫu + lịch làm việc
// Chạy: npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MEDICAL_DOCS } from "../src/data/medical-docs";

const prisma = new PrismaClient();

const DOCTORS_DATA = [
  {
    email: "nguyen.van.hung@medbook.vn",
    name: "TS.BS Nguyễn Văn Hùng",
    specialty: "Tim mạch",
    hospital: "Bệnh viện Đại học Y Dược TP.HCM",
    bio: "Chuyên gia tim mạch can thiệp với hơn 15 năm kinh nghiệm. Từng tu nghiệp tại Pháp và Hoa Kỳ. Chuyên điều trị tăng huyết áp, suy tim, bệnh mạch vành.",
    experience: 15,
    rating: 4.9,
    reviewCount: 234,
    fee: 350000,
    avatarUrl: null,
  },
  {
    email: "tran.thi.mai@medbook.vn",
    name: "PGS.TS Trần Thị Mai",
    specialty: "Nội tiết",
    hospital: "Bệnh viện Bạch Mai Hà Nội",
    bio: "Phó Giáo sư, Tiến sĩ Nội tiết. Chuyên điều trị tiểu đường, bệnh tuyến giáp, rối loạn hormon. Tác giả của nhiều công trình nghiên cứu quốc tế.",
    experience: 20,
    rating: 4.8,
    reviewCount: 189,
    fee: 400000,
    avatarUrl: null,
  },
  {
    email: "le.minh.duc@medbook.vn",
    name: "BS.CKI Lê Minh Đức",
    specialty: "Thần kinh",
    hospital: "Bệnh viện Chợ Rẫy",
    bio: "Chuyên khoa I Thần kinh. Điều trị đau đầu migraine, đột quỵ, Parkinson, động kinh. Có kinh nghiệm sử dụng EMG và EEG trong chẩn đoán.",
    experience: 10,
    rating: 4.7,
    reviewCount: 156,
    fee: 280000,
    avatarUrl: null,
  },
  {
    email: "pham.thi.lan@medbook.vn",
    name: "BS.CKII Phạm Thị Lan",
    specialty: "Sản phụ khoa",
    hospital: "Bệnh viện Từ Dũ",
    bio: "Chuyên khoa II Sản Phụ khoa. Chuyên về thai sản nguy cơ cao, siêu âm thai kỳ, điều trị vô sinh. Hơn 12 năm kinh nghiệm tại Bệnh viện Từ Dũ.",
    experience: 12,
    rating: 4.9,
    reviewCount: 312,
    fee: 300000,
    avatarUrl: null,
  },
  {
    email: "hoang.van.nam@medbook.vn",
    name: "BS Hoàng Văn Nam",
    specialty: "Nội khoa",
    hospital: "Phòng Khám Đa Khoa Quốc Tế Hà Nội",
    bio: "Bác sĩ Nội khoa tổng quát. Chuyên khám và điều trị các bệnh nội khoa thông thường: hô hấp, tiêu hóa, cơ xương khớp. Thân thiện và tận tâm với bệnh nhân.",
    experience: 7,
    rating: 4.6,
    reviewCount: 98,
    fee: 200000,
    avatarUrl: null,
  },
  // --- BÁC SĨ TỪ BỆNH VIỆN ĐẠI HỌC Y HÀ NỘI ---
  {
    email: "nguyen.trung.dung@medbook.vn",
    name: "PGS.TS Nguyễn Trung Dũng",
    specialty: "Tiêu hóa",
    hospital: "Bệnh viện Đại học Y Hà Nội",
    bio: "Chuyên gia Tiêu hóa - Gan mật hàng đầu, giảng viên Trường Đại học Y Hà Nội. Hơn 18 năm kinh nghiệm nội soi can thiệp, điều trị viêm dạ dày, đại tràng, trào ngược.",
    experience: 18,
    rating: 4.8,
    reviewCount: 142,
    fee: 300000,
    avatarUrl: null,
  },
  {
    email: "le.thi.hoai.an@medbook.vn",
    name: "TS.BS Lê Thị Hoài An",
    specialty: "Da liễu",
    hospital: "Bệnh viện Đại học Y Hà Nội",
    bio: "Tiến sĩ Da liễu, chuyên sâu về điều trị mụn trứng cá nặng, sẹo rỗ, nám da, chàm, vảy nến và phục hồi da hư tổn do corticoid.",
    experience: 12,
    rating: 4.9,
    reviewCount: 205,
    fee: 250000,
    avatarUrl: null,
  },
  {
    email: "nguyen.minh.tuan@medbook.vn",
    name: "ThS.BS Nguyễn Minh Tuấn",
    specialty: "Tai Mũi Họng",
    hospital: "Bệnh viện Đại học Y Hà Nội",
    bio: "Thạc sĩ chuyên khoa Tai Mũi Họng, giảng viên lâm sàng Đại học Y Hà Nội. Chuyên điều trị viêm xoang, viêm tai giữa, khàn tiếng và phẫu thuật nội soi TMH.",
    experience: 8,
    rating: 4.7,
    reviewCount: 88,
    fee: 220000,
    avatarUrl: null,
  },
  {
    email: "tran.hoang.giang@medbook.vn",
    name: "TS.BS Trần Hoàng Giang",
    specialty: "Cơ xương khớp",
    hospital: "Bệnh viện Đại học Y Hà Nội",
    bio: "Chuyên gia Cơ xương khớp nổi tiếng, chuyên điều trị thoát vị đĩa đệm, thoái hóa khớp, gút, loãng xương và tiêm khớp dưới hướng dẫn của siêu âm.",
    experience: 14,
    rating: 4.8,
    reviewCount: 167,
    fee: 320000,
    avatarUrl: null,
  },
];

const SCHEDULE_SLOTS = [
  { dayOfWeek: "MONDAY" as const, startTime: "08:00", endTime: "09:00" },
  { dayOfWeek: "MONDAY" as const, startTime: "09:00", endTime: "10:00" },
  { dayOfWeek: "MONDAY" as const, startTime: "14:00", endTime: "15:00" },
  { dayOfWeek: "TUESDAY" as const, startTime: "08:00", endTime: "09:00" },
  { dayOfWeek: "TUESDAY" as const, startTime: "10:00", endTime: "11:00" },
  { dayOfWeek: "WEDNESDAY" as const, startTime: "09:00", endTime: "10:00" },
  { dayOfWeek: "WEDNESDAY" as const, startTime: "14:00", endTime: "15:00" },
  { dayOfWeek: "THURSDAY" as const, startTime: "08:00", endTime: "09:00" },
  { dayOfWeek: "THURSDAY" as const, startTime: "15:00", endTime: "16:00" },
  { dayOfWeek: "FRIDAY" as const, startTime: "08:00", endTime: "09:00" },
  { dayOfWeek: "FRIDAY" as const, startTime: "09:00", endTime: "10:00" },
  { dayOfWeek: "SATURDAY" as const, startTime: "08:00", endTime: "09:00" },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.medicalDoc.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: {
      email: "admin@medbook.vn",
      name: "Admin MedBook",
      password: adminHash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Created admin: admin@medbook.vn");

  // Create sample patient user
  const patientUser = await prisma.user.create({
    data: {
      email: "patient@demo.com",
      name: "Nguyễn Văn An",
      role: "PATIENT",
      isActive: true,
    },
  });

  console.log("✅ Created demo patient:", patientUser.email);

  // Create doctors
  for (const doctorData of DOCTORS_DATA) {
    const { email, name, specialty, hospital, bio, experience, rating, reviewCount, fee } = doctorData;

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: "DOCTOR",
      },
    });

    // Create doctor profile
    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        specialty,
        hospital,
        bio,
        experience,
        rating,
        reviewCount,
        fee,
        isVerified: true,
      },
    });

    // Create schedules — random subset per doctor
    const slotCount = 6 + Math.floor(Math.random() * 4);
    const slots = SCHEDULE_SLOTS.slice(0, slotCount);

    for (const slot of slots) {
      await prisma.schedule.create({
        data: {
          doctorId: doctor.id,
          ...slot,
          isAvailable: true,
        },
      });
    }

    console.log(`✅ Created doctor: ${name} (${specialty}) with ${slotCount} schedule slots`);
  }

  // Seed medical docs for RAG
  for (const doc of MEDICAL_DOCS) {
    await prisma.medicalDoc.create({ data: doc });
  }
  console.log(`✅ Seeded ${MEDICAL_DOCS.length} medical documents for RAG`);

  console.log("\n🎉 Seed completed successfully!");
  console.log("Demo login credentials:");
  console.log("  Admin:   admin@medbook.vn     / admin123  (role: ADMIN)");
  console.log("  Patient: patient@demo.com               (role: PATIENT — no password)");
  console.log("  Doctor:  nguyen.van.hung@medbook.vn     (role: DOCTOR — no password)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
