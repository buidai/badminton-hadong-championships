# Leaderboard & Standings – Hướng Dẫn Thiết Kế

## Các Loại Bảng Xếp Hạng

### 1. Overall Standings (Bảng Tổng)
- Hiển thị tất cả đội theo thứ hạng
- Columns: Rank, Team, W, L, Win%, Points, Streak, Last 5

### 2. Group Stage Tables
- Chia theo bảng (Group A, B, C, D)
- Highlight top 2 đội (qualified) với background khác

### 3. Player Stats Leaderboard
- Xếp hạng theo stats cá nhân (KDA, damage, CS/min, ...)
- Cho phép sort theo nhiều tiêu chí

---

## CSS Implementation

```css
/* === LEADERBOARD TABLE === */
.leaderboard {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 4px;
  font-family: 'Inter', sans-serif;
}

.leaderboard__header {
  position: sticky;
  top: 0;
  z-index: 10;
}

.leaderboard__header th {
  padding: 0.75rem 1rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  text-align: left;
  background: var(--color-bg);
  border-bottom: 2px solid var(--color-border);
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
}

.leaderboard__header th:hover {
  color: var(--color-accent);
}

.leaderboard__header th[data-sort-active] {
  color: var(--color-accent);
}

.leaderboard__header th[data-sort-active]::after {
  content: '';
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 6px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
}

.leaderboard__header th[data-sort-dir="asc"]::after {
  border-bottom: 5px solid var(--color-accent);
}

.leaderboard__header th[data-sort-dir="desc"]::after {
  border-top: 5px solid var(--color-accent);
}

/* === TABLE ROW === */
.leaderboard__row {
  background: var(--color-surface);
  border-radius: 8px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.leaderboard__row:hover {
  background: var(--color-surface-hover);
  transform: translateX(4px);
  box-shadow: -4px 0 0 var(--color-accent);
}

.leaderboard__row td {
  padding: 0.875rem 1rem;
  font-size: 0.9rem;
  color: var(--color-text);
  vertical-align: middle;
}

.leaderboard__row td:first-child {
  border-radius: 8px 0 0 8px;
}

.leaderboard__row td:last-child {
  border-radius: 0 8px 8px 0;
}

/* === RANK COLUMN === */
.leaderboard__rank {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  width: 3rem;
  text-align: center;
}

.leaderboard__rank--1 {
  color: #ffd700; /* Gold */
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.leaderboard__rank--2 {
  color: #c0c0c0; /* Silver */
}

.leaderboard__rank--3 {
  color: #cd7f32; /* Bronze */
}

/* === TEAM INFO === */
.leaderboard__team-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.leaderboard__team-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid var(--color-border);
  transition: border-color 0.2s ease;
}

.leaderboard__row:hover .leaderboard__team-logo {
  border-color: var(--color-accent);
}

.leaderboard__team-info {
  display: flex;
  flex-direction: column;
}

.leaderboard__team-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.leaderboard__team-tag {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

/* === STAT COLUMNS === */
.leaderboard__stat {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
}

.leaderboard__stat--win {
  color: var(--color-success);
}

.leaderboard__stat--loss {
  color: var(--color-danger);
}

.leaderboard__stat--highlight {
  color: var(--color-accent);
  font-weight: 700;
}

/* === WIN RATE BAR === */
.leaderboard__winrate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.leaderboard__winrate-bar {
  flex: 1;
  height: 6px;
  background: var(--color-surface-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.leaderboard__winrate-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-light));
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.leaderboard__winrate-text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 3rem;
  text-align: right;
}

/* === STREAK INDICATOR === */
.leaderboard__streak {
  display: flex;
  gap: 3px;
  justify-content: center;
}

.leaderboard__streak-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.leaderboard__streak-dot--win {
  background: var(--color-success);
  box-shadow: 0 0 4px rgba(var(--color-success-rgb), 0.5);
}

.leaderboard__streak-dot--loss {
  background: var(--color-danger);
  box-shadow: 0 0 4px rgba(var(--color-danger-rgb), 0.5);
}

/* === QUALIFIED / ELIMINATED INDICATORS === */
.leaderboard__row--qualified {
  border-left: 3px solid var(--color-success);
}

.leaderboard__row--eliminated {
  opacity: 0.5;
  border-left: 3px solid var(--color-danger);
}

.leaderboard__row--relegated {
  border-left: 3px solid var(--color-warning);
}

/* === GROUP STAGE === */
.group-stage {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.group {
  background: var(--color-surface);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
}

.group__title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

---

## JavaScript – Sortable Leaderboard

```javascript
/**
 * Tạo leaderboard có thể sort
 * @param {HTMLElement} container
 * @param {Array} teams - Mảng team data
 * @param {Object} options - Cấu hình
 */
function createLeaderboard(container, teams, options = {}) {
  const {
    columns = ['rank', 'team', 'wins', 'losses', 'winrate', 'points', 'streak'],
    defaultSort = 'points',
    defaultDir = 'desc',
    qualifyCount = 2,  // Số đội được qualify
  } = options;

  let sortKey = defaultSort;
  let sortDir = defaultDir;

  function sortTeams(data) {
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      const modifier = sortDir === 'asc' ? 1 : -1;
      if (typeof valA === 'string') return valA.localeCompare(valB) * modifier;
      return (valA - valB) * modifier;
    });
  }

  function render() {
    const sorted = sortTeams(teams);
    // Render table with sorted data...
    // Apply rank-based styling
    // Animate rank changes
  }

  // Column header click to sort
  function handleSort(key) {
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = 'desc';
    }
    render();
  }

  render();
}
```

---

## Animation cho Rank Changes

```css
@keyframes rank-up {
  0% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes rank-down {
  0% { transform: translateY(-10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.leaderboard__row[data-rank-change="up"] {
  animation: rank-up 0.4s ease-out;
}

.leaderboard__row[data-rank-change="down"] {
  animation: rank-down 0.4s ease-out;
}

/* Rank change arrow indicator */
.leaderboard__rank-change {
  font-size: 0.65rem;
  margin-left: 4px;
}

.leaderboard__rank-change--up {
  color: var(--color-success);
}

.leaderboard__rank-change--up::before {
  content: '▲';
}

.leaderboard__rank-change--down {
  color: var(--color-danger);
}

.leaderboard__rank-change--down::before {
  content: '▼';
}
```

---

## Responsive

```css
@media (max-width: 768px) {
  .leaderboard__header th:nth-child(n+5),
  .leaderboard__row td:nth-child(n+5) {
    display: none; /* Ẩn columns phụ trên mobile */
  }

  .leaderboard__row td {
    padding: 0.625rem 0.5rem;
    font-size: 0.8rem;
  }

  .group-stage {
    grid-template-columns: 1fr;
  }
}
```

## Best Practices

1. **Sticky header** – Header luôn hiển thị khi scroll bảng dài
2. **Highlight hover row** – Dùng subtle left border accent thay vì đổi toàn bộ background
3. **Win rate visualization** – Dùng progress bar, không chỉ số text
4. **Streak visualization** – Dùng dot indicators (5 trận gần nhất)
5. **Qualified/Eliminated** – Visual indicator rõ ràng (border left color + opacity)
6. **Sort indicators** – Arrow trên column header đang sort
7. **Animated transitions** – Khi data thay đổi (rank change), animate row position
