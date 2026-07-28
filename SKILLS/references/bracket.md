# Tournament Bracket – Hướng Dẫn Thiết Kế & Implementation

## Các Loại Bracket

### 1. Single Elimination
- Dạng phổ biến nhất, thua 1 trận là loại
- Layout: cây nhị phân từ trái sang phải (hoặc 2 bên hướng vào giữa cho Grand Final)
- Số vòng = log2(n) với n là số đội

### 2. Double Elimination
- Gồm Winner Bracket (WB) và Loser Bracket (LB)
- WB ở trên, LB ở dưới, Grand Final ở giữa bên phải
- Phức tạp hơn về layout, cần xử lý connector lines cẩn thận

### 3. Swiss System
- Hiển thị dạng bảng theo round, không phải tree
- Mỗi round hiển thị các cặp đấu + kết quả
- Standings table bên cạnh showing W-L record

### 4. Round Robin
- Hiển thị dạng bảng ma trận (matrix) hoặc bảng xếp hạng
- Mỗi ô trong matrix là kết quả head-to-head

---

## CSS Layout cho Bracket

### Single Elimination Bracket Structure

```css
/* === BRACKET CONTAINER === */
.bracket {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  padding: 2rem;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-accent) var(--color-surface);
}

/* === ROUND COLUMN === */
.bracket__round {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;
  min-width: 280px;
}

.bracket__round-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-text-muted);
  text-align: center;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-border);
}

/* === MATCH CARD IN BRACKET === */
.bracket__match {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.bracket__match:hover {
  border-color: var(--color-accent);
  box-shadow: 0 0 20px rgba(var(--color-accent-rgb), 0.15);
  transform: translateY(-2px);
}

.bracket__match--live {
  border-color: var(--color-live);
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: var(--color-live); }
  50% { border-color: transparent; }
}

/* === TEAM ROW TRONG MATCH === */
.bracket__team {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  gap: 0.75rem;
  transition: background 0.2s ease;
}

.bracket__team:first-child {
  border-bottom: 1px solid var(--color-border);
}

.bracket__team--winner {
  background: rgba(var(--color-accent-rgb), 0.08);
}

.bracket__team--loser {
  opacity: 0.5;
}

.bracket__team-logo {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border);
}

.bracket__team-name {
  flex: 1;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bracket__team-seed {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-weight: 400;
  margin-right: 0.25rem;
}

.bracket__score {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  min-width: 2rem;
  text-align: center;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  background: var(--color-surface-elevated);
}

.bracket__score--winning {
  color: var(--color-accent);
  background: rgba(var(--color-accent-rgb), 0.15);
}
```

### Connector Lines (SVG Approach)

```css
/* SVG connectors giữa các rounds */
.bracket__connectors {
  position: relative;
  width: 40px;
  min-width: 40px;
}

.bracket__connector {
  stroke: var(--color-border);
  stroke-width: 2;
  fill: none;
  transition: stroke 0.3s ease;
}

.bracket__connector--active {
  stroke: var(--color-accent);
  filter: drop-shadow(0 0 4px rgba(var(--color-accent-rgb), 0.3));
}
```

---

## JavaScript – Bracket Generation Algorithm

