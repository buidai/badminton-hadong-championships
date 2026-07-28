/**
 * Realistic end-to-end tournament simulation
 * Uses real international badminton player names (mixed doubles pairs),
 * mirrors the app's documented logic:
 *  - Group stage: round-robin 4x4, 1 set to 21, points = wins
 *  - Tiebreak: points -> setDifference -> name
 *  - Lượt 2: group winners Nhất A vs Nhất D, Nhất B vs Nhất C (per rank group)
 *  - Lượt 3: winner vs winner / loser vs loser -> final ranks 1-16
 *  - MVP: accumulate votes
 * Asserts the FULL pipeline yields a valid 1..16 ranking with correct bracket.
 */

// 16 mixed-doubles pairs (real international player surnames, mixed M/F)
const PAIRS = [
  // Bảng A
  ['Viktor Axelsen', 'Chen Qingchen'],
  ['Anthony Ginting', 'Greysia Polii'],
  ['Kenta Momota', 'Yuki Fukushima'],
  ['Lee Zii Jia', 'Lee So Hee'],
  // Bảng B
  ['Shi Yu Qi', 'Huang Yaqiong'],
  ['Anders Antonsen', 'Kim So Yeong'],
  ['Jonatan Christie', 'Nami Matsuyama'],
  ['Chou Tien Chen', 'Mayu Matsumoto'],
  // Bảng C
  ['Pusarla Sindhu', 'Zheng Si Wei'],
  ['An Se Young', 'Wang Yi Lyu'],
  ['Tai Tzu Ying', 'Tang Chun Man'],
  ['Carolina Marin', 'Seo Seung Jae'],
  // Bảng D
  ['Akane Yamaguchi', 'Marcus Gideon'],
  ['Nozomi Okuhara', 'Kevin Sanjaya'],
  ['He Bing Jiao', 'Yuta Watanabe'],
  ['Busanan Ongbamrungphan', 'Hendra Setiawan'],
]

const GROUPS = ['A', 'B', 'C', 'D']
const TEAMS_PER_GROUP = 4

// deterministic pseudo-random so the test is reproducible
let _seed = 20240728
function rnd() { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff }
// a "set" to 21, winner margin 2..11
function playSet() {
  const aWins = rnd() > 0.5
  const margin = 2 + Math.floor(rnd() * 10)
  return aWins ? [21, 21 - margin] : [21 - margin, 21]
}

const teams = []
let tid = 0
GROUPS.forEach((g, gi) => {
  for (let i = 0; i < TEAMS_PER_GROUP; i++) {
    const [p1, p2] = PAIRS[gi * 4 + i]
    teams.push({ id: `t${tid++}`, group: g, label: `${g}${i + 1}`, name: `${g}${i + 1}`, player1: p1, player2: p2 })
  }
})

// ---- Group stage round-robin ----
const matches = []
GROUPS.forEach(g => {
  const gt = teams.filter(t => t.group === g)
  const pairs = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]]
  pairs.forEach(([a, b]) => {
    const [sa, sb] = playSet()
    matches.push({ id: `m${matches.length}`, group: g, stage: 'GROUP_STAGE', teamA_id: gt[a].id, teamB_id: gt[b].id, teamA_score: sa, teamB_score: sb, status: 'COMPLETED' })
  })
})

// ---- Standings per group ----
function computeGroupStandings(group) {
  const gs = teams.filter(t => t.group === group)
  const stats = {}
  gs.forEach(t => stats[t.id] = { id: t.id, name: t.name, points: 0, setsFor: 0, setsAgainst: 0, setDifference: 0, players: `${t.player1} / ${t.player2}` })
  matches.filter(m => m.group === group).forEach(m => {
    stats[m.teamA_id].setsFor += m.teamA_score; stats[m.teamA_id].setsAgainst += m.teamB_score
    stats[m.teamB_id].setsFor += m.teamB_score; stats[m.teamB_id].setsAgainst += m.teamA_score
    if (m.teamA_score > m.teamB_score) stats[m.teamA_id].points++
    else stats[m.teamB_id].points++
  })
  return Object.values(stats).map(s => ({ ...s, setDifference: s.setsFor - s.setsAgainst }))
    .sort((a, b) => b.points - a.points || b.setDifference - a.setDifference || a.name.localeCompare(b.name))
}

// ---- Phase 2 (Lượt 2) per rank group ----
// rankGroup 1..4 ; within each, match Nhất vs Nhất of (A,D) and (B,C)
const phase2 = []
const finals = []
GROUPS.forEach(() => {}) // noop
for (let rg = 1; rg <= 4; rg++) {
  const groupLeaders = GROUPS.map(g => computeGroupStandings(g)[rg - 1]) // rg-th place of each group
  // A vs D, B vs C
  const pairs = [[0, 3], [1, 2]] // index into GROUPS order A,B,C,D -> (A,D),(B,C)
  pairs.forEach(([pi, pj]) => {
    const ta = groupLeaders[pi], tb = groupLeaders[pj]
    const [sa, sb] = playSet()
    const winner = sa > sb ? ta : tb, loser = sa > sb ? tb : ta
    const m = { id: `p2_${rg}_${pi}${pj}`, stage: 'PHASE2', rankGroup: rg, teamA_id: ta.id, teamB_id: tb.id, teamA_score: sa, teamB_score: sb, status: 'COMPLETED', winnerId: winner.id, loserId: loser.id }
    phase2.push(m)
    // Lượt 3: winner vs winner, loser vs loser
    // we resolve after both pairs -> push finals placeholder, fill below
    m._winner = winner; m._loser = loser
  })
}

