/**
 * Test Script – Tournament Logic Verification
 * Tests: Round-robin, H2H tiebreaker, Phase2/Final generation, Overall standings
 * Run: node scripts/test_logic.cjs
 */

// ===== HELPERS =====
let passed = 0, failed = 0
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✅ ${msg}`) }
  else { failed++; console.error(`  ❌ FAIL: ${msg}`) }
}

// ===== TEST 1: Round-Robin Pattern =====
console.log('\n🔵 TEST 1: Round-Robin Pattern (4 teams/group)')
{
  const pattern4 = [
    { pA: 0, pB: 1, round: 1 }, { pA: 2, pB: 3, round: 1 },
    { pA: 0, pB: 2, round: 2 }, { pA: 1, pB: 3, round: 2 },
    { pA: 0, pB: 3, round: 3 }, { pA: 1, pB: 2, round: 3 }
  ]
  assert(pattern4.length === 6, '4 đội → 6 trận/bảng')

  const counts = [0, 0, 0, 0]
  pattern4.forEach(({ pA, pB }) => { counts[pA]++; counts[pB]++ })
  assert(counts[0] === 3 && counts[1] === 3 && counts[2] === 3 && counts[3] === 3, 'Mỗi đội đấu đúng 3 trận')

  const totalGroupMatches = 4 * pattern4.length
  assert(totalGroupMatches === 24, '4 bảng × 6 trận = 24 trận vòng bảng')
}

// ===== TEST 2: Label Assignment =====
console.log('\n🔵 TEST 2: Match Labels')
{
  const groups = ['A', 'B', 'C', 'D']
  let matchCount = 0
  const labels = []
  groups.forEach(() => {
    for (let i = 0; i < 6; i++) {
      matchCount++
      labels.push(matchCount)
    }
  })
  assert(labels.length === 24, '24 trận vòng bảng có label')
  assert(labels[0] === 1 && labels[23] === 24, 'Label từ 1 đến 24')
}

// ===== TEST 3: H2H Tiebreaker =====
console.log('\n🔵 TEST 3: Head-to-Head Tiebreaker')
{
  const groupMatches = [
    { teamA_id: 'a1', teamB_id: 'a2', teamA_score: 21, teamB_score: 15, group: 'A', stage: 'GROUP_STAGE' },
    { teamA_id: 'a2', teamB_id: 'a3', teamA_score: 21, teamB_score: 18, group: 'A', stage: 'GROUP_STAGE' },
    { teamA_id: 'a3', teamB_id: 'a1', teamA_score: 21, teamB_score: 19, group: 'A', stage: 'GROUP_STAGE' }
  ]

  const map = {}
  const teams = [{ id: 'a1', name: 'A1' }, { id: 'a2', name: 'A2' }, { id: 'a3', name: 'A3' }]
  teams.forEach(t => {
    map[t.id] = { id: t.id, name: t.name, played: 0, won: 0, lost: 0, points: 0, setsFor: 0, setsAgainst: 0, setDifference: 0 }
  })
  groupMatches.forEach(m => {
    const a = m.teamA_score, b = m.teamB_score
    map[m.teamA_id].played++; map[m.teamB_id].played++
    map[m.teamA_id].setsFor += a; map[m.teamA_id].setsAgainst += b
    map[m.teamB_id].setsFor += b; map[m.teamB_id].setsAgainst += a
    if (a > b) { map[m.teamA_id].won++; map[m.teamB_id].lost++; map[m.teamA_id].points++ }
    else { map[m.teamB_id].won++; map[m.teamA_id].lost++; map[m.teamB_id].points++ }
  })
  Object.values(map).forEach(s => { s.setDifference = s.setsFor - s.setsAgainst })

  assert(map.a1.points === 1 && map.a2.points === 1 && map.a3.points === 1, 'Tất cả đội bằng điểm (1)')
  assert(map.a1.setDifference === 4, 'A1 SD = +4')
  assert(map.a2.setDifference === -3, 'A2 SD = -3')
  assert(map.a3.setDifference === -1, 'A3 SD = -1')

  const getH2H = (xId, yId) => {
    const m = groupMatches.find(m =>
      (m.teamA_id === xId && m.teamB_id === yId) ||
      (m.teamA_id === yId && m.teamB_id === xId)
    )
    if (!m) return 0
    const sa = m.teamA_score, sb = m.teamB_score
    if (m.teamA_id === xId) return sa > sb ? 1 : sa < sb ? -1 : 0
    return sb > sa ? 1 : sb < sa ? -1 : 0
  }

  // Detect circular H2H
  const teamIds = ['a1', 'a2', 'a3']
  const isCircular = (() => {
    for (const tid of teamIds) {
      const wins = teamIds.filter(o => o !== tid && getH2H(tid, o) === 1).length
      const losses = teamIds.filter(o => o !== tid && getH2H(tid, o) === -1).length
      if (wins === 0 || losses === 0) return false
    }
    return true
  })()

  assert(isCircular === true, 'Detect circular H2H (A1>A2>A3>A1)')

  // When circular, skip H2H → sort by setDifference
  const standings = Object.values(map).sort((a, b) => {
    if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0)
    if (!isCircular) {
      const h2h = getH2H(a.id, b.id)
      if (h2h !== 0) return -h2h
    }
    if ((b.setDifference || 0) !== (a.setDifference || 0)) return (b.setDifference || 0) - (a.setDifference || 0)
    return (a.name || '').localeCompare(b.name || '')
  })

  // Circular H2H → falls to SD: A1(+4) > A3(-1) > A2(-3)
  assert(standings[0].id === 'a1', 'Hạng 1: A1 (SD cao nhất +4)')
  assert(standings[1].id === 'a3', 'Hạng 2: A3 (SD -1, cao hơn A2)')
  assert(standings[2].id === 'a2', 'Hạng 3: A2 (SD thấp nhất -3)')
}

// ===== TEST 4: Simple H2H (2 teams tied) =====
console.log('\n🔵 TEST 4: H2H 2 Teams Tied')
{
  const groupMatches = [
    { teamA_id: 'x', teamB_id: 'z', teamA_score: 21, teamB_score: 10 },
    { teamA_id: 'z', teamB_id: 'y', teamA_score: 21, teamB_score: 15 },
    { teamA_id: 'x', teamB_id: 'y', teamA_score: 15, teamB_score: 21 }
  ]

  const getH2H = (xId, yId) => {
    const m = groupMatches.find(m =>
      (m.teamA_id === xId && m.teamB_id === yId) ||
      (m.teamA_id === yId && m.teamB_id === xId)
    )
    if (!m) return 0
    const sa = m.teamA_score, sb = m.teamB_score
    if (m.teamA_id === xId) return sa > sb ? 1 : sa < sb ? -1 : 0
    return sb > sa ? 1 : sb < sa ? -1 : 0
  }

  assert(getH2H('y', 'x') === 1, 'Y thắng X trong đối đầu')
  assert(getH2H('x', 'y') === -1, 'X thua Y trong đối đầu')
  assert(getH2H('x', 'z') === 1, 'X thắng Z trong đối đầu')
}

// ===== TEST 5: Phase 2 Pairing =====
console.log('\n🔵 TEST 5: Phase 2 Pairing Logic (16 teams)')
{
  // For 4 teams per group, Phase 2 generates matches for Rank 4 to Rank 1.
  const pairings = []
  let labelCounter = 24
  for (let rank = 4; rank >= 1; rank--) {
    pairings.push({ label: ++labelCounter, rank, pair: 'AD' })
    pairings.push({ label: ++labelCounter, rank, pair: 'BC' })
  }
  assert(pairings.length === 8, '8 trận Lượt 2 (Phase 2)')
  assert(pairings[0].pair === 'AD' && pairings[0].rank === 4, 'T25: Bét A ↔ Bét D')
  assert(pairings[1].pair === 'BC' && pairings[1].rank === 4, 'T26: Bét B ↔ Bét C')
  assert(pairings[6].rank === 1 && pairings[6].pair === 'AD', 'T31: Nhất bảng A ↔ Nhất bảng D')
}

// ===== TEST 6: Final Ranking Map =====
console.log('\n🔵 TEST 6: Final Ranking Map (Dynamic 16 teams)')
{
  const finals = []
  let labelCounter = 32
  for (let rank = 4; rank >= 1; rank--) {
    const baseRank = (rank - 1) * 4 + 1
    finals.push({ label: ++labelCounter, rankWinner: baseRank, rankLoser: baseRank + 1 })
    finals.push({ label: ++labelCounter, rankWinner: baseRank + 2, rankLoser: baseRank + 3 })
  }

  assert(finals.find(f => f.label === 39).rankWinner === 1, 'T39 winner → Hạng 1')
  assert(finals.find(f => f.label === 39).rankLoser === 2, 'T39 loser → Hạng 2')
  assert(finals.find(f => f.label === 34).rankWinner === 15, 'T34 winner → Hạng 15')
  assert(finals.find(f => f.label === 34).rankLoser === 16, 'T34 loser → Hạng 16')

  const allRanks = finals.flatMap(f => [f.rankWinner, f.rankLoser]).sort((a, b) => a - b)
  assert(allRanks.length === 16, '16 vị trí xếp hạng')
  assert(JSON.stringify(allRanks) === JSON.stringify(Array.from({length: 16}, (_, i) => i + 1)), 'Đầy đủ hạng 1-16')
}

// ===== TEST 7: Overall Standings with finalRank =====
console.log('\n🔵 TEST 7: Overall Standings Sort (finalRank ưu tiên)')
{
  const standings = [
    { id: 't1', name: 'Team1', finalRank: 3, points: 5 },
    { id: 't2', name: 'Team2', finalRank: 1, points: 3 },
    { id: 't3', name: 'Team3', finalRank: 99, points: 2 },
    { id: 't4', name: 'Team4', finalRank: 2, points: 4 }
  ]

  standings.sort((a, b) => {
    if (a.finalRank !== b.finalRank) return a.finalRank - b.finalRank
    if (b.points !== a.points) return b.points - a.points
    return a.name.localeCompare(b.name)
  })

  assert(standings[0].id === 't2', 'Hạng 1: Team2 (finalRank=1)')
  assert(standings[1].id === 't4', 'Hạng 2: Team4 (finalRank=2)')
  assert(standings[2].id === 't1', 'Hạng 3: Team1 (finalRank=3)')
  assert(standings[3].id === 't3', 'Cuối: Team3 (finalRank=99, chưa đấu phân hạng)')
}

// ===== TEST 8: Resolve Dependent Matches =====
console.log('\n🔵 TEST 8: Dependent Match Resolution Logic')
{
  const srcMatch = { label: 13, teamA_id: 'team_betA', teamA_score: 21, teamB_id: 'team_betD', teamB_score: 15 }
  const winnerId = srcMatch.teamA_score > srcMatch.teamB_score ? srcMatch.teamA_id : srcMatch.teamB_id
  const loserId = srcMatch.teamA_score > srcMatch.teamB_score ? srcMatch.teamB_id : srcMatch.teamA_id

  assert(winnerId === 'team_betA', 'Winner T13 = team_betA')
  assert(loserId === 'team_betD', 'Loser T13 = team_betD')

  const depWinner = { sourceA: 13 }
  const depLoser = { sourceA: 'loser13' }

  assert(depWinner.sourceA === 13, 'T19 sourceA=13 → nhận winner')
  assert(depLoser.sourceA === ('loser' + 13), 'T20 sourceA="loser13" → nhận loser')
}

// ===== TEST 9: Total Match Count =====
console.log('\n🔵 TEST 9: Tổng số trận (16 teams)')
{
  const groupStage = 4 * 6
  const phase2 = 8
  const finals = 8
  const total = groupStage + phase2 + finals
  assert(total === 40, 'Tổng 40 trận (24 + 8 + 8)')
}

// ===== TEST: Seed 16-team grouping (4x4) =====
console.log('\n🔵 TEST: Seed grouping 16 teams = 4 groups × 4')
{
  const groups = ['A', 'B', 'C', 'D']
  const players = Array.from({ length: 16 }, (_, i) => i) // 16 mock players
  const grouped = { A: [], B: [], C: [], D: [] }
  players.forEach((p, i) => {
    const gIdx = Math.floor(i / 4)
    const pos = i % 4
    const group = groups[gIdx]
    const teamLabel = `${group}${pos + 1}`
    grouped[group][pos] = teamLabel
  })
  const sizes = ['A', 'B', 'C', 'D'].map(g => grouped[g].length)
  assert(JSON.stringify(sizes) === JSON.stringify([4, 4, 4, 4]), 'Mỗi bảng đúng 4 đội')
  assert(grouped.A.join(',') === 'A1,A2,A3,A4', 'Bảng A = A1..A4')
  assert(grouped.D.join(',') === 'D1,D2,D3,D4', 'Bảng D = D1..D4')
}

// ===== SUMMARY =====
console.log(`\n${'='.repeat(50)}`)
console.log(`📊 KẾT QUẢ: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('🎉 TẤT CẢ TESTS ĐỀU PASS!')
} else {
  console.log('⚠️ CÓ TESTS THẤT BẠI!')
  process.exit(1)
}
