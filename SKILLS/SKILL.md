---
name: tournament-web-ui
description: Skill chuyên dụng cho lập trình và thiết kế giao diện web frontend cho các giải đấu (tournament, esports, competition). Sử dụng Node.js, CSS, Python. Kích hoạt khi user yêu cầu tạo trang web giải đấu, bảng xếp hạng, bracket, lịch thi đấu, trang đội/player, hoặc bất kỳ UI liên quan đến tournament/esports/competition.
---

# Tournament Web UI – Skill Hướng Dẫn Thiết Kế & Phát Triển

Skill này cung cấp hướng dẫn chi tiết để xây dựng giao diện web frontend **cao cấp, hiện đại** cho các giải đấu (tournament, esports, competition). Mọi sản phẩm phải đạt chất lượng **production-grade**, lấy cảm hứng từ các nền tảng hàng đầu như Riot Games LoL Esports, FACEIT, Battlefy, Challonge, và start.gg.

---

## Khi Nào Kích Hoạt Skill Này

Kích hoạt khi user đề cập đến:
- Tạo trang web giải đấu / tournament / esports / competition
- Thiết kế bracket / bảng xếp hạng / leaderboard / standings
- Giao diện lịch thi đấu / schedule / match results
- Trang profile đội / player / team roster
- Dashboard ban tổ chức / admin panel cho giải đấu
- Landing page / hero section cho sự kiện esports
- Live score / match ticker / real-time updates
- Registration form / đăng ký tham gia giải đấu

---

## Nguyên Tắc Thiết Kế Cốt Lõi

### 1. Phong Cách Thị Giác (Visual Identity)

- **Dark mode là mặc định** – Esports/gaming UI luôn ưu tiên dark theme
- **Bảng màu chủ đạo**: Nền tối (#0a0a0f, #111827, #1a1a2e), accent neon/vibrant (cyan #00e5ff, magenta #ff00e5, electric blue #3b82f6, emerald #10b981, amber #f59e0b)
- **Gradient động**: Sử dụng gradient nhiều lớp để tạo chiều sâu, ví dụ `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Glassmorphism**: `backdrop-filter: blur(12px); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1)`
- **Typography**: Dùng Google Fonts hiện đại – **Rajdhani** (headings, scores), **Inter** hoặc **Outfit** (body text), **Orbitron** hoặc **Chakra Petch** (branding/counter)
- **Hiệu ứng glow/neon**: `text-shadow` và `box-shadow` với accent colors, ví dụ `0 0 20px rgba(0,229,255,0.3)`
- **Card design**: Bo góc lớn (12-16px), viền gradient subtle, hover lift effect

### 2. Motion & Animation

- **Micro-animations bắt buộc trên mọi interactive element**
- Hover effects: scale(1.02-1.05), shadow elevation, border glow
- Page transitions: fade-in, slide-up staggered
- Counter/score animations: count-up effect sử dụng CSS `@keyframes` hoặc JS
- Loading states: skeleton screens với shimmer effect, không dùng spinner đơn giản
- Bracket connector lines: animated draw-in effect
- Match result reveal: flip card hoặc slide animation
- CSS transitions mặc định: `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`

### 3. Layout & Responsive

- **Mobile-first responsive design**
- CSS Grid cho bracket layouts, Flexbox cho component layouts
- Breakpoints: 480px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop)
- Container max-width: 1280px, padding: 0 clamp(1rem, 3vw, 3rem)
- Bracket phải scroll ngang trên mobile, hiển thị đầy đủ trên desktop

---

## Kiến Trúc Kỹ Thuật

### Tech Stack Khuyến Nghị

| Layer | Công nghệ | Ghi chú |
|-------|-----------|---------|
| **Frontend Framework** | Vite + Vanilla JS hoặc Next.js (React) | Vite cho trang tĩnh/SPA đơn giản, Next.js cho app phức tạp |
| **Styling** | Vanilla CSS (CSS Variables + Custom Properties) | Tạo design system riêng, KHÔNG dùng Tailwind trừ khi user yêu cầu |
| **Animation** | CSS Animations + Intersection Observer API | GSAP nếu cần animation phức tạp |
| **Backend API** | Python (FastAPI hoặc Flask) | REST API hoặc WebSocket cho real-time |
| **Real-time** | WebSocket (Python `websockets` / Socket.IO) | Live scores, bracket updates |
| **Data** | JSON files hoặc SQLite cho prototype, PostgreSQL cho production | |
| **Build Tool** | Vite | HMR nhanh, ES modules native |

### Cấu Trúc Thư Mục Chuẩn

```
tournament-app/
├── index.html
├── package.json
├── vite.config.js              # Vite config
├── css/
│   ├── variables.css           # CSS custom properties (design tokens)
│   ├── reset.css               # CSS reset/normalize
│   ├── typography.css           # Font imports & text styles
│   ├── animations.css           # Keyframes & animation utilities
│   ├── components/
│   │   ├── bracket.css          # Tournament bracket styles
│   │   ├── card.css             # Match/team/player cards
│   │   ├── leaderboard.css      # Standings table
│   │   ├── navbar.css           # Navigation
│   │   ├── hero.css             # Hero/banner section
│   │   ├── schedule.css         # Match schedule
│   │   ├── modal.css            # Modals & overlays
│   │   └── forms.css            # Registration forms
│   └── pages/
│       ├── home.css
│       ├── tournament.css
│       └── match.css
├── js/
│   ├── main.js                  # Entry point
│   ├── router.js                # Client-side routing (nếu SPA)
│   ├── api.js                   # API client
│   ├── components/
│   │   ├── bracket.js           # Bracket rendering logic
│   │   ├── leaderboard.js       # Leaderboard component
│   │   ├── matchCard.js         # Match card component
│   │   ├── countdown.js         # Countdown timer
│   │   └── liveScore.js         # WebSocket live score
│   └── utils/
│       ├── animations.js        # Animation helpers
│       ├── formatters.js        # Date, score formatters
│       └── tournament.js        # Bracket generation algorithms
├── api/                         # Python backend
│   ├── main.py                  # FastAPI app
│   ├── models.py                # Data models
│   ├── routes/
│   │   ├── tournaments.py
│   │   ├── matches.py
│   │   └── teams.py
│   └── requirements.txt
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
└── data/
    └── sample-tournament.json   # Sample data cho development
