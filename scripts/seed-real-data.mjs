/**
 * Seed REAL data from chia_bang.jpg (group division image) into Firestore.
 * Source of truth = chia_bang.jpg (group stage division).
 * Schedule (match order) follows round-robin 1-lap pattern (6 matches/group).
 * Run: FIREBASE_TOKEN=xxx node scripts/seed-real-data.mjs
 *  (or after `firebase login`, just: node scripts/seed-real-data.mjs)
 */
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "«reda...…»",
  authDomain: "badminton-hadong-championships.firebaseapp.com",
  projectId: "badminton-hadong-championships",
  storageBucket: "badminton-hadong-championships.firebasestorage.app",
  messagingSenderId: "342825512572",
  appId: "1:342825512572:web:9769725024b338e4d523f9"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Real pairs extracted from chia_bang.jpg (nam, nữ)
const REAL_TEAMS = [
  // Nhóm 1 -> A
  { group: 'A', label: 'A1', p1: 'Quản Thành Công', p2: 'Nguyễn Quý Thanh' },
  { group: 'A', label: 'A2', p1: 'Tuấn Đào',         p2: 'Hà Hồng' },
  { group: 'A', label: 'A3', p1: 'Phạm Minh Quang',  p2: 'Ngọc Quỳnh' },
  { group: 'A', label: 'A4', p1: 'Hoàng Nam',        p2: 'Dương Thị Thu Phương' },
  // Nhóm 2 -> B
  { group: 'B', label: 'B1', p1: 'Đặng Anh Quang',   p2: 'Thanh Thu' },
  { group: 'B', label: 'B2', p1: 'Nguyễn Lộc',       p2: 'Lê Dung' },
  { group: 'B', label: 'B3', p1: 'Linh',             p2: 'Bùi Thùy Dương' },
  { group: 'B', label: 'B4', p1: 'Nguyên Phương Nam',p2: 'An Thanh' },
  // Nhóm 3 -> C
  { group: 'C', label: 'C1', p1: 'Đại',              p2: 'Phạm Thị Thu' },
  { group: 'C', label: 'C2', p1: 'Đào Văn Trường',   p2: 'Đỗ Linh' },
  { group: 'C', label: 'C3', p1: 'Phong Lê',         p2: 'Dương Minh Ngọc' },
  { group: 'C', label: 'C4', p1: 'Đức Hưng',         p2: 'Hoa' },
  // Nhóm 4 -> D
  { group: 'D', label: 'D1', p1: 'Duy Toàn',         p2: 'Ngân Nguyễn' },
  { group: 'D', label: 'D2', p1: 'Hai An',           p2: 'Jet Tran' },
  { group: 'D', label: 'D3', p1: 'BT Thức',          p2: 'Kim Hồng' },
  { group: 'D', label: 'D4', p1: 'Phạm Thanh Tú',    p2: 'Hồng Anh' },
]

async function deleteCollection(colName) {
  const snap = await getDocs(collection(db, colName))
  if (snap.empty) { console.log(`  ${colName}: already empty`); return 0 }
  const batch = writeBatch(db)
  snap.forEach(d => batch.delete(doc(db, colName, d.id)))
  await batch.commit()
  console.log(`  ${colName}: deleted ${snap.size} docs`)
  return snap.size
}

async function seed() {
  console.log('\n🗑 Clearing Firestore...')
  await deleteCollection('teams')
  await deleteCollection('matches')

  console.log('\n👥 Seeding 16 real teams (4 groups × 4)...')
  const batch1 = writeBatch(db)
  const teamsRef = collection(db, 'teams')
  const grouped = { A: [], B: [], C: [], D: [] }
  REAL_TEAMS.forEach(t => {
    const ref = doc(teamsRef)
    batch1.set(ref, {
      name: `Đội ${t.label}`,
      teamLabel: t.label,
      player1: t.p1,
      player2: t.p2,
      group: t.group,
      played: 0, won: 0, lost: 0, points: 0,
      setDifference: 0, setsFor: 0, setsAgainst: 0
    })
    grouped[t.group].push({ id: ref.id, label: t.label, name: `Đội ${t.label}` })
    console.log(`  ${t.label}: ${t.p1} & ${t.p2}`)
  })
  await batch1.commit()
  console.log('  ✅ Teams created.')

  console.log('\n📅 Generating round-robin schedule (6 matches/group)...')
  const pattern = [
    { pA: 0, pB: 1 }, { pA: 2, pB: 3 },
    { pA: 0, pB: 2 }, { pA: 1, pB: 3 },
    { pA: 0, pB: 3 }, { pA: 1, pB: 2 }
  ]
  const batch2 = writeBatch(db)
  const matchesRef = collection(db, 'matches')
  let matchOrder = 0
  ;['A','B','C','D'].forEach(group => {
    const ts = grouped[group]
    pattern.forEach(({ pA, pB }) => {
      matchOrder++
      const ref = doc(matchesRef)
      batch2.set(ref, {
        group,
        round: Math.ceil(matchOrder / 4),
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
  console.log(`\n✅ Done! 16 teams + 24 group-stage matches seeded.`)
  console.log('👉 Open app, login admin, then use "Tạo lượt 2 & chung kết" for playoffs.')
  process.exit(0)
}

seed().catch(err => { console.error('❌ Error:', err); process.exit(1) })