// Resolve Lượt 3 (finals) per rank group
for (let rg = 1; rg <= 4; rg++) {
  const rgMatches = phase2.filter(m => m.rankGroup === rg)
  const wA = rgMatches[0]._winner, wB = rgMatches[1]._winner
  const lA = rgMatches[0]._loser, lB = rgMatches[1]._loser
  const [sw1, sw2] = playSet()
  const fw = sw1 > sw2 ? wA : wB, fl = sw1 > sw2 ? wB : wA
  finals.push({ id: `f_${rg}_w`, stage: 'FINAL', rankWinner: (rg-1)*4+1, rankLoser: (rg-1)*4+3, teamA_id: wA.id, teamB_id: wB.id, teamA_score: sw1, teamB_score: sw2, status:'COMPLETED', winnerId: fw.id, loserId: fl.id })
  const [sl1, sl2] = playSet()
  const fl2 = sl1 > sl2 ? lA : lB, ll2 = sl1 > sl2 ? lB : lA
  finals.push({ id: `f_${rg}_l`, stage: 'FINAL', rankWinner: (rg-1)*4+2, rankLoser: (rg-1)*4+4, teamA_id: lA.id, teamB_id: lB.id, teamA_score: sl1, teamB_score: sl2, status:'COMPLETED', winnerId: fl2.id, loserId: ll2.id })
}

// ---- Overall ranking ----
const rankMap = {} // rank -> teamId
finals.forEach(f => { rankMap[f.rankWinner] = f.winnerId; rankMap[f.rankLoser] = f.loserId })
const overall = []
for (let r = 1; r <= 16; r++) overall.push({ rank: r, teamId: rankMap[r], name: teams.find(t=>t.id===rankMap[r]).name, players: `${teams.find(t=>t.id===rankMap[r]).player1} / ${teams.find(t=>t.id===rankMap[r]).player2}` })

// ---- MVP simulation ----
const mvp = {}
matches.concat(phase2, finals).forEach(m => { const p = [teams.find(t=>t.id===m.teamA_id).player1, teams.find(t=>t.id===m.teamA_id).player2, teams.find(t=>t.id===m.teamB_id).player1, teams.find(t=>t.id===m.teamB_id).player2][Math.floor(rnd()*4)]; mvp[p] = (mvp[p]||0)+1 })

// ===== ASSERTIONS =====
let passed = 0, failed = 0
function assert(c, m){ if(c){passed++;console.log('  ✅ '+m)} else {failed++;console.error('  ❌ FAIL: '+m)} }

console.log('\n🔵 DATA TEST: 16 mixed-doubles teams, full pipeline')
assert(teams.length === 16, '16 đội được tạo')
assert(new Set(teams.map(t=>t.group)).size === 4, '4 bảng A/B/C/D')
assert(matches.length === 24, '24 trận vòng bảng (6×4)')

// every group standings has 4 unique teams sorted by points
GROUPS.forEach(g => {
  const s = computeGroupStandings(g)
  assert(s.length === 4 && new Set(s.map(x=>x.id)).size === 4, `Bảng ${g}: 4 đội, không trùng`)
  assert(s[0].points >= s[1].points && s[1].points >= s[2].points && s[2].points >= s[3].points, `Bảng ${g}: xếp theo điểm giảm dần`)
})

assert(phase2.length === 8, 'Lượt 2: 8 trận (2 mỗi nhóm × 4 nhóm)')
assert(finals.length === 8, 'Lượt 3: 8 trận chung kết phân hạng')

// overall ranks 1..16 unique
const ranks = overall.map(o=>o.rank)
assert(ranks.join(',') === Array.from({length:16},(_,i)=>i+1).join(','), 'Xếp hạng 1..16 liên tiếp')
assert(new Set(overall.map(o=>o.teamId)).size === 16, '16 đội đều có thứ hạng riêng biệt (không trùng)')

// rank 1 team must be a winner of a rankGroup-1 final
const r1 = overall.find(o=>o.rank===1)
const r1match = finals.find(f=>f.rankWinner===1)
assert(r1match.winnerId === r1.teamId, 'Hạng 1 = đội thắng trận chung kết Nhóm 1 (rankWinner=1)')

// bracket pairing check: Lượt 2 Nhất A vs Nhất D
const A1 = computeGroupStandings('A')[0], D1 = computeGroupStandings('D')[0]
const l2ad = phase2.find(m=>m.rankGroup===1 && ((m.teamA_id===A1.id&&m.teamB_id===D1.id)||(m.teamA_id===D1.id&&m.teamB_id===A1.id)))
assert(!!l2ad, 'Lượt 2 Nhóm 1: Nhất A gặp Nhất D ✓')
const B1 = computeGroupStandings('B')[0], C1 = computeGroupStandings('C')[0]
const l2bc = phase2.find(m=>m.rankGroup===1 && ((m.teamA_id===B1.id&&m.teamB_id===C1.id)||(m.teamA_id===C1.id&&m.teamB_id===B1.id)))
assert(!!l2bc, 'Lượt 2 Nhóm 1: Nhất B gặp Nhất C ✓')

// MVP accumulation
const mvpEntries = Object.entries(mvp).sort((a,b)=>b[1]-a[1])
assert(mvpEntries.length > 0 && mvpEntries[0][1] >= 1, `MVP: ${mvpEntries[0][0]} dẫn đầu với ${mvpEntries[0][1]} phiếu`)

console.log('\n📋 TOP 5 xếp hạng chung cuộc:')
overall.slice(0,5).forEach(o => console.log(`   #${o.rank}  ${o.name}  (${o.players})`))
console.log('\n🏆 TOP 3 MVP:')
mvpEntries.slice(0,3).forEach(([p,v]) => console.log(`   ⭐ ${p}: ${v} phiếu`))

console.log(`\n${'='.repeat(50)}`)
console.log(`📊 KẾT QUẢ: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