```

---

## Các Component UI Cốt Lõi

Khi xây dựng tournament UI, **BẮT BUỘC** tham khảo file hướng dẫn chi tiết từng component:

- **Tournament Bracket**: Xem [references/bracket.md](references/bracket.md) – Single/Double Elimination, Swiss, Round Robin
- **Leaderboard & Standings**: Xem [references/leaderboard.md](references/leaderboard.md) – Bảng xếp hạng, group stage tables
- **Match Cards & Schedule**: Xem [references/match-cards.md](references/match-cards.md) – Card thiết kế, lịch thi đấu
- **Design Tokens & CSS System**: Xem [references/design-tokens.md](references/design-tokens.md) – Biến CSS, color palette, spacing scale
- **Python API Patterns**: Xem [references/python-api.md](references/python-api.md) – FastAPI patterns cho tournament data

---

## Quy Trình Phát Triển (Workflow)

### Bước 1: Khởi Tạo Project

```bash
# Tạo project với Vite
npx -y create-vite@latest ./ --template vanilla

# Cài dependencies
npm install

# (Optional) Tạo Python backend
python -m venv venv
pip install fastapi uvicorn websockets
```

### Bước 2: Thiết Lập Design System

1. Tạo `css/variables.css` với đầy đủ design tokens (xem references/design-tokens.md)
2. Tạo `css/reset.css` cho CSS reset
3. Import Google Fonts trong `css/typography.css`
4. Tạo `css/animations.css` với các keyframes cơ bản

### Bước 3: Xây Dựng Components

1. Bắt đầu từ **Navbar** → **Hero Section** → **Tournament Bracket** → **Match Cards** → **Leaderboard**
2. Mỗi component phải có cả CSS và JS module riêng
3. Sử dụng CSS custom properties từ design system, KHÔNG hardcode màu/spacing

### Bước 4: Kết Nối Data

1. Tạo sample data trong `data/sample-tournament.json`
2. Xây dựng API client trong `js/api.js`
3. (Nếu cần) Thiết lập Python FastAPI backend

### Bước 5: Polish & Optimize

1. Thêm skeleton loading states
2. Responsive testing trên mọi breakpoint
3. Animation performance: sử dụng `transform` và `opacity` (GPU-accelerated)
4. Accessibility: ARIA labels, keyboard navigation, đủ contrast ratio

---

## Checklist Chất Lượng

Trước khi hoàn thành, **PHẢI** đáp ứng tất cả:

- [ ] Dark theme mặc định, mọi text đọc rõ trên nền tối
- [ ] Hover effects trên mọi interactive element
- [ ] Smooth transitions (không có thay đổi đột ngột)
- [ ] Responsive trên mobile, tablet, desktop
- [ ] Loading states (skeleton/shimmer)
- [ ] Gradient và glow effects tạo cảm giác "gaming/esports"
- [ ] Typography hierarchy rõ ràng (heading, subheading, body, caption)
- [ ] Data hiển thị chính xác (scores, dates, team names)
- [ ] No placeholder images – sử dụng generate_image tool hoặc SVG
- [ ] SEO basics: title, meta description, semantic HTML
- [ ] Performance: CSS animations dùng transform/opacity, lazy load images

---

## Lưu Ý Quan Trọng

1. **KHÔNG BAO GIỜ** tạo giao diện trông "generic" hoặc "boring" – Esports UI phải WOW ngay từ cái nhìn đầu tiên
2. **Luôn dùng data thực tế** (tên đội, score, ngày giờ) thay vì "Team A", "Team B"
3. **SVG icons** cho logo game/platform – không dùng emoji làm icon chính
4. **Accessibility không được bỏ qua** – Contrast ratio ≥ 4.5:1 cho text, ≥ 3:1 cho large text
5. **Progressive Enhancement** – Core content phải hoạt động không JS, JS chỉ enhance
