/**
 * Update team display names (funny, short) for the 16 real teams.
 * Keeps player1/player2 unchanged. Source of truth = chia_bang.jpg labels.
 * Run: FIREBASE_TOKEN=xxx node scripts/rename-teams.mjs
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

// label -> fun display name
const NAMES = {
  A1: 'Đôi Đũa Lệch',
  A2: 'Đèo Bòng Cầu Lông',
  A3: 'Song Sắt Song Sành',
  A4: 'Đôi Cánh Vàng',
  B1: 'Gió Đưa Hờn',
  B2: 'Chạy Lại Đi',
  B3: 'Tay Mơ Nhưng Chơi',
  B4: 'Anh Thanh Cả',
  C1: 'Đại Gia Đình',
  C2: 'Trường Kỳ Kháng Chiến',
  C3: 'Phong Độ Đỉnh',
  C4: 'Hoa Cười Cỏ Thơm',
  D1: 'Toàn Tôm Tắt',
  D2: 'Hai An Toàn',
  D3: 'Thức Thì Thua',
  D4: 'Thúy Kiều Tú',
}

async function run() {
  const snap = await getDocs(collection(db, 'teams'))
  const b = writeBatch(db)
  let n = 0
  snap.forEach(d => {
    const t = d.data()
    const label = t.teamLabel
    if (label && NAMES[label]) {
      b.update(doc(db, 'teams', d.id), { name: NAMES[label] })
      console.log(`  ${label}: ${t.name} -> ${NAMES[label]}`)
      n++
    }
  })
  await b.commit()
  console.log(`\n✅ Updated ${n} team names.`)
  process.exit(0)
}
run().catch(e => { console.error('❌', e); process.exit(1) })