```javascript
/**
 * Tạo bracket data từ danh sách teams
 * @param {Array} teams - Mảng teams đã seeded
 * @param {string} format - 'single' | 'double'
 * @returns {Object} bracket data với rounds và matches
 */
function generateBracket(teams, format = 'single') {
  const numTeams = teams.length;
  // Làm tròn lên power of 2
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
  const numRounds = Math.log2(bracketSize);
  const rounds = [];

  // Round 1: Seed matching (1 vs 16, 2 vs 15, ...)
  const round1 = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    const team1 = teams[i] || { name: 'BYE', seed: null };
    const team2 = teams[bracketSize - 1 - i] || { name: 'BYE', seed: null };
    round1.push({
      id: `r1-m${i + 1}`,
      team1,
      team2,
      score1: null,
      score2: null,
      status: 'upcoming', // 'upcoming' | 'live' | 'completed'
    });
  }
  rounds.push({ name: 'Round 1', matches: round1 });

  // Generate empty rounds
  for (let r = 1; r < numRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r + 1);
    const roundNames = {
      [numRounds - 1]: 'Grand Final',
      [numRounds - 2]: 'Semi-Finals',
      [numRounds - 3]: 'Quarter-Finals',
    };
    const roundName = roundNames[r] || `Round ${r + 1}`;
    const matches = Array.from({ length: matchCount }, (_, i) => ({
      id: `r${r + 1}-m${i + 1}`,
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      status: 'upcoming',
    }));
    rounds.push({ name: roundName, matches });
  }

  return { format, rounds, totalTeams: numTeams, bracketSize };
}

/**
 * Render bracket to DOM
 * @param {HTMLElement} container
 * @param {Object} bracketData
 */
function renderBracket(container, bracketData) {
  container.innerHTML = '';
  container.classList.add('bracket');

  bracketData.rounds.forEach((round, roundIndex) => {
    // Thêm connector SVG giữa các rounds (trừ round đầu)
    if (roundIndex > 0) {
      const connectorCol = document.createElement('div');
      connectorCol.classList.add('bracket__connectors');
      // SVG connector logic...
      container.appendChild(connectorCol);
    }

    const roundEl = document.createElement('div');
    roundEl.classList.add('bracket__round');

    const titleEl = document.createElement('div');
    titleEl.classList.add('bracket__round-title');
    titleEl.textContent = round.name;
    roundEl.appendChild(titleEl);

    round.matches.forEach(match => {
      const matchEl = createMatchElement(match);
      roundEl.appendChild(matchEl);
    });

    container.appendChild(roundEl);
  });
}

function createMatchElement(match) {
  const el = document.createElement('div');
  el.classList.add('bracket__match');
  if (match.status === 'live') el.classList.add('bracket__match--live');

  const createTeamRow = (team, score, isWinner) => {
    const row = document.createElement('div');
    row.classList.add('bracket__team');
    if (isWinner) row.classList.add('bracket__team--winner');
    if (isWinner === false) row.classList.add('bracket__team--loser');

    row.innerHTML = `
      ${team?.logo ? `<img class="bracket__team-logo" src="${team.logo}" alt="${team.name}">` : ''}
      ${team?.seed ? `<span class="bracket__team-seed">#${team.seed}</span>` : ''}
      <span class="bracket__team-name">${team?.name || 'TBD'}</span>
      <span class="bracket__score ${isWinner ? 'bracket__score--winning' : ''}">${score ?? '-'}</span>
    `;
    return row;
  };

  const winner = match.score1 != null && match.score2 != null
    ? (match.score1 > match.score2 ? 'team1' : 'team2')
    : null;

  el.appendChild(createTeamRow(match.team1, match.score1, winner === 'team1' ? true : winner ? false : null));
  el.appendChild(createTeamRow(match.team2, match.score2, winner === 'team2' ? true : winner ? false : null));

  return el;
}
```

---

## Responsive Bracket

```css
/* Mobile: Horizontal scroll */
@media (max-width: 768px) {
  .bracket {
    padding: 1rem;
    gap: 1rem;
    -webkit-overflow-scrolling: touch;
  }

  .bracket__round {
    min-width: 240px;
  }

  .bracket__team-name {
    max-width: 120px;
  }
}

/* Desktop: Full view */
@media (min-width: 1440px) {
  .bracket {
    justify-content: center;
  }

  .bracket__round {
    min-width: 300px;
  }
}
```

## Best Practices

1. **Luôn dùng semantic seed ordering** – #1 seed gặp #16 seed, không random
2. **BYE matches**: Tự động advance team không có đối thủ, hiển thị mờ
3. **Live indicator**: Dot xanh nhấp nháy + border pulse cho trận đang diễn ra
4. **Match detail**: Click vào match mở modal với chi tiết (maps, rounds, stats)
5. **Zoom controls**: Cho phép zoom in/out bracket lớn
6. **Print-friendly**: Cung cấp CSS `@media print` riêng cho bracket
