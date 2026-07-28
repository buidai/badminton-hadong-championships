/**
 * Reset Firestore data: clear teams + matches, then seed 16 mock teams
 * (4 groups × 4 teams) and generate round-robin group stage (6 matches per group).
 * Run: node scripts/reset-and-seed.mjs
 */
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDbprxt7KIjH48NNOgEQQpjrTlFzqOiSO4",
  authDomain: "badminton-hadong-championships.firebaseapp.com",
  projectId: "badminton-hadong-championships",
  storageBucket: "badminton-hadong-championships.firebasestorage.app",
  messagingSenderId: "342825512572",
  appId: "1:342825512572:web:9769725024b338e4d523f9"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function deleteCollection(colName) {
  const snap = await getDocs(collection(db, colName))
  if (snap.empty) { console.log(`  ${colName}: already empty`); return 0 }
  const batch = writeBatch(db)
  snap.forEach(d => batch.delete(doc(db, colName, d.id)))
  await batch.commit()
  console.log(`  ${colName}: deleted ${snap.size} documents`)
  return snap.size
}

async function seed() {
  console.log('\n🗑  Clearing Firestore collections...')
  await deleteCollection('teams')
  await deleteCollection('matches')

  console.log('\n👥 Creating 16 mock teams (4 groups × 4 teams)...')
  const groups = ['A', 'B', 'C', 'D']
  const players = [
    ['Viktor Axelsen', 'Chen Qingchen'],          // A1
    ['Anthony Ginting', 'Greysia Polii'],         // A2
    ['Kenta Momota', 'Yuki Fukushima'],           // A3
    ['Lee Zii Jia', 'Lee So Hee'],                // A4
    ['Shi Yu Qi', 'Huang Yaqiong'],               // B1
    ['Anders Antonsen', 'Kim So Yeong'],          // B2
    ['Jonatan Christie', 'Nami Matsuyama'],       // B3
    ['Chou Tien Chen', 'Mayu Matsumoto'],         // B4
    ['Pusarla Sindhu', 'Zheng Si Wei'],           // C1
    ['An Se Young', 'Wang Yi Lyu'],               // C2
    ['Tai Tzu Ying', 'Tang Chun Man'],            // C3
    ['Carolina Marin', 'Seo Seung Jae'],          // C4
    ['Akane Yamaguchi', 'Marcus Gideon'],         // D1
    ['Nozomi Okuhara', 'Kevin Sanjaya'],          // D2
    ['He Bing Jiao', 'Yuta Watanabe'],            // D3
    ['Busanan Ongbamrungphan', 'Hendra Setiawan'],// D4
  ]

  const batch1 = writeBatch(db)
  const teamsRef = collection(db, 'teams')
  const grouped = { A: [], B: [], C: [], D: [] }

  players.forEach((p, i) => {
    const gIdx = Math.floor(i / 4)
    const pos  = (i % 4)
    const group = groups[gIdx]
    const teamLabel = `${group}${pos + 1}`
    const ref = doc(teamsRef)
    batch1.set(ref, {
      name: `Đội ${teamLabel}`,
      teamLabel,
      player1: p[0],
      player2: p[1],
      group,
      played: 0, won: 0, lost: 0, points: 0,
      setDifference: 0, setsFor: 0, setsAgainst: 0
    })
    grouped[group][pos] = { id: ref.id, label: teamLabel, name: `Đội ${teamLabel}` }
    console.log(`  ${teamLabel}: ${p[0]} & ${p[1]}`)
  })
  await batch1.commit()
  console.log('  ✅ Teams created.')
  console.log('\n📅 Generating round-robin schedule (6 matches per group, 4-team pattern)...')
  // 4-team round-robin: A1-A2, A3-A4 / A1-A3, A2-A4 / A1-A4, A2-A3
  const pattern = [
    { pA: 0, pB: 1, round: 1 },
    { pA: 2, pB: 3, round: 1 },
    { pA: 0, pB: 2, round: 2 },
    { pA: 1, pB: 3, round: 2 },
    { pA: 0, pB: 3, round: 3 },
    { pA: 1, pB: 2, round: 3 }
  ]

  const batch2 = writeBatch(db)
  const matchesRef = collection(db, 'matches')
  let matchOrder = 0

  groups.forEach(group => {
    const ts = grouped[group]
    pattern.forEach(({ pA, pB, round }) => {
      matchOrder++
      const ref = doc(matchesRef)
      batch2.set(ref, {
        group,
        round,
        stage: 'GROUP_STAGE',
        teamA_id: ts[pA].id,
        teamA_name: ts[pA].name,
        teamB_id: ts[pB].id,
        teamB_name: ts[pB].name,
        status: 'UPCOMING',
        matchOrder
      })
      console.log(`  T${matchOrder}: Bảng ${group} — ${ts[pA].label} vs ${ts[pB].label}`)
    })
  })
  await batch2.commit()
  console.log(`\n✅ Done! 16 teams + 24 group-stage matches created.`)
  console.log('👉 Open the app, then use "Tạo lượt 2 & chung kết" to build the ranking playoffs.')
  process.exit(0)
}

seed().catch(err => { console.error('❌ Error:', err); process.exit(1) })
