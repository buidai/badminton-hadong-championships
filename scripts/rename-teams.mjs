/**
 * Update team display names (short, harmonious) for the 16 real teams.
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

const NAMES = {
  A1: 'Đôi Lệch',
  A2: 'Đèo Bòng',
  A3: 'Song Sành',
  A4: 'Cánh Vàng',
  B1: 'Gió Hờn',
  B2: 'Chạy Lại',
  B3: 'Tay Mơ',
  B4: 'Anh Thanh',
  C1: 'Đại Gia',
  C2: 'Trường Kỳ',
  C3: 'Phong Độ',
  C4: 'Hoa Cỏ',
  D1: 'Tôm Tắt',
  D2: 'Hai An',
  D3: 'Thức Thua',
  D4: 'Thúy Kiều',
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
