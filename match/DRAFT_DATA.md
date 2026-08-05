# DRAFT DỮ LIỆU TỪ 2 ẢNH (cần user xác nhận/sửa tên VĐV)

Trích xuất bằng OCR tiếng Việt (tesseract) từ chia_bang.jpg + lich_thi_dau.jpg.
Cấu trúc KHỚP nhau (4 nhóm, vòng tròn 1 lượt = 6 trận/nhóm, tổng 24 trận).
TÊN VĐV một số chỗ bị nhiễu OCR → đánh dấu ❓ cần confirm.

## NHÓM A (Bảng A)
- A1: Quản Thành Công (nam) — Nguyễn Quý Thanh (nữ)
- A2: Tuấn Đào (nam) — Hà Hồng (nữ)
- A3: Phạm Minh Quang (nam) — Ngọc Quỳnh (nữ)
- A4: Hoàng Nam (nam) — Dương Thị Thu Phương (nữ)

## NHÓM B (Bảng B)
- B1: Đặng Anh Quang (nam) — Thanh Thu (nữ)
- B2: Nguyễn Lộc (nam) — Lê Dung (nữ)
- B3: Linh (nam) — Bùi Thùy Dương (nữ)        ❓ (tên nam "Linh" thiếu họ)
- B4: Nguyên Phương Nam (nam) — An Thanh (nữ)  ❓

## NHÓM C (Bảng C)
- C1: Đại (nam) — Phạm Thị Thu (nữ)            ❓ (tên nam "Đại" thiếu họ)
- C2: Đào Linh (nam) — Dương (nữ)              ❓ (OCR "Đào Văn Trường/Đỗ Linh" ở chia bảng, nhưng lịch ghi "Đào Linh/Dương" → mâu thuẫn)
- C3: Phong Lê (nam) — Dương Minh Ngọc (nữ)    ❓
- C4: Đức Hưng (nam) — Hoa (nữ)                ❓

## NHÓM D (Bảng D)
- D1: Duy Toàn (nam) — Ngân Nguyễn (nữ)        ❓
- D2: Hai An (nam) — Jet Tran (nữ)             ❓
- D3: BT Thức (nam) — Kim Hồng (nữ)            ❓
- D4: Đạt (nam) — Hồng Anh (nữ)                ❓ (OCR chia bảng ghi "Phạm Thanh Tú - Hồng Anh", nhưng lịch L2/L4/L6 ghi "Đạt - Hồng Anh")

## LỊCH VÒNG BẢNG (khớp chia bảng)
Lượt 1: A1-A2, A3-A4, B1-B2, B3-B4
Lượt 2: C1-C2, C3-C4, D1-D2, D3-D4
Lượt 3: A1-A3, A2-A4, B1-B3, B2-B4
Lượt 4: C1-C3, C2-C4, D1-D3, D2-D4
Lượt 5: A1-A4, A2-A3, B1-B4, B2-B3
Lượt 6: C1-C4, C2-C3, D1-D4, D2-D3

## PHÂN HẠNG (từ lịch)
- T25: 2 Đội hạng 4  | T26: 2 Đội hạng 4
- T27: 2 Đội hạng 3  | T28: 2 Đội hạng 3
- T29: 2 Đội hạng 2  | T30: 2 Đội hạng 2
- T31: 2 Đội hạng 1  | T32: 2 Đội hạng 1
- Chung kết phân hạng: Thua T25 vs Thua T26 (H15), Thắng T25 vs Thắng T26 (H13),
  Thua T27 vs Thua T28 (H11), Thắng T27 vs Thắng T28 (H9),
  Thua T29 vs Thua T30 (H7), Thắng T29 vs Thắng T30 (H5),
  Thua T31 vs Thua T32 (H3-4), Thắng T31 vs Thắng T32 (H1-2)

## CẦN USER:
1. Sửa/chính xác hóa TÊN VĐV các chỗ ❓ (paste text từ ảnh gốc là chuẩn nhất).
2. Firebase: chưa login → cần `firebase login` hoặc FIREBASE_TOKEN để deploy + seed.
