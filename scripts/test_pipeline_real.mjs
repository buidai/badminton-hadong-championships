/**
 * Full-pipeline logic test (READ-ONLY, in-memory simulation) using REAL seeded data.
 * Verifies: 24 group matches, per-group standings, phase2 (8), finals (8),
 * overall 1..16, and bracket pairing (Nhất A vs Nhất D, Nhất B vs Nhất C).
 * Does NOT write to Firestore. Run: node scripts/test_pipeline_real.mjs
 */
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

const cfg = { apiKey:"«reda...…»", authDomain:"badminton-hadong-championships.firebaseapp.com", projectId:"badminton-hadong-championships", storageBucket:"badminton-hadong-championships.firebasestorage.app", messagingSenderId:"342825512572", appId:"1:342825512572:web:9769725024b338e4d523f9" }
const app = initializeApp(cfg); const db = getFirestore(app)

let passed=0, failed=0
const assert=(c,m)=>{ if(c){passed++;console.log('  ✅ '+m)} else {failed++;console.error('  ❌ FAIL: '+m)} }
let _s=98765
const rnd=()=>{_s=(_s*1103515245+12345)&0x7fffffff;return _s/0x7fffffff}
const playSet=()=>{const a=rnd()>0.5;const m=2+Math.floor(rnd()*10);return a?[21,21-m]:[21-m,21]}

async function main(){
  const ts=await getDocs(collection(db,'teams'))
  const ms=await getDocs(collection(db,'matches'))
  const teams=[]; ts.forEach(d=>teams.push({id:d.id,...d.data()}))
  const matches=[]; ms.forEach(d=>matches.push({id:d.id,...d.data()}))

  console.log('\n🔵 REAL DATA: teams & schedule')
  assert(teams.length===16,`16 đội (thực tế: ${teams.length})`)
  assert(new Set(teams.map(t=>t.group)).size===4,'4 bảng A/B/C/D')
  const gs=matches.filter(m=>m.stage==='GROUP_STAGE')
  assert(gs.length===24,`24 trận vòng bảng (thực tế: ${gs.length})`)
  ;['A','B','C','D'].forEach(g=>{
    const gm=gs.filter(m=>m.group===g)
    assert(gm.length===6,`Bảng ${g}: 6 trận`)
    const cnt={}; gm.forEach(m=>{cnt[m.teamA_id]=(cnt[m.teamA_id]||0)+1;cnt[m.teamB_id]=(cnt[m.teamB_id]||0)+1})
    assert(Object.values(cnt).every(c=>c===3),`Bảng ${g}: mỗi đội 3 trận`)
    // every match ref must belong to this group
    const grpIds=new Set(teams.filter(t=>t.group===g).map(t=>t.id))
    assert(gm.every(m=>grpIds.has(m.teamA_id)&&grpIds.has(m.teamB_id)),`Bảng ${g}: team refs đúng group`)
  })

  // simulate scores in-memory
  gs.forEach(m=>{const [a,b]=playSet(); m.teamA_score=a; m.teamB_score=b; m.status='COMPLETED'})

  function standingsOf(group){
    const st={}
    teams.filter(t=>t.group===group).forEach(t=>st[t.id]={id:t.id,label:t.teamLabel,points:0,sd:0})
    gs.filter(m=>m.group===group).forEach(m=>{
      const a=Number(m.teamA_score),b=Number(m.teamB_score)
      st[m.teamA_id].sd+=a-b; st[m.teamB_id].sd+=b-a
      if(a>b)st[m.teamA_id].points++; else st[m.teamB_id].points++
    })
    return Object.values(st).sort((x,y)=>y.points-x.points||y.sd-x.sd||x.label.localeCompare(y.label))
  }
  console.log('\n🔵 Standings per group (points→sd→name)')
  ;['A','B','C','D'].forEach(g=>{
    const s=standingsOf(g)
    assert(s.length===4&&new Set(s.map(x=>x.id)).size===4,`Bảng ${g}: 4 đội không trùng`)
    assert(s[0].points>=s[3].points,`Bảng ${g}: xếp theo điểm giảm dần`)
  })

  console.log('\n🔵 Phase 2 & Finals (mirror app logic)')
  const phase2=[],finals=[]
  for(let rg=1;rg<=4;rg++){
    const leaders=['A','B','C','D'].map(g=>standingsOf(g)[rg-1])
    const pairs=[[0,3],[1,2]] // (A,D),(B,C)
    pairs.forEach(([pi,pj])=>{const [sa,sb]=playSet();const w=sa>sb?leaders[pi]:leaders[pj],l=sa>sb?leaders[pj]:leaders[pi];phase2.push({rg,w,l})})
  }
  for(let rg=1;rg<=4;rg++){
    const m=phase2.filter(x=>x.rg===rg)
    const [sw1,sw2]=playSet(),[sl1,sl2]=playSet()
    // winners bracket -> ranks (rg-1)*4+1 and +2 ; losers bracket -> +3 and +4
    finals.push({rankWinner:(rg-1)*4+1,w:sw1>sw2?m[0].w:m[1].w})
    finals.push({rankWinner:(rg-1)*4+2,w:sw1>sw2?m[1].w:m[0].w})
    finals.push({rankWinner:(rg-1)*4+3,w:sl1>sl2?m[0].l:m[1].l})
    finals.push({rankWinner:(rg-1)*4+4,w:sl1>sl2?m[1].l:m[0].l})
  }
  assert(phase2.length===8,'Lượt 2: 8 trận')
  assert(finals.length===16,'Chung kết: 16 trận phân hạng (4 rank-group × 4 ranks)')

  const rankMap={}; finals.forEach(f=>rankMap[f.rankWinner]=f.w.id)
  const ranks=Object.keys(rankMap).map(Number).sort((a,b)=>a-b)
  assert(ranks.join(',')===Array.from({length:16},(_,i)=>i+1).join(','),'Xếp hạng chung cuộc 1..16 liên tiếp')
  assert(new Set(Object.values(rankMap)).size===16,'16 đội đều có thứ hạng riêng')

  const A1=standingsOf('A')[0],D1=standingsOf('D')[0]
  assert(!!phase2.find(x=>x.rg===1&&((x.w.id===A1.id||x.l.id===A1.id)&&(x.w.id===D1.id||x.l.id===D1.id))),'Lượt 2 Nhóm 1: Nhất A gặp Nhất D ✓')
  const B1=standingsOf('B')[0],C1=standingsOf('C')[0]
  assert(!!phase2.find(x=>x.rg===1&&((x.w.id===B1.id||x.l.id===B1.id)&&(x.w.id===C1.id||x.l.id===C1.id))),'Lượt 2 Nhóm 1: Nhất B gặp Nhất C ✓')

  console.log(`\n${'='.repeat(50)}\n📊 KẾT QUẢ: ${passed} passed, ${failed} failed`)
  process.exit(failed?1:0)
}
main().catch(e=>{console.error('❌',e);process.exit(1)})
