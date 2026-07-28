import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, getDocs, writeBatch, doc, updateDoc, query, where, setDoc, onSnapshot, addDoc, orderBy } from 'firebase/firestore'
import './App.css'

function App() {
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Tab state: 'groups', 'groupStandings', 'overall', 'schedule', or 'rules'
  const [currentTab, setCurrentTab] = useState('groupStandings')
  // Local scores inputs for schedule view
  const [localScores, setLocalScores] = useState({})

  // Match edit state (allow modifying any scheduled match)
  const [selectedMatchEdit, setSelectedMatchEdit] = useState(null)
  const [matchEditData, setMatchEditData] = useState(null)

  // Clear dialog state for combined clear/reset actions
  const [addTeamModalOpen, setAddTeamModalOpen] = useState(false)
  const [addTeamForm, setAddTeamForm] = useState({ group: 'A', name: '', player1: '', player2: '' })

  // Schedule UI state
  const [scheduleGroupFilter, setScheduleGroupFilter] = useState('ALL')
  const [scheduleStageTab, setScheduleStageTab] = useState('group')

  // State quản lý việc mở/đóng Modal thông tin tuyển thủ
  const [selectedTeam, setSelectedTeam] = useState(null)
  
  // State quản lý dữ liệu đang được chỉnh sửa trong Modal
  const [editData, setEditData] = useState(null)

  // Admin auth (hardcoded, frontend-only)
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('hd_admin') === '1')
  const [adminLoginOpen, setAdminLoginOpen] = useState(false)
  const [adminForm, setAdminForm] = useState({ user: '', pass: '' })

  // MVP voting state
  const [mvpVoteOpen, setMvpVoteOpen] = useState(null)
  const [myVotes, setMyVotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hd_votes') || '{}') } catch { return {} }
  })

  // Banner config (admin editable)
  const [bannerData, setBannerData] = useState({
    title: 'HD Badminton Beer Cup 🏸',
    subtitle: 'Giải đánh đôi nam-nữ hỗn hợp • 4 Bảng • Beer & Smash!',
    imageUrl: ''
  })
  const [bannerEditOpen, setBannerEditOpen] = useState(false)
  const [bannerForm, setBannerForm] = useState({})

  // Group names config (admin editable)
  const DEFAULT_GROUP_NAMES = { A: 'Bảng A', B: 'Bảng B', C: 'Bảng C', D: 'Bảng D' }
  const [groupNames, setGroupNames] = useState(DEFAULT_GROUP_NAMES)
  const [groupNamesEditOpen, setGroupNamesEditOpen] = useState(false)
  const [groupNamesForm, setGroupNamesForm] = useState(DEFAULT_GROUP_NAMES)

  // Rules config (admin editable)
  const DEFAULT_RULES = {
    title: '📋 Thể lệ giải đấu',
    subtitle: 'HD Badminton Beer Cup — Giải cầu lông đôi nam – nữ hỗn hợp',
    sections: [
      {
        id: 'sec_1',
        title: '🏸 Quy mô & bảng đấu',
        color: '#38bdf8',
        items: [
          '16 đội tham dự, mỗi đội gồm 1 nam + 1 nữ.',
          'Chia 4 bảng A, B, C, D — mỗi bảng 4 đội.',
          'Vòng bảng: vòng tròn 1 lượt — mỗi đội đấu 3 trận, mỗi bảng 6 trận (tổng 24 trận).'
        ]
      },
      {
        id: 'sec_2',
        title: '📐 Thể thức vòng bảng',
        color: '#38bdf8',
        items: [
          'Mỗi trận đánh 1 set (ván), set tính đến 21 điểm theo luật cầu lông (đội chạm 21 điểm thắng, trừ trường hợp hòa 20-20 cần cách 2).',
          'Thắng = 1 điểm · Thua = 0 điểm (chỉ tính điểm vòng bảng để xếp hạng trong bảng).',
          'Xếp hạng bảng theo thứ tự: (1) Điểm (số trận thắng) → (2) Hiệu số điểm (tổng điểm ghi − tổng điểm thủ) → (3) Tên đội.',
          'Cuối vòng bảng, mỗi bảng xác định thứ hạng 1→4 để chia 4 nhóm phân hạng.'
        ]
      },
      {
        id: 'sec_3',
        title: '🥊 Lượt 2 — Phân hạng',
        color: '#22c55e',
        items: [
          'Kết thúc vòng bảng, 16 đội được chia làm 4 nhóm theo thứ hạng mỗi bảng:',
          '• Nhóm Hạng Nhất (A1, B1, C1, D1) → tranh hạng 1–4',
          '• Nhóm Hạng Nhì (A2, B2, C2, D2) → tranh hạng 5–8',
          '• Nhóm Hạng Ba (A3, B3, C3, D3) → tranh hạng 9–12',
          '• Nhóm Hạng Bét (A4, B4, C4, D4) → tranh hạng 13–16',
          'Lượt 2 (loại trực tiếp): Nhất A gặp Nhất D, Nhất B gặp Nhất C (tương tự các nhóm 2, 3, 4). Thắng đi tiếp, thua xuống tranh hạng thấp.'
        ]
      },
      {
        id: 'sec_4',
        title: '🏆 Lượt 3 — Chung kết phân hạng',
        color: '#f97316',
        items: [
          'Mỗi nhóm, 2 đội thắng Lượt 2 gặp nhau tranh hạng cao, 2 đội thua gặp nhau tranh hạng thấp.',
          'Kết quả: Nhóm 1 → Hạng 1–2 / 3–4 · Nhóm 2 → Hạng 5–6 / 7–8 · Nhóm 3 → Hạng 9–10 / 11–12 · Nhóm 4 → Hạng 13–14 / 15–16.',
          'Lượt 2 & Lượt 3 chỉ tính thắng/thua (không cộng điểm) — xếp hạng theo nhóm rơi vào.'
        ]
      },
      {
        id: 'sec_5',
        title: '⚠️ Quy định kỹ thuật (đặc biệt)',
        color: '#ef4444',
        items: [
          'Đây là giải đôi nam – nữ hỗn hợp, có luật riêng: Nam giao cầu sang nữ KHÔNG được đánh smash — chỉ được lob/đánh cao tay hoặc nhẹ. Vi phạm → xuất bóng, mất điểm.',
          'Nữ giao cầu hoặc đánh trả: không giới hạn kỹ thuật.',
          'Các tình huống còn lại áp dụng luật cầu lông tiêu chuẩn BWF.'
        ]
      },
      {
        id: 'sec_6',
        title: '👨‍⚖️ Trọng tài',
        color: '#8b5cf6',
        items: [
          'Vòng bảng: đội không thi đấu lượt đó làm trọng tài (vd: A1 vs A2 → trọng tài C3).',
          'Lượt 2 & Lượt 3: Ban tổ chức phân công trọng tài cho từng trận.'
        ]
      },
      {
        id: 'sec_7',
        title: '⭐ Bình chọn MVP',
        color: '#fbbf24',
        items: [
          'Mỗi trận (vòng bảng, Lượt 2, Lượt 3) có thể bình chọn 1 VĐV xuất sắc nhất (nút ⭐ trên mỗi trận).',
          'Không cần đăng nhập — mỗi người bình chọn 1 lần / trận.',
          'MVP giải = VĐV nhận nhiều phiếu nhất sau toàn giải (xem bảng xếp hạng MVP ở góc phải banner).'
        ]
      }
    ]
  }

  const [rulesData, setRulesData] = useState(DEFAULT_RULES)
  const [rulesEditOpen, setRulesEditOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(true)
  const [rulesForm, setRulesForm] = useState(DEFAULT_RULES)

  // Comments
  const [comments, setComments] = useState([])
  const [commentForm, setCommentForm] = useState({ playerName: '', text: '' })

  // ─── Toast notifications (modern non-blocking replacement for alert) ───
  const [toasts, setToasts] = useState([])
  const toast = (message, type) => {
    const t = typeof message === 'string' ? message : String(message)
    const inferred = type || (/❌|lỗi|không|thất bại|sai/i.test(t) ? 'error' : /✅|thành công|đã|cập nhật/i.test(t) ? 'success' : 'info')
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message: t, type: inferred }])
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3400)
  }

  const fetchTeams = async () => {
    const querySnapshot = await getDocs(collection(db, "teams"))
    const teamsData = []
    querySnapshot.forEach((doc) => {
      teamsData.push({ id: doc.id, ...doc.data() })
    })
    setTeams(teamsData)
  }

  const fetchMatches = async () => {
    const querySnapshot = await getDocs(collection(db, "matches"))
    const matchesData = []
    querySnapshot.forEach((doc) => {
      matchesData.push({ id: doc.id, ...doc.data() })
    })
    matchesData.sort((a, b) => a.matchOrder - b.matchOrder)
    setMatches(matchesData)
  }

  useEffect(() => {
    fetchTeams()

    // Real-time listener for matches (enables live MVP/score updates)
    const unsubMatches = onSnapshot(collection(db, 'matches'), snap => {
      const data = []
      snap.forEach(d => data.push({ id: d.id, ...d.data() }))
      data.sort((a, b) => (a.matchOrder || 0) - (b.matchOrder || 0))
      setMatches(data)
    }, err => console.error('matches listener:', err))

    // Load banner config (real-time)
    const bannerRef = doc(db, 'config', 'banner')
    const unsubBanner = onSnapshot(bannerRef, snap => {
      if (snap.exists()) setBannerData(snap.data())
    })

    // Load rules config (real-time)
    const rulesRef = doc(db, 'config', 'rules')
    const unsubRules = onSnapshot(rulesRef, snap => {
      if (snap.exists()) {
        setRulesData(snap.data())
      } else {
        setDoc(rulesRef, DEFAULT_RULES).catch(e => console.error('Rules init error:', e))
      }
    })

    // Load group names config (real-time)
    const groupNamesRef = doc(db, 'config', 'groupNames')
    const unsubGroupNames = onSnapshot(groupNamesRef, snap => {
      if (snap.exists()) setGroupNames(prev => ({ ...prev, ...snap.data() }))
    })

    // Load comments (real-time, newest first)
    let unsubComments = () => {}
    try {
      const cq = query(collection(db, 'comments'), orderBy('timestamp', 'desc'))
      unsubComments = onSnapshot(cq, snap => {
        const data = []
        snap.forEach(d => data.push({ id: d.id, ...d.data() }))
        setComments(data.slice(0, 40))
      })
    } catch(e) { console.error('comments listener:', e) }

    // Expose simulation for end-to-end testing
    window.simulateTournament = async () => {
      console.log("🚀 Bắt đầu giả lập toàn bộ trận đấu...")
      try {
        let active = true
        while (active) {
          const snap = await getDocs(collection(db, 'matches'))
          const allMatches = []
          snap.forEach(d => allMatches.push({ id: d.id, ...d.data() }))
          
          const teamsSnap = await getDocs(collection(db, 'teams'))
          const allTeams = []
          teamsSnap.forEach(d => allTeams.push({ id: d.id, ...d.data() }))

          const upcoming = allMatches.filter(m => m.status === 'UPCOMING')
          if (upcoming.length === 0) {
            console.log("✅ Không còn trận UPCOMING, kết thúc giả lập.")
            break
          }
          const b = writeBatch(db)
          upcoming.forEach(m => {
            const aWins = Math.random() > 0.5
            
            // Random MVP logic
            const tA = allTeams.find(t => t.id === m.teamA_id)
            const tB = allTeams.find(t => t.id === m.teamB_id)
            const players = [tA?.player1, tA?.player2, tB?.player1, tB?.player2].filter(Boolean)
            const randomPlayer = players.length ? players[Math.floor(Math.random() * players.length)] : null
            const mvpVotes = randomPlayer ? { [randomPlayer]: Math.floor(Math.random() * 20) + 1 } : {}

            b.update(doc(db, 'matches', m.id), {
              teamA_score: aWins ? 21 : Math.floor(Math.random()*10)+10,
              teamB_score: aWins ? Math.floor(Math.random()*10)+10 : 21,
              status: 'COMPLETED',
              mvpVotes
            })
          })
          await b.commit()
          console.log(`Đã mô phỏng ${upcoming.length} trận (có vote MVP). Chờ 2s để hệ thống xử lý PENDING_SOURCE...`)
          await new Promise(r => setTimeout(r, 2000)) // wait for useEffect to resolve PENDING_SOURCE
        }
        console.log("🎉 Hoàn tất toàn bộ giải đấu!")
        return true
      } catch (e) {
        console.error("Lỗi giả lập:", e)
        return false
      }
    }

    return () => { unsubMatches(); unsubBanner(); unsubRules(); unsubGroupNames(); unsubComments(); delete window.simulateTournament }
  }, [])

  // Auto-triggers removed to prevent race-condition duplicates.
  // Admin manually triggers schedule generation via the hero admin buttons.

  // Build groupedTeams with deduplication (show only unique teamLabel per group)
  const groupedTeams = { A: [], B: [], C: [], D: [] }
  const _seen = { A: new Set(), B: new Set(), C: new Set(), D: new Set() }
  teams.forEach(team => {
    const g = team.group
    if (groupedTeams[g]) {
      const key = team.teamLabel || team.name || team.id
      if (!_seen[g].has(key)) {
        groupedTeams[g].push(team)
        _seen[g].add(key)
      }
    }
  })
  // Ensure groups are consistently ordered by teamLabel if present
  Object.keys(groupedTeams).forEach(g => {
    groupedTeams[g].sort((a,b) => {
      const la = a.teamLabel || a.name || ''
      const lb = b.teamLabel || b.name || ''
      return la.localeCompare(lb)
    })
  })
 
  const groupColors = {
    A: '#2563eb',
    B: '#16a34a',
    C: '#ef4444',
    D: '#8b5cf6',
    PHASE2: '#f59e0b',
    FINAL: '#db2777',
    DEFAULT: '#64748b'
  }
 
  const hexToRgba = (hex, alpha = 0.16) => {
    const normalized = hex.replace('#', '')
    const bigint = parseInt(normalized, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
 
  const getGroupColor = (group) => groupColors[group] || groupColors.DEFAULT
  const getMatchColor = (match) => match.stage === 'FINAL' ? groupColors.FINAL : getGroupColor(match.group)
  
  const sortedMatches = [...matches].sort((a,b) => (a.matchOrder || 0) - (b.matchOrder || 0))
  
  const scheduleFilters = ['ALL', 'A', 'B', 'C', 'D']

  // Helper: lấy tên hiển thị cho bảng đấu (hỗ trợ tên custom)
  const getGroupDisplayName = (group) => groupNames[group] || `Bảng ${group}`

  // Xếp hạng chung cuộc: dựa trên kết quả trận phân hạng (Lượt 3)
  // Label 23 → Hạng 1-2, Label 24 → Hạng 3-4, Label 21 → Hạng 5-6,
  // Label 22 → Hạng 7-8, Label 19 → Hạng 9-10, Label 20 → Hạng 11-12
  const computeOverallStandings = () => {
    // Tính stats từ tất cả trận (group + phase2 + final)
    const stats = {}
    teams.forEach(t => {
      stats[t.id] = {
        id: t.id,
        name: t.name,
        teamLabel: t.teamLabel,
        player1: t.player1,
        player2: t.player2,
        group: t.group,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        setsFor: 0,
        setsAgainst: 0,
        setDifference: 0,
        finalRank: 99 // default: chưa xếp hạng
      }
    })

    matches.forEach(m => {
      const aId = m.teamA_id
      const bId = m.teamB_id
      const aScore = m.teamA_score
      const bScore = m.teamB_score
      if (aId == null || bId == null || aScore == null || bScore == null || aScore === '' || bScore === '') return
      const a = Number(aScore)
      const b = Number(bScore)
      if (!(aId in stats) || !(bId in stats)) return

      stats[aId].played += 1
      stats[bId].played += 1
      stats[aId].setsFor += a
      stats[aId].setsAgainst += b
      stats[bId].setsFor += b
      stats[bId].setsAgainst += a

      if (a > b) {
        stats[aId].won += 1
        stats[bId].lost += 1
        stats[aId].points += 1
      } else if (b > a) {
        stats[bId].won += 1
        stats[aId].lost += 1
        stats[bId].points += 1
      }
    })

    // Gán finalRank từ kết quả các trận phân hạng cuối (Lượt 3 - FINAL)
    // Dynamic: đọc rankWinner/rankLoser từ match data (không hardcode)
    matches.forEach(m => {
      if (m.stage !== 'FINAL') return
      if (m.rankWinner == null || m.rankLoser == null) return
      const aScore = m.teamA_score
      const bScore = m.teamB_score
      if (aScore == null || bScore == null || aScore === '' || bScore === '') return
      const a = Number(aScore)
      const b = Number(bScore)
      const winnerId = a > b ? m.teamA_id : m.teamB_id
      const loserId = a > b ? m.teamB_id : m.teamA_id
      if (winnerId && stats[winnerId]) stats[winnerId].finalRank = m.rankWinner
      if (loserId && stats[loserId]) stats[loserId].finalRank = m.rankLoser
    })

    return Object.values(stats).map(s => ({
      ...s,
      setDifference: s.setsFor - s.setsAgainst
    })).sort((a, b) => {
      // Nếu có finalRank (từ trận phân hạng), ưu tiên theo finalRank
      if (a.finalRank !== b.finalRank) return a.finalRank - b.finalRank
      // Fallback: điểm, hiệu số, tên
      if (b.points !== a.points) return b.points - a.points
      if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference
      return a.name.localeCompare(b.name)
    })
  }
  const filteredMatches = sortedMatches.filter(m => {
    if (scheduleGroupFilter === 'ALL') return true
    return scheduleGroupFilter === 'PHASE2' ? m.group === 'PHASE2' : m.group === scheduleGroupFilter
  })
  const groupStageMatches = filteredMatches.filter(m => m.stage === 'GROUP_STAGE')
  const phase2Matches = filteredMatches.filter(m => m.stage === 'PHASE2')
  const finalMatches = filteredMatches.filter(m => m.stage === 'FINAL')

  // 1. TẠO DATA CÓ THÊM THÔNG TIN (Dùng tên chung chung làm ví dụ)
  const generateMockTeams = async () => {
    setLoading(true)
    try {
      const batch = writeBatch(db)
      const teamsRef = collection(db, "teams")

      // Tạo 16 đội mẫu → 4 bảng x 4 đội. Mỗi đội có tên đội (A1..D4) và 2 vận động viên
      const TEAMS_PER_GROUP = 4
      const groups = ["A", "B", "C", "D"]
      const totalTeams = groups.length * TEAMS_PER_GROUP
      // Clear existing teams and matches first
      try {
        const teamsSnap = await getDocs(collection(db, 'teams'))
        const matchesSnap = await getDocs(collection(db, 'matches'))
        const batchDel = writeBatch(db)
        teamsSnap.forEach(d => batchDel.delete(doc(db, 'teams', d.id)))
        matchesSnap.forEach(d => batchDel.delete(doc(db, 'matches', d.id)))
        await batchDel.commit()
      } catch (err) {
        console.error('Lỗi khi xóa dữ liệu cũ:', err)
      }

      const mockPlayers = Array.from({ length: totalTeams }, (_, i) => {
        return { p1: `VĐV ${i*2+1}`, p2: `VĐV ${i*2+2}` }
      })

      mockPlayers.forEach((p, index) => {
        const groupIndex = Math.floor(index / TEAMS_PER_GROUP)
        const teamLabel = `${groups[groupIndex]}${(index % TEAMS_PER_GROUP) + 1}` // A1..A4, B1..B4
        const newTeamRef = doc(teamsRef)
        batch.set(newTeamRef, {
          name: `Đội ${teamLabel}`,
          teamLabel: teamLabel,
          player1: p.p1,
          player2: p.p2,
          department: "Phòng ban / Dự án",
          group: groups[groupIndex],
          played: 0, won: 0, lost: 0, points: 0, setDifference: 0, setsFor: 0, setsAgainst: 0
        })
      })

      await batch.commit()
      toast(`🎉 Đã xóa dữ liệu cũ và tạo mới ${totalTeams} cặp đấu mẫu (4 bảng x ${TEAMS_PER_GROUP} đội)!`)
      fetchTeams()
    } catch (error) {
      console.error("Lỗi tạo dữ liệu: ", error)
    }
    setLoading(false)
  }

  // Clear only teams collection
  const openAddTeamModal = (group = 'A') => {
    setAddTeamForm({ group, name: '', player1: '', player2: '' })
    setAddTeamModalOpen(true)
  }

  const handleSaveNewTeam = async () => {
    if (!addTeamForm.name || !addTeamForm.player1 || !addTeamForm.player2) {
      toast('Vui lòng điền đủ tên đội và tên 2 vận động viên')
      return
    }

    setLoading(true)
    try {
      const teamLabelCount = (groupedTeams[addTeamForm.group] || []).length + 1
      const teamLabel = `${addTeamForm.group}${teamLabelCount}`
      const newTeamRef = doc(collection(db, 'teams'))
      await setDoc(newTeamRef, {
        name: addTeamForm.name,
        teamLabel,
        player1: addTeamForm.player1,
        player2: addTeamForm.player2,
        department: '',
        group: addTeamForm.group,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        setDifference: 0,
        setsFor: 0,
        setsAgainst: 0
      })
      toast(`✅ Đã thêm đội ${addTeamForm.name} vào bảng ${addTeamForm.group}`)
      fetchTeams()
      setAddTeamModalOpen(false)
    } catch (err) {
      console.error('Lỗi thêm đội mới:', err)
      toast('Lỗi khi thêm đội mới. Vui lòng thử lại.')
    }
    setLoading(false)
  }

  // 2. LOGIC TẠO LỊCH THI ĐẤU (Hỗ trợ bảng 3 hoặc 4 đội round-robin)
  const generateSchedule = async () => {
    // Kiểm tra mỗi bảng có ít nhất 3 đội
    const minTeamsPerGroup = Math.min(...['A','B','C','D'].map(g => (groupedTeams[g] || []).length))
    if (minTeamsPerGroup < 3) {
        toast(`Mỗi bảng cần ít nhất 3 đội. Hiện tại bảng nhỏ nhất chỉ có ${minTeamsPerGroup} đội.`); return;
      }
      setLoading(true)
      try {
        const batch = writeBatch(db)
        const matchesRef = collection(db, "matches")
        
        // --- Xóa lịch thi đấu vòng bảng cũ trước khi tạo mới để tránh duplicate ---
        const oldMatchesSnap = await getDocs(query(matchesRef, where('stage', '==', 'GROUP_STAGE')))
        oldMatchesSnap.forEach(d => {
          batch.delete(doc(db, 'matches', d.id))
        })
        
        // Pattern cho bảng 3 đội: 3 trận (round 1..3)
        const pattern3 = [
          { pA: 0, pB: 1, round: 1 },
          { pA: 1, pB: 2, round: 2 },
          { pA: 0, pB: 2, round: 3 }
        ]

        // Pattern cho bảng 4 đội (hỗ trợ nếu có)
        const pattern4 = [
          { pA: 0, pB: 1, round: 1 }, { pA: 2, pB: 3, round: 1 },
          { pA: 0, pB: 2, round: 2 }, { pA: 1, pB: 3, round: 2 },
          { pA: 0, pB: 3, round: 3 }, { pA: 1, pB: 2, round: 3 }
        ]
        
        const groups = ["A", "B", "C", "D"]
        let matchCount = 0
  
        groups.forEach(group => {
          const currentGroupTeams = groupedTeams[group] || []
          if (currentGroupTeams.length === 3) {
            pattern3.forEach(({pA, pB, round}) => {
              const newMatchRef = doc(matchesRef)
              matchCount++
              batch.set(newMatchRef, {
                label: matchCount,
                group: group,
                round: round,
                stage: "GROUP_STAGE",
                teamA_id: currentGroupTeams[pA].id,
                teamA_name: currentGroupTeams[pA].name,
                teamB_id: currentGroupTeams[pB].id,
                teamB_name: currentGroupTeams[pB].name,
                status: "UPCOMING",
                matchOrder: matchCount
              })
            })
          } else if (currentGroupTeams.length === 4) {
            pattern4.forEach(({pA, pB, round}) => {
              const newMatchRef = doc(matchesRef)
              matchCount++
              batch.set(newMatchRef, {
                label: matchCount,
                group: group,
                round: round,
                stage: "GROUP_STAGE",
                teamA_id: currentGroupTeams[pA].id,
                teamA_name: currentGroupTeams[pA].name,
                teamB_id: currentGroupTeams[pB].id,
                teamB_name: currentGroupTeams[pB].name,
                status: "UPCOMING",
                matchOrder: matchCount
              })
            })
          }
        })
  
        await batch.commit()
        toast("🔥 Đã tạo thành công lịch thi đấu vòng tròn cho các bảng!")
      } catch (error) {
        console.error("Lỗi tạo lịch thi đấu: ", error)
      }
      setLoading(false)
  }

  // Administrative Rules Editing Handlers
  const handleOpenRulesEdit = () => {
    setRulesForm(JSON.parse(JSON.stringify(rulesData)))
    setRulesEditOpen(true)
  }

  const handleSaveRules = async () => {
    setLoading(true)
    try {
      const rulesRef = doc(db, 'config', 'rules')
      await setDoc(rulesRef, rulesForm)
      toast('🎉 Đã cập nhật thể lệ giải đấu thành công!')
      setRulesEditOpen(false)
    } catch (error) {
      console.error('Lỗi khi lưu thể lệ:', error)
      toast('❌ Có lỗi khi lưu thể lệ: ' + error.message)
    }
    setLoading(false)
  }

  const handleAddRuleSection = () => {
    const newSec = {
      id: 'sec_' + Date.now(),
      title: '📌 Quy định bổ sung',
      color: '#38bdf8',
      items: ['Nhập điều khoản thứ nhất...', 'Nhập điều khoản thứ hai...']
    }
    setRulesForm(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSec]
    }))
  }

  const handleRemoveRuleSection = (secId) => {
    setRulesForm(prev => ({
      ...prev,
      sections: (prev.sections || []).filter(s => s.id !== secId)
    }))
  }

  const handleSectionChange = (index, field, value) => {
    setRulesForm(prev => {
      const updated = [...(prev.sections || [])]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, sections: updated }
    })
  }

  const handleSectionItemsChange = (index, textValue) => {
    const itemsArray = textValue.split('\n').filter(line => line.trim() !== '')
    setRulesForm(prev => {
      const updated = [...(prev.sections || [])]
      updated[index] = { ...updated[index], items: itemsArray }
      return { ...prev, sections: updated }
    })
  }

  const handleResetDefaultRules = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục thể lệ về mặc định ban đầu?')) {
      setRulesForm(JSON.parse(JSON.stringify(DEFAULT_RULES)))
    }
  }

  // Hàm tổng hợp các trận trong 1 bảng để tính xếp hạng (dựa trên matches state)
  const computeStandingsForGroup = (group) => {
    const teamsInGroup = groupedTeams[group] || []
    const map = {}
    teamsInGroup.forEach(t => {
      map[t.id] = {
        id: t.id,
        name: t.name,
        teamLabel: t.teamLabel,
        player1: t.player1,
        player2: t.player2,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        setDifference: 0,
        setsFor: 0,
        setsAgainst: 0
      }
    })

    const WIN_POINTS = 1 // per PDF: thắng = 1 điểm, thua = 0

    matches.forEach(m => {
      if (m.group !== group) return
      if (m.stage !== 'GROUP_STAGE') return
      const aId = m.teamA_id
      const bId = m.teamB_id
      const aScore = m.teamA_score
      const bScore = m.teamB_score
      if (aScore == null || bScore == null || aScore === '' || bScore === '') return
      const a = Number(aScore)
      const b = Number(bScore)
      if (!(aId in map) || !(bId in map)) return

      map[aId].played += 1
      map[bId].played += 1
      map[aId].setsFor += a
      map[aId].setsAgainst += b
      map[bId].setsFor += b
      map[bId].setsAgainst += a

      map[aId].setDifference = map[aId].setsFor - map[aId].setsAgainst
      map[bId].setDifference = map[bId].setsFor - map[bId].setsAgainst

      if (a > b) {
        map[aId].won += 1
        map[bId].lost += 1
        map[aId].points += WIN_POINTS
      } else if (b > a) {
        map[bId].won += 1
        map[aId].lost += 1
        map[bId].points += WIN_POINTS
      }
    })

    const groupMatches = matches.filter(m => m.group === group && m.stage === 'GROUP_STAGE')

    // Head-to-head: return +1 if xId beat yId, -1 if yId beat xId, 0 if not played
    const getH2H = (xId, yId) => {
      const m = groupMatches.find(m =>
        (m.teamA_id === xId && m.teamB_id === yId) ||
        (m.teamA_id === yId && m.teamB_id === xId)
      )
      if (!m || m.teamA_score == null || m.teamB_score == null) return 0
      const sa = Number(m.teamA_score), sb = Number(m.teamB_score)
      if (m.teamA_id === xId) return sa > sb ? 1 : sa < sb ? -1 : 0
      return sb > sa ? 1 : sb < sa ? -1 : 0
    }

    // Xếp hạng: 1) Điểm, 2) Đối đầu (chỉ 2 đội bằng điểm), 3) Hiệu số điểm
    // Khi 3 đội bằng điểm VÀ H2H vòng tròn → bỏ qua H2H, dùng hiệu số
    const teamsList = Object.values(map)

    // Nhóm đội theo điểm để detect circular H2H
    const pointsGroups = {}
    teamsList.forEach(t => {
      const key = t.points || 0
      if (!pointsGroups[key]) pointsGroups[key] = []
      pointsGroups[key].push(t.id)
    })

    // Kiểm tra circular H2H trong nhóm: nếu MỌI đội đều thắng 1 đội khác trong nhóm
    const isCircularH2H = (teamIds) => {
      if (teamIds.length <= 2) return false
      // Circular khi mỗi đội thắng ít nhất 1 đội khác trong nhóm VÀ thua ít nhất 1
      for (const tid of teamIds) {
        const winsInGroup = teamIds.filter(oid => oid !== tid && getH2H(tid, oid) === 1).length
        const lossInGroup = teamIds.filter(oid => oid !== tid && getH2H(tid, oid) === -1).length
        if (winsInGroup === 0 || lossInGroup === 0) return false
      }
      return true
    }

    // Build set of circular groups
    const circularPointsKeys = new Set()
    Object.entries(pointsGroups).forEach(([pts, ids]) => {
      if (isCircularH2H(ids)) circularPointsKeys.add(Number(pts))
    })

    return teamsList.sort((a, b) => {
      if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0)
      // Nếu nhóm điểm này là circular H2H → skip H2H, dùng hiệu số
      if (!circularPointsKeys.has(a.points || 0)) {
        const h2h = getH2H(a.id, b.id)
        if (h2h !== 0) return -h2h // a beat b → a first (return negative)
      }
      if ((b.setDifference || 0) !== (a.setDifference || 0)) return (b.setDifference || 0) - (a.setDifference || 0)
      return (a.name || '').localeCompare(b.name || '')
    })
  }

  // Admin login helpers
  const handleAdminLogin = () => {
    if (adminForm.user === 'admin' && adminForm.pass === 'HDbadminton') {
      localStorage.setItem('hd_admin', '1')
      setIsAdmin(true)
      setAdminLoginOpen(false)
      setAdminForm({ user: '', pass: '' })
    } else {
      toast('❌ Sai thông tin đăng nhập')
    }
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('hd_admin')
    setIsAdmin(false)
  }

  // Parse score text: "21-19", "21,19", "21" → number
  const parseScoreNum = (val) => {
    if (val === '' || val == null) return null
    const n = Number(String(val).trim())
    if (!isNaN(n)) return n
    return null
  }

  // For combined "21-19" input per match: parse both sides
  const parseScoreText = (text) => {
    if (!text || String(text).trim() === '') return { a: null, b: null }
    const parts = String(text).split(/[-–,/]/).map(s => s.trim())
    if (parts.length >= 2) {
      const a = parseInt(parts[0])
      const b = parseInt(parts[1])
      if (!isNaN(a) && !isNaN(b)) return { a, b }
    }
    const single = parseInt(String(text).trim())
    return isNaN(single) ? { a: null, b: null } : { a: single, b: null }
  }

  // Get display text for a match score
  const getScoreDisplayText = (matchId, matchObj) => {
    const local = localScores[matchId]
    if (local?.text !== undefined) return local.text
    if (matchObj?.teamA_score != null && matchObj?.teamB_score != null) {
      return `${matchObj.teamA_score} - ${matchObj.teamB_score}`
    }
    return ''
  }

  // MVP vote handler
  const handleMvpVote = async (match, playerName) => {
    const key = `${match.id}`
    if (myVotes[key]) {
      toast('Bạn đã bình chọn cho trận này rồi!')
      return
    }
    try {
      const matchRef = doc(db, 'matches', match.id)
      const currentVotes = match.mvpVotes || {}
      const newVotes = { ...currentVotes, [playerName]: (currentVotes[playerName] || 0) + 1 }
      await updateDoc(matchRef, { mvpVotes: newVotes })
      const updatedVotes = { ...myVotes, [key]: playerName }
      setMyVotes(updatedVotes)
      localStorage.setItem('hd_votes', JSON.stringify(updatedVotes))
      setMatches(prev => prev.map(m => m.id === match.id ? { ...m, mvpVotes: newVotes } : m))
      setMvpVoteOpen(null)
      toast(`✅ Đã bình chọn MVP: ${playerName}`)
    } catch (err) {
      console.error('Lỗi bình chọn MVP:', err)
    }
  }

  // Lưu tạm điểm khi nhập ở UI
  const handleScoreChange = (matchId, value) => {
    setLocalScores(prev => ({ ...prev, [matchId]: { text: value } }))
  }

  // Lưu kết quả trận vào Firestore và cập nhật thống kê đội
  const handleSaveMatchResult = async (match) => {
    const scoreText = localScores[match.id]?.text
    let a, b

    if (scoreText !== undefined) {
      const parsed = parseScoreText(scoreText)
      a = parsed.a; b = parsed.b
    } else {
      a = match.teamA_score != null ? Number(match.teamA_score) : null
      b = match.teamB_score != null ? Number(match.teamB_score) : null
    }

    if (a == null || b == null || Number.isNaN(a) || Number.isNaN(b)) {
      toast('Vui lòng nhập tỉ số hợp lệ (ví dụ: 21-19 hoặc 21,19)')
      return
    }

    try {
      const matchRef = doc(db, 'matches', match.id)
      const updatePayload = { teamA_score: a, teamB_score: b, status: 'COMPLETED' }
      await updateDoc(matchRef, updatePayload)

      const updatedMatches = matches.map(m => m.id === match.id ? { ...m, teamA_score: a, teamB_score: b, status: 'COMPLETED' } : m)
      await recomputeAndUpdateTeams(updatedMatches)
      fetchTeams()
      setLocalScores(prev => ({ ...prev, [match.id]: { a: '', b: '' } }))

      // nếu match có label, cố gắng resolve các trận phụ thuộc
      try {
        if (match.label != null) {
          await resolveDependentMatchesByLabel(match.label)
        }
      } catch (e) {
        console.error('Lỗi khi resolve trận phụ thuộc:', e)
      }

      toast('✅ Đã lưu kết quả và cập nhật thống kê')
    } catch (err) {
      console.error('Lỗi lưu kết quả:', err)
      toast('Lỗi khi lưu kết quả. Vui lòng thử lại.')
    }
  }

  // Tính lại toàn bộ thống kê từ matches và cập nhật collection teams
  const recomputeAndUpdateTeams = async (matchesData) => {
    const WIN_POINTS = 1 // per PDF
    const stats = {}
    // khởi tạo từ teams hiện tại
    teams.forEach(t => {
      stats[t.id] = { id: t.id, name: t.name, played: 0, won: 0, lost: 0, points: 0, setsFor: 0, setsAgainst: 0, setDifference: 0 }
    })

    matchesData.forEach(m => {
      if (m.stage !== 'GROUP_STAGE') return
      const aId = m.teamA_id
      const bId = m.teamB_id
      const aScore = m.teamA_score
      const bScore = m.teamB_score
      if (aScore == null || bScore == null || aScore === '' || bScore === '') return
      const a = Number(aScore); const b = Number(bScore)
      if (!(aId in stats) || !(bId in stats)) return

      stats[aId].played += 1
      stats[bId].played += 1
      stats[aId].setsFor += a
      stats[aId].setsAgainst += b
      stats[bId].setsFor += b
      stats[bId].setsAgainst += a

      if (a > b) {
        stats[aId].won += 1
        stats[bId].lost += 1
        stats[aId].points += WIN_POINTS
      } else if (b > a) {
        stats[bId].won += 1
        stats[aId].lost += 1
        stats[bId].points += WIN_POINTS
      }
    })

    // finalize setDifference
    Object.values(stats).forEach(s => { s.setDifference = s.setsFor - s.setsAgainst })

    // write batch updates to teams
    try {
      const batch = writeBatch(db)
      Object.values(stats).forEach(s => {
        const teamRef = doc(db, 'teams', s.id)
        batch.update(teamRef, {
          played: s.played,
          won: s.won,
          lost: s.lost,
          points: s.points,
          setDifference: s.setDifference,
          setsFor: s.setsFor,
          setsAgainst: s.setsAgainst
        })
      })
      await batch.commit()
    } catch (err) {
      console.error('Lỗi cập nhật thống kê đội:', err)
    }
  }

  // Sinh Lượt 2 (Phân hạng) và các trận chung kết phân hạng — dynamic cho 3 hoặc 4 đội/bảng
  const generatePhase2AndFinals = async () => {
    const groups = ['A','B','C','D']
    const standingsMap = {}
    groups.forEach(g => {
      standingsMap[g] = computeStandingsForGroup(g)
    })

    // Xác định số đội mỗi bảng (lấy min)
    const teamsPerGroup = Math.min(...groups.map(g => (standingsMap[g] || []).length))
    if (teamsPerGroup < 3) {
      toast(`Mỗi bảng cần ít nhất 3 đội. Hiện tại bảng nhỏ nhất chỉ có ${teamsPerGroup} đội.`)
      return
    }

    setLoading(true)
    try {
      const batch = writeBatch(db)
      const matchesRef = collection(db, 'matches')

      // --- Xóa các trận Phase 2 và Final cũ trước khi tạo mới ---
      const oldPhase2 = await getDocs(query(matchesRef, where('stage', '==', 'PHASE2')))
      oldPhase2.forEach(d => batch.delete(doc(db, 'matches', d.id)))
      const oldFinals = await getDocs(query(matchesRef, where('stage', '==', 'FINAL')))
      oldFinals.forEach(d => batch.delete(doc(db, 'matches', d.id)))

      // matchOrder bắt đầu từ tổng số trận vòng bảng
      const groupStageCount = matches.filter(m => m.stage === 'GROUP_STAGE').length
      let labelCounter = groupStageCount
      let matchOrderCounter = groupStageCount

      // === PHASE 2: Tạo cặp đấu theo hạng (bét → nhất) ===
      // Hạng R: A[R-1] ↔ D[R-1], B[R-1] ↔ C[R-1]
      const phase2Labels = [] // lưu [{label, rank, pair:'AD'|'BC'}]

      for (let rank = teamsPerGroup; rank >= 1; rank--) {
        const rankIdx = rank - 1 // index trong standings array

        // Cặp A ↔ D
        labelCounter++
        matchOrderCounter++
        const labelAD = labelCounter
        const aTeamAD = standingsMap['A'][rankIdx]
        const dTeamAD = standingsMap['D'][rankIdx]
        batch.set(doc(matchesRef), {
          label: labelAD,
          group: 'PHASE2',
          round: null,
          stage: 'PHASE2',
          teamA_id: aTeamAD.id,
          teamA_name: aTeamAD.name,
          teamB_id: dTeamAD.id,
          teamB_name: dTeamAD.name,
          status: 'UPCOMING',
          matchOrder: matchOrderCounter,
          rankGroup: rank
        })
        phase2Labels.push({ label: labelAD, rank, pair: 'AD' })

        // Cặp B ↔ C
        labelCounter++
        matchOrderCounter++
        const labelBC = labelCounter
        const bTeamBC = standingsMap['B'][rankIdx]
        const cTeamBC = standingsMap['C'][rankIdx]
        batch.set(doc(matchesRef), {
          label: labelBC,
          group: 'PHASE2',
          round: null,
          stage: 'PHASE2',
          teamA_id: bTeamBC.id,
          teamA_name: bTeamBC.name,
          teamB_id: cTeamBC.id,
          teamB_name: cTeamBC.name,
          status: 'UPCOMING',
          matchOrder: matchOrderCounter,
          rankGroup: rank
        })
        phase2Labels.push({ label: labelBC, rank, pair: 'BC' })
      }

      // === FINALS: Chung kết phân hạng ===
      // Mỗi nhóm hạng R → 2 trận final:
      //   Winner(AD) vs Winner(BC) → Hạng [(R-1)*4+1, (R-1)*4+2]
      //   Loser(AD) vs Loser(BC)  → Hạng [(R-1)*4+3, (R-1)*4+4]
      for (let rank = teamsPerGroup; rank >= 1; rank--) {
        const adLabel = phase2Labels.find(p => p.rank === rank && p.pair === 'AD').label
        const bcLabel = phase2Labels.find(p => p.rank === rank && p.pair === 'BC').label
        const baseRank = (rank - 1) * 4 + 1

        // Trận Winner: Thắng AD vs Thắng BC
        labelCounter++
        matchOrderCounter++
        batch.set(doc(matchesRef), {
          label: labelCounter,
          group: 'PHASE2',
          round: null,
          stage: 'FINAL',
          sourceA: adLabel,
          sourceB: bcLabel,
          teamA_id: null,
          teamA_name: `Hạng ${baseRank}-${baseRank + 1} (A)`,
          teamB_id: null,
          teamB_name: `Hạng ${baseRank}-${baseRank + 1} (B)`,
          status: 'PENDING_SOURCE',
          matchOrder: matchOrderCounter,
          rankWinner: baseRank,
          rankLoser: baseRank + 1
        })

        // Trận Loser: Thua AD vs Thua BC
        labelCounter++
        matchOrderCounter++
        batch.set(doc(matchesRef), {
          label: labelCounter,
          group: 'PHASE2',
          round: null,
          stage: 'FINAL',
          sourceA: 'loser' + adLabel,
          sourceB: 'loser' + bcLabel,
          teamA_id: null,
          teamA_name: `Hạng ${baseRank + 2}-${baseRank + 3} (A)`,
          teamB_id: null,
          teamB_name: `Hạng ${baseRank + 2}-${baseRank + 3} (B)`,
          status: 'PENDING_SOURCE',
          matchOrder: matchOrderCounter,
          rankWinner: baseRank + 2,
          rankLoser: baseRank + 3
        })
      }

      await batch.commit()
      const totalPhase2 = teamsPerGroup * 2
      const totalFinals = teamsPerGroup * 2
      toast(`✅ Đã tạo ${totalPhase2} trận Lượt 2 + ${totalFinals} trận Chung kết phân hạng (${teamsPerGroup} đội/bảng). Tổng: ${totalPhase2 + totalFinals} trận mới.`)
    } catch (err) {
      console.error('Lỗi tạo Lượt 2:', err)
      toast('Lỗi khi tạo Lượt 2. Vui lòng thử lại.')
    }
    setLoading(false)
  }

  // 3. HÀM MỞ MODAL VÀ CHUẨN BỊ DỮ LIỆU ĐỂ SỬA
  const handleOpenEditModal = (team) => {
    const actualTeam = teams.find(t => t.id === team.id) || team
    setSelectedTeam(actualTeam)
    // Copy dữ liệu đội sang state editData để chỉnh sửa mà chưa lưu ngay
    setEditData({ ...actualTeam })
  }

  // 4. HÀM LƯU THÔNG TIN ĐÃ SỬA LÊN FIREBASE
  const handleSaveTeamEdit = async () => {
    if (!editData) return;
    
    try {
      const teamRef = doc(db, "teams", editData.id)
      const payload = {
        name: editData.name || '',
        player1: editData.player1 || '',
        player2: editData.player2 || '',
        department: editData.department || '',
        group: editData.group || '',
        iconUrl: editData.iconUrl || ''
      }
      await updateDoc(teamRef, payload)
      
      toast("✅ Đã cập nhật thông tin thành công!")
      setSelectedTeam(null) // Đóng Modal
      fetchTeams() // Tải lại danh sách từ Firebase để giao diện tự sắp xếp lại bảng
    } catch (error) {
      console.error("Lỗi khi cập nhật đội:", error)
      toast("Lỗi cập nhật. Vui lòng thử lại!")
    }
  }

  // --- Match edit helpers (allow modifying scheduled matches) ---
  const openMatchEditModal = (match) => {
    setSelectedMatchEdit(match)
    setMatchEditData({ ...match })
  }

  const handleSaveMatchEdit = async () => {
    if (!matchEditData) return
    try {
      const matchRef = doc(db, 'matches', matchEditData.id)
      // Editable fields: team ids/names, round/group/status, scheduledAt, court, notes, scores
      const payload = {
        teamA_id: matchEditData.teamA_id || null,
        teamA_name: matchEditData.teamA_name || null,
        teamB_id: matchEditData.teamB_id || null,
        teamB_name: matchEditData.teamB_name || null,
        round: matchEditData.round || null,
        group: matchEditData.group || null,
        status: matchEditData.status || 'UPCOMING',
        scheduledAt: matchEditData.scheduledAt || null,
        court: matchEditData.court || null,
        notes: matchEditData.notes || null
      }

      // optional scores
      if (matchEditData.teamA_score !== undefined) payload.teamA_score = matchEditData.teamA_score
      if (matchEditData.teamB_score !== undefined) payload.teamB_score = matchEditData.teamB_score

      await updateDoc(matchRef, payload)

      // if scores provided and match has label -> recompute and resolve
      if ((payload.teamA_score !== undefined && payload.teamB_score !== undefined)) {
        const updatedMatches = matches.map(m => m.id === matchEditData.id ? { ...m, ...payload } : m)
        await recomputeAndUpdateTeams(updatedMatches)
        if (matchEditData.label != null) await resolveDependentMatchesByLabel(matchEditData.label)
      }

      toast('✅ Đã lưu thay đổi trận đấu')
      setSelectedMatchEdit(null)
      setMatchEditData(null)
    } catch (err) {
      console.error('Lỗi lưu chỉnh sửa trận:', err)
      toast('Lỗi khi lưu chỉnh sửa trận. Vui lòng thử lại.')
    }
  }

  // --- Auto-resolve dependent matches when a source match finishes ---
  const getMatchByLabel = async (label) => {
    try {
      const q = query(collection(db, 'matches'), where('label', '==', label))
      const snap = await getDocs(q)
      let found = null
      snap.forEach(d => found = { id: d.id, ...d.data() })
      return found
    } catch (err) {
      console.error('Lỗi getMatchByLabel:', err)
      return null
    }
  }

  const resolveDependentMatchesByLabel = async (label) => {
    // find matches that reference this label in sourceA or sourceB (or loser...)
    const refs = []
    try {
      const qA = query(collection(db, 'matches'), where('sourceA', '==', label))
      const qB = query(collection(db, 'matches'), where('sourceB', '==', label))
      const qA_loser = query(collection(db, 'matches'), where('sourceA', '==', 'loser' + label))
      const qB_loser = query(collection(db, 'matches'), where('sourceB', '==', 'loser' + label))
      const snaps = await Promise.all([getDocs(qA), getDocs(qB), getDocs(qA_loser), getDocs(qB_loser)])
      snaps.forEach(snap => snap.forEach(d => refs.push({ id: d.id, ...d.data() })))

      // find source match (the one that finished)
      const src = await getMatchByLabel(label)
      if (!src) return
      // determine winner/loser ids
      const aScore = src.teamA_score; const bScore = src.teamB_score
      if (aScore == null || bScore == null) return
      const winnerId = aScore > bScore ? src.teamA_id : src.teamB_id
      const winnerName = aScore > bScore ? src.teamA_name : src.teamB_name
      const loserId = aScore > bScore ? src.teamB_id : src.teamA_id
      const loserName = aScore > bScore ? src.teamB_name : src.teamA_name

      // update each dependent match appropriately
      const batch = writeBatch(db)
      refs.forEach(r => {
        const matchRef = doc(db, 'matches', r.id)
        const payload = {}
        // sourceA may be number -> winner, or 'loserX' -> loser
        if (r.sourceA === label) {
          payload.teamA_id = winnerId
          payload.teamA_name = winnerName
          if (r.status === 'PENDING_SOURCE') payload.status = 'UPCOMING'
        }
        if (r.sourceB === label) {
          payload.teamB_id = winnerId
          payload.teamB_name = winnerName
          if (r.status === 'PENDING_SOURCE') payload.status = 'UPCOMING'
        }
        if (r.sourceA === ('loser' + label)) {
          payload.teamA_id = loserId
          payload.teamA_name = loserName
          if (r.status === 'PENDING_SOURCE') payload.status = 'UPCOMING'
        }
        if (r.sourceB === ('loser' + label)) {
          payload.teamB_id = loserId
          payload.teamB_name = loserName
          if (r.status === 'PENDING_SOURCE') payload.status = 'UPCOMING'
        }
        // if payload not empty, add to batch
        if (Object.keys(payload).length > 0) batch.update(matchRef, payload)
      })

      await batch.commit()
      // refresh local copy (onSnapshot will update matches state automatically)
    } catch (err) {
      console.error('Lỗi resolveDependentMatchesByLabel:', err)
    }
  }

  // Team logo symbols & colors
  const TEAM_SYMBOLS = ['🦅','🔥','⚡','🌊','🏹','💎','🐉','🌟','🎯','👑','🚀','🦁']
  const TEAM_GRADIENT_COLORS = {
    A: [['#3b82f6','#1d4ed8'],['#60a5fa','#1e3a8a'],['#93c5fd','#1e40af']],
    B: [['#22c55e','#15803d'],['#4ade80','#166534'],['#86efac','#14532d']],
    C: [['#ef4444','#b91c1c'],['#f87171','#991b1b'],['#fca5a5','#7f1d1d']],
    D: [['#a855f7','#7e22ce'],['#c084fc','#6b21a8'],['#d8b4fe','#581c87']]
  }

  const TeamLogo = ({ team, size = 40 }) => {
    if (!team) return <div style={{ width: size, height: size, borderRadius: '50%', background: '#1e293b', flexShrink: 0 }} />
    // If team has a custom icon uploaded by admin, show it
    if (team.iconUrl) {
      return (
        <img src={team.iconUrl} alt={team.name} style={{
          width: size, height: size, borderRadius: '50%', flexShrink: 0,
          objectFit: 'cover', boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
          border: '2px solid rgba(255,255,255,0.15)'
        }} />
      )
    }
    const group = team.group || 'A'
    const groupTeams = groupedTeams[group] || []
    const posInGroup = Math.max(0, groupTeams.findIndex(t => t.id === team.id))
    const colorSet = (TEAM_GRADIENT_COLORS[group] || TEAM_GRADIENT_COLORS.A)[posInGroup % 3]
    const symbolIdx = ['A','B','C','D'].indexOf(group) * 3 + posInGroup
    const symbol = TEAM_SYMBOLS[symbolIdx % 12]
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${colorSet[0]}, ${colorSet[1]})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, boxShadow: `0 3px 10px ${colorSet[0]}55`
      }}>{symbol}</div>
    )
  }

  const BADMINTON_MEMES = [
    '🏸 "Cú smash này đến từ nỗi đau!" 😤',
    '🍺 "Sau giải là nhậu thôi!" 🎉',
    '💨 "Bay lên như cầu lông gặp gió!" 😂',
    '😤 "Đánh mạnh cho đối thủ thấy tự trọng!"',
    '🎯 "Aim như hacker nhưng cầu ra ngoài!" 🤣',
    '🍺 "Thua thì uống, thắng cũng uống!"',
    '🏸 "Cầu lông: 20% kỹ thuật, 80% tâm linh!" 🙏',
  ]
  const todayMeme = BADMINTON_MEMES[new Date().getDate() % BADMINTON_MEMES.length]

  const handleSaveBanner = async () => {
    try {
      const bannerRef = doc(db, 'config', 'banner')
      await setDoc(bannerRef, bannerForm)
      setBannerData(bannerForm)
      setBannerEditOpen(false)
    } catch(err) { console.error(err); toast('Lỗi lưu banner') }
  }

  const handleSaveComment = async () => {
    if (!commentForm.playerName || !commentForm.text.trim()) {
      toast('Vui lòng chọn tên và nhập nội dung bình luận')
      return
    }
    try {
      await addDoc(collection(db, 'comments'), {
        playerName: commentForm.playerName,
        text: commentForm.text.trim(),
        timestamp: Date.now()
      })
      setCommentForm(prev => ({ ...prev, text: '' }))
    } catch(err) { console.error(err); toast('Lỗi khi gửi bình luận') }
  }

  const allPlayerNames = teams.flatMap(t => [t.player1, t.player2]).filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i).sort()

  const mvpLeaderboard = (() => {
    const map = {}
    matches.forEach(m => {
      if (!m.mvpVotes) return
      Object.entries(m.mvpVotes).forEach(([player, count]) => {
        map[player] = (map[player] || 0) + count
      })
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  })()

  const renderMatchCard = (match) => {
    const stageLabel = match.stage === 'GROUP_STAGE' ? `Bảng ${match.group}` : match.stage === 'PHASE2' ? 'Lượt 2' : 'Chung kết'
    const mc = getMatchColor(match)
    const teamA = teams.find(t => t.id === match.teamA_id)
    const teamB = teams.find(t => t.id === match.teamB_id)
    const statusMap = { COMPLETED: { label: '✅ Kết thúc', cls: 'st-done' }, UPCOMING: { label: '⏳ Sắp đấu', cls: 'st-upcoming' }, PENDING_SOURCE: { label: '⏸ Chờ nguồn', cls: 'st-pending' } }
    const stObj = statusMap[match.status] || statusMap.UPCOMING
    return (
      <div key={match.id} className="match-card" style={{ borderLeft: `4px solid ${mc}` }}>
        <div className="mc-header">
          <span className="mc-stage" style={{ background: hexToRgba(mc, 0.22), color: mc }}>{stageLabel}</span>
          {match.label && <span className="mc-label">T{match.label}</span>}
          <span className={`mc-status ${stObj.cls}`}>{stObj.label}</span>
        </div>
        <div className="mc-body">
          <div className="mc-team mc-team-a">
            <TeamLogo team={teamA} size={28} />
            <span className="mc-tname" style={{ color: mc, textShadow: `0 0 12px ${mc}80`, fontSize: '1.15rem' }}>{match.teamA_name || '?'}</span>
            {teamA && <span className="mc-players">{teamA.player1} &amp; {teamA.player2}</span>}
          </div>
          <div className="mc-score-col">
            {isAdmin ? (
              <input
                type="text"
                placeholder="21-19"
                value={getScoreDisplayText(match.id, match)}
                onChange={e => handleScoreChange(match.id, e.target.value)}
                className="mc-score-input"
              />
            ) : (
              <div className="mc-score-display">
                {match.teamA_score != null && match.teamB_score != null
                  ? `${match.teamA_score} – ${match.teamB_score}`
                  : 'vs'}
              </div>
            )}
          </div>
          <div className="mc-team mc-team-b">
            <TeamLogo team={teamB} size={28} />
            <span className="mc-tname" style={{ color: mc, textShadow: `0 0 12px ${mc}80`, fontSize: '1.15rem' }}>{match.teamB_name || '?'}</span>
            {teamB && <span className="mc-players">{teamB.player1} &amp; {teamB.player2}</span>}
          </div>
        </div>
        {(isAdmin || match.status === 'COMPLETED') && (
          <div className="mc-actions">
            {isAdmin && (
              <>
                <button className="btn-primary btn-sm" onClick={() => handleSaveMatchResult(match)}>💾 Lưu</button>
                <button className="btn-secondary btn-sm" onClick={() => setLocalScores(prev => ({ ...prev, [match.id]: { text: '' } }))}>↺</button>
                <button className="btn-secondary btn-sm" onClick={() => openMatchEditModal(match)}>✏️</button>
              </>
            )}
            {match.status === 'COMPLETED' && (
              <button className="btn-mvp btn-sm" onClick={() => setMvpVoteOpen(match)}>
                ⭐ MVP {myVotes[match.id] ? `· ${myVotes[match.id]}` : ''}
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // Schedule (vòng bảng) compact card: same tidy look as Lượt 2/3
  const renderCompactScheduleMatch = (m) => {
    const completed = m.status === 'COMPLETED'
    const aWin = completed && (m.teamA_score ?? -1) > (m.teamB_score ?? -2)
    const bWin = completed && (m.teamB_score ?? -1) > (m.teamA_score ?? -2)
    const statusMap = { COMPLETED: { label: '✅', cls: 'st-done' }, UPCOMING: { label: '⏳', cls: 'st-upcoming' }, PENDING_SOURCE: { label: '⏸', cls: 'st-pending' } }
    const stObj = statusMap[m.status] || statusMap.UPCOMING
    return (
      <div className="compact-match compact-match--schedule">
        <div className="compact-match__top">
          <span className="cm-status-pill">{stObj.label}</span>
          {m.label && <span className="compact-match__tag">{m.label}</span>}
        </div>
        <div className={`cm-team ${aWin ? 'cm-win' : ''}`}>
          <span className="cm-name">{m.teamA_name || '?'}</span>
          {completed && <span className="cm-score">{m.teamA_score}</span>}
        </div>
        <div className="cm-vs">VS</div>
        <div className={`cm-team ${bWin ? 'cm-win' : ''}`}>
          <span className="cm-name">{m.teamB_name || '?'}</span>
          {completed && <span className="cm-score">{m.teamB_score}</span>}
        </div>
        <div className="compact-match__actions">
          {isAdmin && (
            <button className="cm-edit" onClick={() => openMatchEditModal(m)} title="Sửa / nhập tỉ số">✏️</button>
          )}
          {completed && (
            <button className="cm-mvp" onClick={() => setMvpVoteOpen(m)} title="Bình chọn MVP">⭐</button>
          )}
        </div>
      </div>
    )
  }

  // Compact match for the horizontal bracket (mobile-friendly, no horizontal scroll)
  const renderCompactMatch = (m, tag) => {
    const completed = m.status === 'COMPLETED'
    const aWin = completed && (m.teamA_score ?? -1) > (m.teamB_score ?? -2)
    const bWin = completed && (m.teamB_score ?? -1) > (m.teamA_score ?? -2)
    const locked = m.status === 'PENDING_SOURCE'
    return (
      <div className={`compact-match ${locked ? 'compact-match--locked' : ''}`}>
        {tag && <div className="compact-match__tag">{tag}</div>}
        <div className={`cm-team ${aWin ? 'cm-win' : ''}`}>
          <span className="cm-name">{m.teamA_name || '?'}</span>
          {completed && <span className="cm-score">{m.teamA_score}</span>}
        </div>
        <div className="cm-vs">VS</div>
        <div className={`cm-team ${bWin ? 'cm-win' : ''}`}>
          <span className="cm-name">{m.teamB_name || '?'}</span>
          {completed && <span className="cm-score">{m.teamB_score}</span>}
        </div>
        {isAdmin && !locked && (
          <button className="cm-edit" onClick={() => openMatchEditModal(m)} title="Sửa / nhập tỉ số">✏️</button>
        )}
        {completed && !locked && (
          <button className="cm-mvp" onClick={() => setMvpVoteOpen(m)} title="Bình chọn MVP">⭐</button>
        )}
      </div>
    )
  }

  return (
    <div className="app-container">

      {/* Hero Banner */}
      <div className="hero-banner" style={bannerData.imageUrl ? { backgroundImage: `url(${bannerData.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        {/* Progress Bar (tính số trận đã hoàn thành) */}
        {matches.length > 0 && (
          <div className="tournament-progress">
            <div className="progress-bar" style={{ width: `${(matches.filter(m => m.status === 'COMPLETED').length / matches.length) * 100}%` }}></div>
          </div>
        )}
        {/* SVG shuttlecock backdrop decoration */}
        <div className="hero-backdrop-svg" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', right: '38%', top: '10%', width: 180, opacity: 0.07 }}>
            <ellipse cx="100" cy="160" rx="22" ry="10" fill="white"/>
            <circle cx="100" cy="155" r="12" fill="white"/>
            <line x1="100" y1="143" x2="60" y2="30" stroke="white" strokeWidth="2.5"/>
            <line x1="100" y1="143" x2="100" y2="25" stroke="white" strokeWidth="2.5"/>
            <line x1="100" y1="143" x2="140" y2="30" stroke="white" strokeWidth="2.5"/>
            <line x1="100" y1="143" x2="75" y2="20" stroke="white" strokeWidth="1.5"/>
            <line x1="100" y1="143" x2="125" y2="20" stroke="white" strokeWidth="1.5"/>
            <ellipse cx="100" cy="28" rx="42" ry="14" stroke="white" strokeWidth="1.8" fill="none"/>
            <ellipse cx="100" cy="34" rx="35" ry="10" stroke="white" strokeWidth="1.2" fill="none"/>
          </svg>
        </div>
        <div className="hero-overlay">
          {/* Left: Tournament info */}
          <div className="hero-left">
            <div className="hero-top-row">
              <span className="hero-live-badge">🏸 LIVE</span>
              {isAdmin && (
                <button className="btn-banner-edit" onClick={() => { setBannerForm({...bannerData}); setBannerEditOpen(true) }}>✏️ Sửa banner</button>
              )}
            </div>
            <h1 className="hero-title">{bannerData.title || 'HD Badminton Beer Cup 🏸'}</h1>
            <p className="hero-subtitle">{bannerData.subtitle || 'Giải đánh đôi nam-nữ hỗn hợp'}</p>
            <div className="hero-stats-row">
              <div className="hero-stat"><span className="hs-num">{teams.length || '—'}</span><span className="hs-label">Đội</span></div>
              <div className="hero-stat"><span className="hs-num">{Object.keys(groupedTeams).filter(g => groupedTeams[g].length > 0).length || 4}</span><span className="hs-label">Bảng</span></div>
              <div className="hero-stat"><span className="hs-num">{matches.length || 0}</span><span className="hs-label">Trận</span></div>
              <div className="hero-stat"><span className="hs-num">{matches.filter(m => m.status === 'COMPLETED').length}</span><span className="hs-label">Xong ✅</span></div>
            </div>
            <div className="hero-meme">{todayMeme}</div>
            {isAdmin && (
              <div className="hero-admin-actions">
                <button onClick={generateMockTeams} className="btn-hero-action" disabled={loading}>🎲 Tạo đội mẫu</button>
                <button onClick={generateSchedule} className="btn-hero-action" disabled={loading}>📅 Tạo lịch vòng bảng</button>
                <button onClick={generatePhase2AndFinals} className="btn-hero-action" disabled={loading}>🏆 Tạo lượt 2 & chung kết</button>
                <button onClick={() => setGroupNamesEditOpen(true)} style={{ display: 'none' }}></button>
              </div>
            )}
          </div>

          {/* Right: Badminton image + live MVP leaderboard */}
          <div className="hero-right">
            <div className="hero-img-wrap">
              <img
                src={bannerData.sportImageUrl || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80'}
                alt="Badminton"
                className="hero-sport-img"
                onError={e => { e.target.style.display = 'none' }}
              />
              <div className="hero-img-overlay" />
            </div>

            {/* MVP Realtime Block — always visible */}
            <div className="hero-mvp-live">
              <div className="hero-mvp-title">
                <span>⭐ Top MVP</span>
                <span className="mvp-live-badge">🔴 LIVE</span>
              </div>
              {mvpLeaderboard.length === 0 ? (
                <div className="mvp-empty">
                  <span>Chưa có bình chọn</span>
                  <span className="mvp-empty-hint">Bình chọn sau mỗi trận xong</span>
                </div>
              ) : (
                <div className="mvp-list">
                  {mvpLeaderboard.slice(0, 5).map(([player, votes], idx) => (
                    <div key={player} className={`hero-mvp-item ${idx === 0 ? 'mvp-first' : ''}`}>
                      <span className="mvp-medal">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                      <span className="mvp-name">{player}</span>
                      <div className="mvp-bar-wrap">
                        <div
                          className="mvp-bar"
                          style={{
                            width: `${Math.round((votes / mvpLeaderboard[0][1]) * 100)}%`,
                            background: idx === 0
                              ? 'linear-gradient(90deg,#fbbf24,#f59e0b)'
                              : idx === 1
                              ? 'linear-gradient(90deg,#94a3b8,#64748b)'
                              : 'linear-gradient(90deg,#a16207,#78350f)'
                          }}
                        />
                      </div>
                      <span className="mvp-votes">{votes}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Top-right: admin badge */}
        <div className="hero-auth-btn">
          {isAdmin ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge-admin">👑 Admin</span>
              <button onClick={handleAdminLogout} className="btn-auth">Đăng xuất</button>
            </div>
          ) : (
            <button onClick={() => setAdminLoginOpen(true)} className="btn-auth">🔐 Admin</button>
          )}
        </div>
      </div>

      {/* Collapsible Thể lệ panel under the banner */}
      <div className="rules-panel">
        <button className="rules-toggle" onClick={() => setRulesOpen(o => !o)}>
          <span>📋 Thể lệ giải đấu</span>
          <span className={`rules-chevron ${rulesOpen ? 'open' : ''}`}>{rulesOpen ? '▲' : '▼'}</span>
        </button>
        {rulesOpen && (
          <div className="rules-panel-body">
            <div className="rules-head">
              <h2 className="rules-title">{rulesData.title || '📋 Thể lệ giải đấu'}</h2>
              {rulesData.subtitle && <p className="rules-subtitle">{rulesData.subtitle}</p>}
            </div>
            <div className="info-grid">
              {(rulesData.sections || []).map((sec, sIdx) => (
                <div
                  key={sec.id || sIdx}
                  className="rule-box"
                  style={{
                    '--rule-accent-color': sec.color || '#38bdf8',
                    gridColumn: (sec.title && sec.title.includes('MVP')) ? '1 / -1' : 'auto'
                  }}
                >
                  <h3 style={{ color: sec.color || '#38bdf8' }}>{sec.title}</h3>
                  <ul>
                    {(sec.items || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <button className="btn-primary" onClick={handleOpenRulesEdit} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#0f172a' }}>
                  ✏️ Chỉnh sửa thể lệ (Admin)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments Section – below hero banner */}
      <div className="comments-section">
        <div className="cs-inner">
          <h3 className="cs-title">💬 Bình luận trực tiếp</h3>
          <div className="cs-layout">
            <div className="cs-form-box">
              <input
                type="text"
                value={commentForm.playerName}
                onChange={e => setCommentForm(p => ({ ...p, playerName: e.target.value }))}
                className="cs-input"
                placeholder="Tên của bạn..."
              />
              <textarea
                value={commentForm.text}
                onChange={e => setCommentForm(p => ({ ...p, text: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveComment() } }}
                placeholder="Để lại bình luận... 🏸🍺"
                rows={2}
                className="cs-textarea"
              />
              <button onClick={handleSaveComment} className="cs-send-btn">Gửi 💬</button>
            </div>
            <div className="cs-list">
              {comments.length === 0 && <div className="cs-empty">Chưa có bình luận nào 🤫</div>}
              {comments.slice(0, 20).map(c => (
                <div key={c.id} className="cs-comment">
                  <span className="cs-cname">{c.playerName}</span>
                  <span className="cs-ctext">{c.text}</span>
                  <span className="cs-ctime">{new Date(c.timestamp).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  
      {/* Tabs */}
      <div className="main-tabs-bar">
        {[
          { key: 'groupStandings', label: '📊 Bảng đấu' },
          { key: 'overall', label: '🏆 Chung cuộc' },
          { key: 'schedule', label: '📅 Lịch thi đấu' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCurrentTab(key)}
            className={`main-tab-btn ${currentTab === key ? 'active' : ''}`}
          >{label}</button>
        ))}
      </div>

      {/** Standings View */}
      {currentTab === 'groupStandings' && (
        <div className="groups-grid">
            {['A','B','C','D'].map(group => {
              // computeStandingsForGroup already sorts with H2H tiebreaker
              const standings = computeStandingsForGroup(group)

              return (
                <div key={group} className="group-card">
                  <h2 className="group-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {getGroupDisplayName(group)}
                    {isAdmin && (
                      <button 
                        onClick={() => { setGroupNamesForm({...groupNames}); setGroupNamesEditOpen(true) }} 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                        title="Đổi tên bảng"
                      >✏️</button>
                    )}
                  </h2>
                  <div className="standings-wrapper">
                    <table className="standings-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Đội</th>
                          <th>W</th>
                          <th>L</th>
                          <th>Trận</th>
                          <th>SD</th>
                          <th>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((t, idx) => (
                          <tr key={t.id} className="team-row" style={{ cursor: isAdmin ? 'pointer' : 'default' }} onClick={() => isAdmin && handleOpenEditModal(t)}>
                            <td className="cell-small">{idx+1}</td>
                            <td className="team-cell">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TeamLogo team={teams.find(t2=>t2.id===t.id)} size={30} />
                                <div>
                                  <div className="team-name">{t.name}</div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.player1} &amp; {t.player2}</div>
                                </div>
                              </div>
                            </td>
                            <td className="cell-small">{t.won}</td>
                            <td className="cell-small">{t.lost}</td>
                            <td className="cell-small">{t.played}</td>
                            <td className="cell-small">{t.setDifference}</td>
                            <td className="cell-points">{t.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {isAdmin && (
                    <div style={{ marginTop: 15 }}>
                      <button className="btn-primary" style={{ padding: '10px 16px', width: 'fit-content' }} onClick={() => openAddTeamModal(group)}>
                        + Thêm đội vào bảng {group}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}
 
      {/** Overall standings view */}
      {currentTab === 'overall' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 12px' }}>
          <div className="group-card" style={{ padding: 18, marginBottom: 18 }}>
            <h2 className="group-title">🏆 Xếp hạng chung cuộc</h2>
            {matches.some(m => m.stage === 'FINAL' && m.teamA_score != null) && (
              <p style={{ color: '#22c55e', fontSize: '0.85rem', margin: '4px 0 12px' }}>✅ Xếp hạng dựa trên kết quả trận phân hạng chung kết</p>
            )}
            <div className="standings-wrapper">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Đội</th>
                    <th>Danh hiệu</th>
                  </tr>
                </thead>
                <tbody>
                  {computeOverallStandings().map((team, idx) => {
                    const rankDisplay = team.finalRank < 99 ? team.finalRank : idx + 1
                    const isMedal = team.finalRank <= 3
                    const medalEmoji = team.finalRank === 1 ? '🥇' : team.finalRank === 2 ? '🥈' : team.finalRank === 3 ? '🥉' : ''
                    return (
                    <tr key={team.id} className="team-row" style={{ cursor: isAdmin ? 'pointer' : 'default', background: isMedal ? 'rgba(251,191,36,0.08)' : undefined }} onClick={() => isAdmin && handleOpenEditModal(teams.find(t => t.id === team.id) || team)}>
                      <td className="cell-small" style={{ fontWeight: isMedal ? 800 : 400 }}>{medalEmoji} {rankDisplay}</td>
                      <td className="team-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <TeamLogo team={teams.find(t=>t.id===team.id)} size={30} />
                          <div>
                            <div className="team-name">{team.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{team.player1} &amp; {team.player2}</div>
                          </div>
                        </div>
                      </td>
                      <td className="cell-small" style={{ fontStyle: 'italic', color: '#fbbf24' }}>
                        {(() => {
                          const r = team.finalRank < 99 ? team.finalRank : idx + 1;
                          switch(r) {
                            case 1: return "Độc cô cầu bại 🏆";
                            case 2: return "Dưới 1 người, trên vạn người 🥈";
                            case 3: return "Chỉ thua nhà vô địch 🥉";
                            case 4: return "Vua về tư 😅";
                            case 5: return "Bá chủ top giữa 😎";
                            case 15: return "Xin một lần thắng 🥲";
                            case 16: return "Đam mê là chính, giải thưởng là phụ 🤣";
                            default:
                              if (r > 4 && r <= 8) return "Kẻ ngáng đường vĩ đại 🚧";
                              if (r > 8 && r <= 12) return "Nghệ sĩ sân cầu 🏸";
                              return "Tuyệt đỉnh phong trào 🍻";
                          }
                        })()}
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MVP Leaderboard */}
          {(() => {
            const mvpMap = {}
            matches.forEach(m => {
              if (!m.mvpVotes) return
              Object.entries(m.mvpVotes).forEach(([player, count]) => {
                mvpMap[player] = (mvpMap[player] || 0) + count
              })
            })
            const sorted = Object.entries(mvpMap).sort((a, b) => b[1] - a[1])
            if (sorted.length === 0) return null
            return (
              <div className="group-card" style={{ padding: 18 }}>
                <h2 className="group-title">⭐ Bảng xếp hạng MVP</h2>
                <div style={{ display: 'grid', gap: 8 }}>
                  {sorted.map(([player, votes], idx) => (
                    <div key={player} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: idx === 0 ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)', border: idx === 0 ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontWeight: 800, color: idx === 0 ? '#fbbf24' : '#64748b', minWidth: 28 }}>{idx === 0 ? '🥇' : `#${idx+1}`}</span>
                      <span style={{ flex: 1, color: '#e2e8f0', fontWeight: 600 }}>{player}</span>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>{votes} phiếu</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}
 
      {/** Schedule View */}
      {currentTab === 'schedule' && (
        <div style={{ maxWidth: 1100, margin: '12px auto', padding: '0 12px' }}>
          <h2 style={{ color: '#cbd5e1', marginBottom: 8 }}>Lịch Thi Đấu</h2>
          <div className="schedule-controls">
            <div className="stage-tabs">
              <button className={`btn-tab ${scheduleStageTab === 'group' ? 'active' : ''}`} onClick={() => setScheduleStageTab('group')}>Vòng bảng</button>
              <button className={`btn-tab ${scheduleStageTab === 'bracket' ? 'active' : ''}`} onClick={() => setScheduleStageTab('bracket')}>Sơ đồ vòng loại (Lượt 2 & 3)</button>
            </div>
            {scheduleStageTab === 'group' && (
              <div className="filter-group">
                {scheduleFilters.map(key => (
                  <button key={key} className={`btn-clear-option ${scheduleGroupFilter === key ? 'active' : ''}`} onClick={() => setScheduleGroupFilter(key)}>{key === 'ALL' ? 'Tất cả' : `Bảng ${key}`}</button>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14, color: '#94a3b8' }}>
            {scheduleStageTab === 'group' ? 'Hiển thị danh sách trận vòng bảng.' : 'Hiển thị sơ đồ thi đấu loại trực tiếp và phân hạng chung cuộc.'}
          </div>
 
          {scheduleStageTab === 'group' && groupStageMatches.length === 0 ? (
            <div className="empty-state-card">
              <p>Chưa có trận vòng bảng hoặc đang chờ tạo lịch.</p>
            </div>
          ) : scheduleStageTab === 'bracket' && phase2Matches.length === 0 ? (
            <div className="empty-state-card">
              <p>Chưa có trận đấu vòng loại. Vui lòng tạo Lượt 2 & Chung kết.</p>
            </div>
          ) : (
            <div className="match-list">
              {scheduleStageTab === 'group' ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {groupStageMatches.map(m => renderCompactScheduleMatch(m))}
                </div>
              ) : (
                <div className="bracket-v2">
                  {[1, 2, 3, 4].map(rg => {
                    const groupTitle = rg === 1 ? "🏆 Tranh hạng 1-4" : rg === 2 ? "🎖️ Tranh hạng 5-8" : rg === 3 ? "🎯 Tranh hạng 9-12" : "🛡️ Tranh hạng 13-16"
                    const groupSub = rg === 1 ? "Nhất các bảng" : rg === 2 ? "Nhì các bảng" : rg === 3 ? "Hạng 3 các bảng" : "Bét các bảng"
                    const groupColor = rg === 1 ? '#fbbf24' : rg === 2 ? '#22c55e' : rg === 3 ? '#f59e0b' : '#a855f7'
                    const sf = phase2Matches.filter(m => m.rankGroup === rg).sort((a,b) => a.matchOrder - b.matchOrder)
                    const baseRank = (rg - 1) * 4 + 1
                    const finals = finalMatches.filter(m => m.rankWinner === baseRank || m.rankWinner === baseRank + 2).sort((a,b) => a.rankWinner - b.rankWinner)
                    const topFinal = finals.find(m => m.rankWinner === baseRank)
                    const lowFinal = finals.find(m => m.rankWinner === baseRank + 2)
                    const overall = computeOverallStandings()

                    if (sf.length === 0) return null

                    return (
                      <div key={rg} className="bracket-group" style={{ '--group-color': groupColor }}>
                        <h3 className="bracket-group__title">
                          <span className="bracket-group__dot" />
                          {groupTitle}
                          <span className="bracket-group__sub">{groupSub}</span>
                        </h3>

                        <div className="bracket-cols">
                          {/* Lượt 2 */}
                          <div className="bracket-col-c">
                            <div className="bracket-col-c__head">⚔️ Lượt 2</div>
                            <div className="bracket-col-c__body">
                              {sf.map((m, idx) => (
                                <div key={m.id}>{renderCompactMatch(m, `Trận ${idx + 1}`)}</div>
                              ))}
                            </div>
                          </div>

                          {/* Lượt 3 */}
                          <div className="bracket-col-c">
                            <div className="bracket-col-c__head">🏁 Lượt 3</div>
                            <div className="bracket-col-c__body">
                              {topFinal && (
                                <div>{renderCompactMatch(topFinal, `🥇 ${baseRank}-${baseRank+1}`)}</div>
                              )}
                              {lowFinal && (
                                <div>{renderCompactMatch(lowFinal, `🥉 ${baseRank+2}-${baseRank+3}`)}</div>
                              )}
                            </div>
                          </div>

                          {/* Kết quả */}
                          <div className="bracket-col-c">
                            <div className="bracket-col-c__head">🏅 Kết quả</div>
                            <div className="bracket-col-c__body">
                              {[0,1,2,3].map(offset => {
                                const rank = baseRank + offset
                                const team = overall.find(t => t.finalRank === rank)
                                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
                                return (
                                  <div key={rank} className="compact-rank">
                                    <span className="compact-rank__medal">{medal}</span>
                                    <span className="compact-rank__name">{team ? team.name : '???'}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Chỉnh sửa trận đấu */}
      {selectedMatchEdit && matchEditData && (
        <div className="modal-overlay" onClick={() => setSelectedMatchEdit(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <button className="close-btn" onClick={() => setSelectedMatchEdit(null)}>×</button>
            <h2 style={{ color: '#38bdf8', textAlign: 'center' }}>Chỉnh sửa Trận</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Đội A</label>
                  <select value={matchEditData.teamA_id || ''} onChange={e => {
                    const t = teams.find(x => x.id === e.target.value)
                    setMatchEditData(prev => ({ ...prev, teamA_id: e.target.value, teamA_name: t ? t.name : '' }))
                  }} style={{ width: '100%', padding: 8, borderRadius: 6 }}>
                    <option value="">-- Chọn đội --</option>
                    {['A','B','C','D'].map(g => (
                      groupedTeams[g] && groupedTeams[g].length > 0 && (
                        <optgroup key={g} label={`Bảng ${g}`}>
                          {groupedTeams[g].map(t => (
                            <option key={t.id} value={t.id}>{t.teamLabel ? `${t.teamLabel} - ${t.name}` : t.name} ({t.player1} & {t.player2})</option>
                          ))}
                        </optgroup>
                      )
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Đội B</label>
                  <select value={matchEditData.teamB_id || ''} onChange={e => {
                    const t = teams.find(x => x.id === e.target.value)
                    setMatchEditData(prev => ({ ...prev, teamB_id: e.target.value, teamB_name: t ? t.name : '' }))
                  }} style={{ width: '100%', padding: 8, borderRadius: 6 }}>
                    <option value="">-- Chọn đội --</option>
                    {['A','B','C','D'].map(g => (
                      groupedTeams[g] && groupedTeams[g].length > 0 && (
                        <optgroup key={g} label={`Bảng ${g}`}>
                          {groupedTeams[g].map(t => (
                            <option key={t.id} value={t.id}>{t.teamLabel ? `${t.teamLabel} - ${t.name}` : t.name} ({t.player1} & {t.player2})</option>
                          ))}
                        </optgroup>
                      )
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Ngày/Giờ (scheduledAt)</label>
                  <input type="datetime-local" value={matchEditData.scheduledAt ? new Date(matchEditData.scheduledAt).toISOString().slice(0,16) : ''} onChange={e => setMatchEditData(prev => ({ ...prev, scheduledAt: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Sân</label>
                  <input type="text" value={matchEditData.court || ''} onChange={e => setMatchEditData(prev => ({ ...prev, court: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Ghi chú</label>
                  <textarea value={matchEditData.notes || ''} onChange={e => setMatchEditData(prev => ({ ...prev, notes: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6 }} rows={3} />
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Điểm Sets (Đội A) - (ví dụ 2)</label>
                  <input type="number" min={0} value={matchEditData.teamA_score ?? ''} onChange={e => setMatchEditData(prev => ({ ...prev, teamA_score: e.target.value === '' ? '' : Number(e.target.value) }))} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Điểm Sets (Đội B)</label>
                  <input type="number" min={0} value={matchEditData.teamB_score ?? ''} onChange={e => setMatchEditData(prev => ({ ...prev, teamB_score: e.target.value === '' ? '' : Number(e.target.value) }))} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
                </div>


                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Trạng thái</label>
                  <select value={matchEditData.status || 'UPCOMING'} onChange={e => setMatchEditData(prev => ({ ...prev, status: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6 }}>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="PENDING_SOURCE">PENDING_SOURCE</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: 8 }}>
                  <button onClick={handleSaveMatchEdit} style={{ background: '#34d399', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700 }}>Lưu</button>
                  <button onClick={() => { setSelectedMatchEdit(null); setMatchEditData(null) }} style={{ marginLeft: 8, background: '#475569', border: 'none', padding: '10px 16px', borderRadius: 8 }}>Hủy</button>
                </div>
            </div>
          </div>
        </div>
      )}
      {selectedTeam && editData && (
       <div className="modal-overlay" onClick={() => setSelectedTeam(null)}>
         <div className="modal-content" onClick={e => e.stopPropagation()}>
           <button className="close-btn" onClick={() => setSelectedTeam(null)}>×</button>
           <div className="player-info">
             <h2>Chỉnh sửa Đội</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
               <div>
                 <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Mã đội (Team Label):</label>
                 <input
                   type="text"
                   value={editData.teamLabel || ''}
                   readOnly
                   style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#94a3b8', marginTop: '4px' }}
                 />
               </div>
               <div>
                 <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Tên đội:</label>
                 <input
                   type="text"
                   value={editData.name || ''}
                   onChange={e => setEditData({ ...editData, name: e.target.value })}
                   style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none', background: '#334155', color: 'white', marginTop: '4px' }}
                 />
               </div>
               <div>
                 <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Tuyển thủ 1:</label>
                 <input
                   type="text"
                   value={editData.player1 || ''}
                   onChange={e => setEditData({ ...editData, player1: e.target.value })}
                   style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none', background: '#334155', color: 'white', marginTop: '4px' }}
                 />
               </div>
               <div>
                 <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Tuyển thủ 2:</label>
                 <input
                   type="text"
                   value={editData.player2 || ''}
                   onChange={e => setEditData({ ...editData, player2: e.target.value })}
                   style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none', background: '#334155', color: 'white', marginTop: '4px' }}
                 />
               </div>
               <div>
                 <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 'bold' }}>Chuyển Bảng Đấu:</label>
                 <select
                   value={editData.group}
                   onChange={e => setEditData({ ...editData, group: e.target.value })}
                   style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #475569', background: '#1e293b', color: 'white', marginTop: '4px', fontSize: '1rem' }}
                 >
                   <option value="A">Bảng A</option>
                   <option value="B">Bảng B</option>
                   <option value="C">Bảng C</option>
                   <option value="D">Bảng D</option>
                 </select>
                </div>
                {/* Icon Upload (Admin only) */}
                <div>
                  <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 'bold' }}>Icon đội (Tải lên ảnh):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                    <TeamLogo team={editData} size={52} />
                    <div style={{ flex: 1 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 200 * 1024) { toast('Ảnh quá lớn! Vui lòng chọn ảnh dưới 200KB.'); return }
                          const reader = new FileReader()
                          reader.onload = ev => setEditData(prev => ({ ...prev, iconUrl: ev.target.result }))
                          reader.readAsDataURL(file)
                        }}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #475569', background: '#1e293b', color: '#94a3b8', fontSize: '0.85rem' }}
                      />
                      {editData.iconUrl && (
                        <button
                          onClick={() => setEditData(prev => ({ ...prev, iconUrl: '' }))}
                          style={{ marginTop: 6, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}
                        >Xóa icon</button>
                      )}
                    </div>
                  </div>
                </div>
             </div>
             <div style={{ marginTop: '20px', textAlign: 'center' }}>
               <button
                 onClick={handleSaveTeamEdit}
                 style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', width: '100%' }}
               >
                 Lưu Thay Đổi
               </button>
             </div>
           </div>
         </div>
       </div>
      )}
      {addTeamModalOpen && (
       <div className="modal-overlay" onClick={() => setAddTeamModalOpen(false)}>
         <div className="modal-content" onClick={e => e.stopPropagation()}>
           <button className="close-btn" onClick={() => setAddTeamModalOpen(false)}>×</button>
           <div className="player-info">
             <h2>Thêm đội mới</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
               <div>
                 <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Bảng</label>
                 <select value={addTeamForm.group} onChange={e => setAddTeamForm(prev => ({ ...prev, group: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #475569', background: '#1e293b', color: 'white', marginTop: '4px', fontSize: '1rem' }}>
                   <option value="A">Bảng A</option>
                   <option value="B">Bảng B</option>
                   <option value="C">Bảng C</option>
                   <option value="D">Bảng D</option>
                 </select>
               </div>
               <div>
                 <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Tên đội</label>
                 <input type="text" value={addTeamForm.name} onChange={e => setAddTeamForm(prev => ({ ...prev, name: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none', background: '#334155', color: 'white', marginTop: '4px' }} />
               </div>
               <div>
                 <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>VĐV 1 (Nam hoặc Nữ)</label>
                 <input type="text" value={addTeamForm.player1} onChange={e => setAddTeamForm(prev => ({ ...prev, player1: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none', background: '#334155', color: 'white', marginTop: '4px' }} />
               </div>
               <div>
                 <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>VĐV 2 (Nam hoặc Nữ)</label>
                 <input type="text" value={addTeamForm.player2} onChange={e => setAddTeamForm(prev => ({ ...prev, player2: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none', background: '#334155', color: 'white', marginTop: '4px' }} />
               </div>
             </div>
             <div style={{ marginTop: '20px', textAlign: 'center' }}>
               <button onClick={handleSaveNewTeam} style={{ background: '#34d399', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', width: '100%' }}>Lưu đội mới</button>
             </div>
           </div>
         </div>
       </div>
      )}

      {/* Modal Đổi tên bảng */}
      {groupNamesEditOpen && (
        <div className="modal-overlay" onClick={() => setGroupNamesEditOpen(false)}>
          <div className="modal-content admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <button className="close-btn" onClick={() => setGroupNamesEditOpen(false)}>×</button>
            <h2 className="modal-title">🏷️ Đổi Tên Bảng Thi Đấu</h2>
            <div className="form-group">
              <label>Bảng A</label>
              <input type="text" value={groupNamesForm.A} onChange={e => setGroupNamesForm({...groupNamesForm, A: e.target.value})} className="form-input" />
            </div>
            <div className="form-group">
              <label>Bảng B</label>
              <input type="text" value={groupNamesForm.B} onChange={e => setGroupNamesForm({...groupNamesForm, B: e.target.value})} className="form-input" />
            </div>
            <div className="form-group">
              <label>Bảng C</label>
              <input type="text" value={groupNamesForm.C} onChange={e => setGroupNamesForm({...groupNamesForm, C: e.target.value})} className="form-input" />
            </div>
            <div className="form-group">
              <label>Bảng D</label>
              <input type="text" value={groupNamesForm.D} onChange={e => setGroupNamesForm({...groupNamesForm, D: e.target.value})} className="form-input" />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setGroupNamesEditOpen(false)}>Hủy</button>
              <button className="btn-save" onClick={async () => {
                try {
                  await setDoc(doc(db, 'config', 'groupNames'), groupNamesForm, { merge: true })
                  toast('Lưu tên bảng thành công!')
                  setGroupNamesEditOpen(false)
                } catch(e) { toast('Lỗi khi lưu tên bảng') }
              }}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Edit Modal */}
      {bannerEditOpen && (
        <div className="modal-overlay" onClick={() => setBannerEditOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <button className="close-btn" onClick={() => setBannerEditOpen(false)}>×</button>
            <h2 style={{ color: '#fbbf24', textAlign: 'center', marginBottom: 16 }}>🎨 Chỉnh sửa Banner</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Tên giải đấu</label>
                <input type="text" value={bannerForm.title || ''} onChange={e => setBannerForm(p => ({...p, title: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: 6, border: 'none', background: '#334155', color: 'white', marginTop: 4 }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Mô tả / Subtitle</label>
                <input type="text" value={bannerForm.subtitle || ''} onChange={e => setBannerForm(p => ({...p, subtitle: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: 6, border: 'none', background: '#334155', color: 'white', marginTop: 4 }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>URL ảnh nền (tuỳ chọn)</label>
                <input type="url" value={bannerForm.imageUrl || ''} onChange={e => setBannerForm(p => ({...p, imageUrl: e.target.value}))} placeholder="https://..." style={{ width: '100%', padding: '10px', borderRadius: 6, border: 'none', background: '#334155', color: 'white', marginTop: 4 }} />
              </div>
              <button onClick={handleSaveBanner} style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#0f172a', fontWeight: 800, padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 8 }}>
                💾 Lưu Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {adminLoginOpen && (
        <div className="modal-overlay" onClick={() => setAdminLoginOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <button className="close-btn" onClick={() => setAdminLoginOpen(false)}>×</button>
            <h2 style={{ color: '#fbbf24', textAlign: 'center', marginBottom: 20 }}>🔐 Đăng nhập Admin</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Tên đăng nhập</label>
                <input
                  type="text"
                  value={adminForm.user}
                  onChange={e => setAdminForm(prev => ({ ...prev, user: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                  placeholder="admin"
                  style={{ width: '100%', padding: '10px', borderRadius: 6, border: 'none', background: '#334155', color: 'white', marginTop: 4 }}
                />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Mật khẩu</label>
                <input
                  type="password"
                  value={adminForm.pass}
                  onChange={e => setAdminForm(prev => ({ ...prev, pass: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                  placeholder="••••••••••"
                  style={{ width: '100%', padding: '10px', borderRadius: 6, border: 'none', background: '#334155', color: 'white', marginTop: 4 }}
                />
              </div>
              <button
                onClick={handleAdminLogin}
                style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#0f172a', fontWeight: 800, padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 8 }}
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MVP Voting Modal */}
      {mvpVoteOpen && (
        <div className="modal-overlay" onClick={() => setMvpVoteOpen(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button className="close-btn" onClick={() => setMvpVoteOpen(null)}>×</button>
            <h2 style={{ color: '#fbbf24', textAlign: 'center', marginBottom: 8 }}>⭐ Bình chọn MVP</h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 20, fontSize: '0.9rem' }}>
              {mvpVoteOpen.teamA_name} vs {mvpVoteOpen.teamB_name}
            </p>
            {myVotes[mvpVoteOpen.id] ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#22c55e' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                <div>Bạn đã bình chọn: <strong>{myVotes[mvpVoteOpen.id]}</strong></div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {[...((() => {
                  const teamA = teams.find(t => t.id === mvpVoteOpen.teamA_id)
                  const teamB = teams.find(t => t.id === mvpVoteOpen.teamB_id)
                  const players = []
                  if (teamA) { if (teamA.player1) players.push({ name: teamA.player1, team: teamA.name }); if (teamA.player2) players.push({ name: teamA.player2, team: teamA.name }) }
                  if (teamB) { if (teamB.player1) players.push({ name: teamB.player1, team: teamB.name }); if (teamB.player2) players.push({ name: teamB.player2, team: teamB.name }) }
                  return players
                })())].map(p => {
                  const votes = mvpVoteOpen.mvpVotes?.[p.name] || 0
                  return (
                    <button key={p.name} onClick={() => handleMvpVote(mvpVoteOpen, p.name)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.08)', color: '#e2e8f0', cursor: 'pointer', fontWeight: 600 }}>
                      <span>⭐ {p.name} <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.85rem' }}>({p.team})</span></span>
                      <span style={{ color: '#fbbf24' }}>{votes} phiếu</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa Thể lệ cho Admin */}
      {rulesEditOpen && (
        <div className="modal-overlay" onClick={() => setRulesEditOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <button className="close-btn" onClick={() => setRulesEditOpen(false)}>×</button>
            <h2 style={{ color: '#fbbf24', textAlign: 'center', fontFamily: 'var(--font-brand)', margin: '0 0 16px' }}>
              ✏️ Chỉnh Sửa Thể Lệ Giải Đấu
            </h2>

            <div className="rules-editor-form">
              <div className="form-group">
                <label>Tiêu đề chính:</label>
                <input
                  type="text"
                  className="form-control"
                  value={rulesForm.title || ''}
                  onChange={e => setRulesForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Mô tả / Phụ đề giải đấu:</label>
                <input
                  type="text"
                  className="form-control"
                  value={rulesForm.subtitle || ''}
                  onChange={e => setRulesForm(prev => ({ ...prev, subtitle: e.target.value }))}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ color: '#00e5ff', margin: 0, fontSize: '1.2rem' }}>Các Mục / Phần quy định</h3>
                  <button className="btn-secondary btn-sm" onClick={handleAddRuleSection}>
                    ➕ Thêm mục mới
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(rulesForm.sections || []).map((sec, idx) => (
                    <div key={sec.id || idx} className="rule-editor-card">
                      <div className="rule-editor-header">
                        <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: '#94a3b8' }}>#{idx + 1}</span>
                          <input
                            type="text"
                            className="form-control"
                            style={{ flex: 1 }}
                            placeholder="Tiêu đề mục (ví dụ: 🏸 Quy mô giải)"
                            value={sec.title || ''}
                            onChange={e => handleSectionChange(idx, 'title', e.target.value)}
                          />
                          <input
                            type="color"
                            value={sec.color || '#38bdf8'}
                            onChange={e => handleSectionChange(idx, 'color', e.target.value)}
                            title="Chọn màu viền chủ đạo"
                            style={{ width: 40, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }}
                          />
                        </div>
                        <button className="btn-danger btn-sm" onClick={() => handleRemoveRuleSection(sec.id)}>
                          🗑️ Xóa
                        </button>
                      </div>

                      <div className="form-group">
                        <label>Danh sách quy định (Mỗi dòng 1 điều khoản):</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          value={(sec.items || []).join('\n')}
                          onChange={e => handleSectionItemsChange(idx, e.target.value)}
                          placeholder="Mỗi dòng là một điều khoản quy định..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 12 }}>
                <button className="btn-clear-option btn-sm" onClick={handleResetDefaultRules}>
                  ↺ Khôi phục mặc định
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-secondary" onClick={() => setRulesEditOpen(false)}>Hủy</button>
                  <button className="btn-primary" onClick={handleSaveRules} disabled={loading}>
                    {loading ? 'Đang lưu...' : '💾 Lưu Thể Lệ'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>{t.message}</div>
        ))}
      </div>
     </div>
   )
}

export default App