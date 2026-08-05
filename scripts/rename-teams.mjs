/**
 * Update team display names using the REAL male player's name (accurate, traceable
 * to the seeded player list). Keeps player1/player2 unchanged.
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
  A1: 'Thành Công',
  A2: 'Tuấn Đào',
  A3: 'Minh Quang',
  A4: 'Hoàng Nam',
  B1: 'Anh Quang',
  B2: 'Nguyễn Lộc',
  B3: 'Linh',
  B4: 'Phương Nam',
  C1: 'Đại',
  C2: 'Văn Trường',
  C3: 'Phong Lê',
  C4: 'Đức Hưng',
  D1: 'Duy Toàn',
  D2: 'Hai An',
  D3: 'BT Thức',
  D4: 'Thanh Tú',
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
