// Dữ liệu mẫu cho RAG — 15 tài liệu y tế cơ bản
// Dùng để demo chatbot tư vấn y tế mà không cần crawl tài liệu thật

export interface MedicalDocData {
  title: string;
  content: string;
  category: string;
  source?: string;
}

export const MEDICAL_DOCS: MedicalDocData[] = [
  {
    title: "Tăng huyết áp (cao huyết áp)",
    category: "symptom",
    content: `Tăng huyết áp là tình trạng huyết áp trong động mạch cao hơn mức bình thường (≥140/90 mmHg). 
    Triệu chứng: đau đầu, chóng mặt, mờ mắt, tức ngực, khó thở. 
    Nguyên nhân: di truyền, béo phì, ăn mặn, ít vận động, stress, hút thuốc lá.
    Điều trị: thay đổi lối sống (giảm muối, tập thể dục), thuốc hạ áp (ACE inhibitor, beta-blocker, calcium channel blocker).
    Chuyên khoa phù hợp: Tim mạch, Nội khoa tổng quát.
    Bác sĩ nên gặp: Bác sĩ tim mạch hoặc nội khoa nếu huyết áp >140/90.`,
    source: "Hội Tim mạch học Việt Nam",
  },
  {
    title: "Tiểu đường type 2",
    category: "symptom",
    content: `Tiểu đường type 2 là rối loạn chuyển hóa đường huyết mạn tính.
    Triệu chứng: khát nước nhiều, tiểu nhiều, mệt mỏi, mờ mắt, vết thương lâu lành.
    Xét nghiệm chẩn đoán: HbA1c ≥6.5%, đường huyết lúc đói ≥126 mg/dL.
    Điều trị: ăn kiêng, tập thể dục, thuốc Metformin, insulin (khi cần).
    Chuyên khoa phù hợp: Nội tiết, Nội khoa.
    Bác sĩ nên gặp: Bác sĩ nội tiết nếu có các triệu chứng trên.`,
    source: "Hội Đái tháo đường Việt Nam",
  },
  {
    title: "Đau lưng — Nguyên nhân và điều trị",
    category: "symptom",
    content: `Đau lưng là một trong những lý do phổ biến nhất khám bệnh.
    Nguyên nhân thường gặp: thoát vị đĩa đệm, thoái hóa cột sống, căng cơ, viêm khớp.
    Triệu chứng cần cấp cứu: đau lan xuống chân (đau thần kinh tọa), tê liệt, mất kiểm soát tiểu tiện.
    Điều trị: nghỉ ngơi, thuốc giảm đau (NSAID), vật lý trị liệu, trong nặng có thể phẫu thuật.
    Chuyên khoa phù hợp: Cơ xương khớp, Thần kinh, Phẫu thuật cột sống.`,
    source: "Bộ Y tế Việt Nam",
  },
  {
    title: "Viêm dạ dày — Triệu chứng và cách điều trị",
    category: "symptom",
    content: `Viêm dạ dày là viêm lớp niêm mạc dạ dày.
    Nguyên nhân: vi khuẩn H. pylori (phổ biến nhất), rượu bia, NSAID, stress.
    Triệu chứng: đau bụng trên rốn, buồn nôn, nôn, ợ chua, đầy hơi, chán ăn.
    Điều trị: kháng sinh diệt H. pylori (nếu có), thuốc giảm acid (PPI như omeprazole), thay đổi chế độ ăn.
    Chuyên khoa phù hợp: Tiêu hóa, Nội khoa.`,
    source: "Bệnh viện Đại học Y Dược TP.HCM",
  },
  {
    title: "Cúm và cảm lạnh — Phân biệt và điều trị",
    category: "symptom",
    content: `Cúm (Influenza) khác cảm lạnh thông thường:
    Cúm: sốt cao đột ngột (38-40°C), đau cơ nặng, mệt mỏi nhiều, ho khan.
    Cảm lạnh: sổ mũi, đau họng nhẹ, ít sốt, hồi phục sau 1-2 tuần.
    Điều trị cúm: Tamiflu (trong 48h đầu), nghỉ ngơi, uống nhiều nước, hạ sốt.
    Tiêm vaccine cúm mỗi năm để phòng ngừa.
    Chuyên khoa: Hô hấp, Nội khoa, Nhi (trẻ em).`,
    source: "Cục Y tế Dự phòng",
  },
  {
    title: "Chuyên khoa Tim mạch — Khi nào cần gặp bác sĩ?",
    category: "specialty",
    content: `Chuyên khoa Tim mạch điều trị các bệnh về tim và mạch máu.
    Cần gặp bác sĩ tim mạch khi: đau ngực, khó thở, hồi hộp, chóng mặt, ngất xỉu, phù chân.
    Các bệnh thường gặp: tăng huyết áp, nhồi máu cơ tim, suy tim, rối loạn nhịp tim, bệnh van tim.
    Xét nghiệm thường làm: ECG, siêu âm tim, xét nghiệm máu (troponin, lipid máu), X-quang ngực.
    Thời gian khám: 30-60 phút cho lần đầu.`,
    source: "Hội Tim mạch học Việt Nam",
  },
  {
    title: "Chuyên khoa Nhi — Chăm sóc sức khỏe trẻ em",
    category: "specialty",
    content: `Chuyên khoa Nhi chuyên về sức khỏe trẻ từ sơ sinh đến 18 tuổi.
    Cần đưa trẻ đến bác sĩ khi: sốt cao >38.5°C (trẻ <3 tháng: >38°C), khó thở, co giật, nôn nhiều, tiêu chảy, phát ban.
    Lịch tiêm chủng: theo lịch của Chương trình TCMR Quốc gia.
    Khám định kỳ: 1 tuần, 1 tháng, 2 tháng, 4 tháng, 6 tháng, 9 tháng, 12 tháng, sau đó hàng năm.`,
    source: "Bộ Y tế Việt Nam",
  },
  {
    title: "Chuyên khoa Sản phụ khoa",
    category: "specialty",
    content: `Chuyên khoa Sản phụ khoa chăm sóc sức khỏe phụ nữ và thai sản.
    Khám thai định kỳ: tháng 1-7 mỗi tháng 1 lần, tháng 8-9 mỗi 2 tuần, tháng 10 mỗi tuần.
    Các mốc siêu âm quan trọng: 12 tuần (siêu âm NT), 20-22 tuần (hình thái), 30-32 tuần (tăng trưởng).
    Phụ nữ không mang thai nên khám phụ khoa định kỳ 6-12 tháng/lần.
    Các bệnh thường gặp: viêm âm đạo, u xơ tử cung, u nang buồng trứng, rối loạn kinh nguyệt.`,
    source: "Hội Sản Phụ khoa Việt Nam",
  },
  {
    title: "Chuyên khoa Da liễu",
    category: "specialty",
    content: `Chuyên khoa Da liễu điều trị bệnh về da, tóc, móng.
    Các bệnh phổ biến: mụn trứng cá, eczema/chàm, vảy nến, nấm da, viêm da tiếp xúc, rụng tóc.
    Cần gặp bác sĩ da liễu khi: nốt ruồi thay đổi hình dạng, màu sắc; phát ban không rõ nguyên nhân; mụn điều trị không khỏi sau 3 tháng.
    Điều trị: tùy bệnh — kem bôi, thuốc uống, laser, ánh sáng trị liệu.`,
    source: "Bệnh viện Da liễu TP.HCM",
  },
  {
    title: "Chuyên khoa Thần kinh",
    category: "specialty",
    content: `Chuyên khoa Thần kinh điều trị bệnh về não, tủy sống, dây thần kinh.
    Cần gặp bác sĩ thần kinh khi: đau đầu dữ dội bất thường, chóng mặt thường xuyên, tê liệt một bên mặt/tay/chân, nói khó, co giật, mất trí nhớ.
    Dấu hiệu đột quỵ (FAST): Face (mặt méo), Arms (yếu tay), Speech (nói khó), Time (gọi cấp cứu 115).
    Các bệnh thường gặp: đau đầu migraine, động kinh, Parkinson, Alzheimer, đột quỵ.`,
    source: "Hội Thần kinh học Việt Nam",
  },
  {
    title: "Hướng dẫn đặt lịch khám bệnh hiệu quả",
    category: "general",
    content: `Hướng dẫn đặt lịch khám bệnh:
    1. Chọn chuyên khoa phù hợp với triệu chứng của bạn.
    2. Chuẩn bị: hồ sơ bệnh án cũ, danh sách thuốc đang dùng, mô tả triệu chứng rõ ràng.
    3. Đặt lịch trước 1-3 ngày cho bác sĩ chuyên khoa, có thể đặt cùng ngày với nội khoa.
    4. Đến trước giờ hẹn 15-30 phút để làm thủ tục.
    5. Nhịn ăn 8-12 tiếng nếu cần xét nghiệm máu.
    Hệ thống này cho phép đặt lịch online 24/7, chọn bác sĩ và giờ phù hợp.`,
    source: "Hệ thống MedBook",
  },
  {
    title: "Các xét nghiệm máu cơ bản và ý nghĩa",
    category: "general",
    content: `Xét nghiệm máu tổng quát (CBC): kiểm tra hồng cầu, bạch cầu, tiểu cầu — phát hiện thiếu máu, nhiễm trùng.
    Đường huyết lúc đói: <100 mg/dL (bình thường), 100-125 (tiền đái tháo đường), ≥126 (đái tháo đường).
    Cholesterol: LDL <100 mg/dL (lý tưởng), HDL >60 mg/dL (tốt).
    Chức năng gan (ALT, AST): bình thường <40 U/L.
    Chức năng thận (creatinine): nam 0.7-1.3 mg/dL, nữ 0.6-1.1 mg/dL.
    Nên xét nghiệm tổng quát định kỳ 1 lần/năm sau 30 tuổi.`,
    source: "Bộ Y tế Việt Nam",
  },
  {
    title: "Khẩn cấp y tế — Khi nào cần gọi cấp cứu 115",
    category: "general",
    content: `Gọi cấp cứu 115 ngay khi có:
    - Đau ngực dữ dội, lan ra tay trái (nghi nhồi máu cơ tim)
    - Khó thở đột ngột, môi tím
    - Đột quỵ: mặt méo, liệt tay chân, nói khó
    - Co giật kéo dài >5 phút
    - Chấn thương nặng, chảy máu nhiều
    - Mất ý thức
    - Phản ứng dị ứng nặng (sốc phản vệ): sưng phù, khó thở sau ăn/tiêm
    Số cấp cứu: 115 (toàn quốc), 1800 599 920 (đường dây y tế hỗ trợ COVID).`,
    source: "Bộ Y tế Việt Nam",
  },
  {
    title: "Dinh dưỡng và sức khỏe — Nguyên tắc cơ bản",
    category: "general",
    content: `Chế độ ăn lành mạnh theo khuyến cáo:
    - Rau củ quả: ≥400g/ngày (≥5 phần)
    - Protein: cá, đậu, thịt nạc — hạn chế thịt đỏ <500g/tuần
    - Ngũ cốc nguyên hạt thay cơm trắng/bánh mì trắng
    - Hạn chế muối: <5g/ngày (1 thìa cà phê)
    - Hạn chế đường: <50g/ngày
    - Uống nước: 2-2.5 lít/ngày
    - Vận động: ≥150 phút/tuần hoạt động mức trung bình
    - Không hút thuốc, hạn chế rượu bia.`,
    source: "Viện Dinh dưỡng Quốc gia",
  },
  {
    title: "Sức khỏe tâm thần — Stress và lo âu",
    category: "symptom",
    content: `Stress và lo âu là tình trạng phổ biến cần được quan tâm.
    Triệu chứng lo âu: lo lắng quá mức, khó ngủ, tim đập nhanh, đổ mồ hôi, khó tập trung.
    Triệu chứng trầm cảm: buồn bã kéo dài >2 tuần, mất hứng thú, mất ngủ hoặc ngủ nhiều, mất cảm giác thèm ăn.
    Điều trị: tâm lý trị liệu (CBT), thuốc (SSRI/SNRI), thay đổi lối sống.
    Chuyên khoa: Tâm thần, Tâm lý lâm sàng.
    Đường dây hỗ trợ sức khỏe tâm thần: 1800 599 920 (miễn phí, 24/7).`,
    source: "Bệnh viện Tâm thần TW",
  },
];

export const SPECIALTIES = [
  "Tim mạch",
  "Nội khoa",
  "Nhi",
  "Sản phụ khoa",
  "Da liễu",
  "Thần kinh",
  "Cơ xương khớp",
  "Tiêu hóa",
  "Nội tiết",
  "Hô hấp",
  "Tai Mũi Họng",
  "Mắt",
  "Răng Hàm Mặt",
  "Tâm thần",
  "Phẫu thuật tổng quát",
];
