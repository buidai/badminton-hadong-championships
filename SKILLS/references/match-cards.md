# Match Cards & Schedule – Hướng Dẫn Thiết Kế

## Các Loại Match Card

### 1. Upcoming Match Card
- Hiển thị 2 đội, ngày giờ, countdown timer
- CTA: "Set Reminder" hoặc "Watch Live" (disabled)

### 2. Live Match Card
- Border pulse animation, live dot indicator
- Score cập nhật real-time
- CTA: "Watch Now" (highlighted)

### 3. Completed Match Card
- Score final, team winner highlighted
- CTA: "View Details" / "Watch VOD"

### 4. Featured Match (Hero Card)
- Card lớn, chiếm full width
- Background image/gradient, team logos lớn
- Countdown timer nổi bật

---

## CSS Implementation

```css
/* === BASE MATCH CARD === */
.match-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.match-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.match-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.match-card:hover::before {
  opacity: 1;
}

/* === LIVE MATCH CARD === */
.match-card--live {
  border-color: var(--color-live);
  background: linear-gradient(135deg, 
    var(--color-surface) 0%, 
    rgba(var(--color-live-rgb), 0.05) 100%
  );
}

.match-card--live::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 16px;
  border: 1px solid var(--color-live);
  animation: pulse-glow 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse-glow {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(var(--color-live-rgb), 0.4);
  }
  50% { 
    box-shadow: 0 0 20px 4px rgba(var(--color-live-rgb), 0.1);
  }
}

/* === LIVE BADGE === */
.match-card__live-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: var(--color-live);
  color: white;
  border-radius: 100px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.match-card__live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  animation: blink 1.2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* === TEAM SECTION === */
.match-card__team {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.match-card__team--right {
  flex-direction: row-reverse;
  text-align: right;
}

.match-card__team-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid var(--color-border);
  transition: all 0.3s ease;
}

.match-card:hover .match-card__team-logo {
  border-color: var(--color-accent);
  transform: scale(1.05);
}

.match-card__team-name {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.match-card__team-tag {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.match-card__team--winner .match-card__team-name {
  color: var(--color-accent);
}

.match-card__team--loser {
  opacity: 0.5;
}

/* === SCORE / VS SECTION === */
.match-card__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 80px;
}

.match-card__score {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.05em;
}

.match-card__vs {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.match-card__best-of {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* === MATCH INFO === */
.match-card__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.match-card__date {
  font-weight: 600;
}

.match-card__time {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-accent);
}

/* === COUNTDOWN TIMER === */
.match-card__countdown {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.match-card__countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 3rem;
  padding: 0.5rem;
  background: var(--color-surface-elevated);
  border-radius: 8px;
}

.match-card__countdown-value {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
}

.match-card__countdown-label {
  font-size: 0.6rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
  margin-top: 2px;
}

/* === FEATURED MATCH (HERO) === */
.match-card--featured {
  padding: 2.5rem;
  background: linear-gradient(135deg,
    rgba(var(--color-accent-rgb), 0.1) 0%,
    var(--color-surface) 50%,
    rgba(var(--color-accent-secondary-rgb), 0.1) 100%
  );
  border: none;
  border-radius: 24px;
  flex-direction: column;
  text-align: center;
}

.match-card--featured .match-card__teams {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  width: 100%;
}

.match-card--featured .match-card__team-logo {
  width: 80px;
  height: 80px;
  border-radius: 16px;
}

.match-card--featured .match-card__team-name {
  font-size: 1.25rem;
}

.match-card--featured .match-card__score {
  font-size: 3rem;
}

.match-card--featured .match-card__vs {
  font-size: 2rem;
}
```

---

## Schedule Layout

```css
/* === SCHEDULE CONTAINER === */
.schedule {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* === DAY GROUP === */
.schedule__day {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule__day-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.schedule__day-date {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.schedule__day-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.schedule__day-label--today {
  color: var(--color-accent);
  background: rgba(var(--color-accent-rgb), 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
  font-weight: 700;
}

/* === MATCH LIST === */
.schedule__matches {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* === FILTER TABS === */
.schedule__filters {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--color-surface);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.schedule__filter-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.schedule__filter-btn:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.schedule__filter-btn--active {
  color: white;
  background: var(--color-accent);
}
```

---

## JavaScript – Countdown Timer

```javascript
/**
 * Countdown timer cho upcoming matches
 * @param {HTMLElement} element - Container element
 * @param {Date} targetDate - Ngày giờ bắt đầu trận
 */
function startCountdown(element, targetDate) {
  function update() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      element.innerHTML = '<span class="match-card__live-badge"><span class="match-card__live-dot"></span>LIVE</span>';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    element.innerHTML = `
      ${days > 0 ? `<div class="match-card__countdown-unit">
        <span class="match-card__countdown-value">${days}</span>
        <span class="match-card__countdown-label">Days</span>
      </div>` : ''}
      <div class="match-card__countdown-unit">
        <span class="match-card__countdown-value">${String(hours).padStart(2, '0')}</span>
        <span class="match-card__countdown-label">Hours</span>
      </div>
      <div class="match-card__countdown-unit">
        <span class="match-card__countdown-value">${String(minutes).padStart(2, '0')}</span>
        <span class="match-card__countdown-label">Mins</span>
      </div>
      <div class="match-card__countdown-unit">
        <span class="match-card__countdown-value">${String(seconds).padStart(2, '0')}</span>
        <span class="match-card__countdown-label">Secs</span>
      </div>
    `;
  }

  update();
  setInterval(update, 1000);
}

/**
 * Format date cho schedule
 */
function formatMatchDate(date) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
```

## Best Practices

1. **Time zone aware** – Hiển thị giờ theo timezone của user, có option chuyển timezone
2. **Match status clear** – Upcoming (xám), Live (đỏ pulse), Completed (accent color)
3. **Score animation** – Khi score thay đổi, animate số (count up)
4. **Spoiler mode** – Option ẩn kết quả cho user muốn xem VOD
5. **Group by date** – Schedule nhóm theo ngày, với "Today" highlight
6. **Filter options** – Lọc theo status (All/Live/Upcoming/Completed), team, stage
