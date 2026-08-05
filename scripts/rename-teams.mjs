/**
 * Set team display names = combined "Player1 & Player2" (real members).
 * Admin can later override the `name` field (capped at 26 chars in UI).
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

const MAX = 26
const cap = s => s.length > MAX ? s.slice(0, MAX - 1) + '…' : s

async function run() {
  const snap = await getDocs(collection(db, 'teams'))
  const b = writeBatch(db)
  let n = 0
  snap.forEach(d => {
    const t = d.data()
    const combined = cap(`${t.player1 || ''} & ${t.player2 || ''}`.trim())
    b.update(doc(db, 'teams', d.id), { name: combined })
    console.log(`  ${t.teamLabel}: ${combined}`)
    n++
  })
  await b.commit()
  console.log(`\n✅ Updated ${n} team names (player1 & player2).`)
  process.exit(0)
}
run().catch(e => { console.error('❌', e); process.exit(1) })
