# Python API Patterns – Tournament Backend

## FastAPI Setup

### Cấu Trúc Project

```
api/
├── main.py                  # FastAPI app entry point
├── config.py                # Settings & configuration
├── models.py                # Pydantic models
├── database.py              # Database connection
├── routes/
│   ├── __init__.py
│   ├── tournaments.py       # Tournament CRUD
│   ├── matches.py           # Match management
│   ├── teams.py             # Team & player management
│   └── live.py              # WebSocket live updates
├── services/
│   ├── bracket.py           # Bracket generation logic
│   ├── seeding.py           # Seeding algorithms
│   └── scoring.py           # Scoring/points calculation
├── middleware/
│   └── cors.py              # CORS configuration
└── requirements.txt
```

### requirements.txt

```
fastapi>=0.110.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.0
websockets>=12.0
python-multipart>=0.0.6
aiosqlite>=0.19.0
```

---

## Data Models (Pydantic)

```python
# models.py
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from typing import Optional


class TournamentFormat(str, Enum):
    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss"
    GROUP_STAGE = "group_stage"


class TournamentStatus(str, Enum):
    UPCOMING = "upcoming"
    REGISTRATION = "registration"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MatchStatus(str, Enum):
    UPCOMING = "upcoming"
    LIVE = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# === TEAM ===
class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    tag: str = Field(..., min_length=1, max_length=10)
    logo_url: Optional[str] = None
    region: Optional[str] = None


class TeamCreate(TeamBase):
    pass


class Team(TeamBase):
    id: int
    seed: Optional[int] = None
    wins: int = 0
    losses: int = 0
    points: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


# === PLAYER ===
class PlayerBase(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=50)
    real_name: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None
    country: Optional[str] = None


class Player(PlayerBase):
    id: int
    team_id: int
    stats: dict = {}

    class Config:
        from_attributes = True


# === MATCH ===
class MatchBase(BaseModel):
    tournament_id: int
    round_number: int
    match_number: int
    best_of: int = 1
    scheduled_at: Optional[datetime] = None


class MatchCreate(MatchBase):
    team1_id: Optional[int] = None
    team2_id: Optional[int] = None


class Match(MatchBase):
    id: int
    team1: Optional[Team] = None
    team2: Optional[Team] = None
    score1: Optional[int] = None
    score2: Optional[int] = None
    winner_id: Optional[int] = None
    status: MatchStatus = MatchStatus.UPCOMING
    stream_url: Optional[str] = None
    vod_url: Optional[str] = None

    class Config:
        from_attributes = True


# === TOURNAMENT ===
class TournamentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    game: str
    format: TournamentFormat
    max_teams: int = Field(default=16, ge=2, le=256)
    prize_pool: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    banner_url: Optional[str] = None


class TournamentCreate(TournamentBase):
    pass


class Tournament(TournamentBase):
    id: int
    status: TournamentStatus = TournamentStatus.UPCOMING
    teams: list[Team] = []
    current_round: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


# === API RESPONSES ===
class BracketResponse(BaseModel):
    tournament_id: int
    format: TournamentFormat
    rounds: list[dict]
    total_teams: int
    bracket_size: int


class StandingsEntry(BaseModel):
    rank: int
    team: Team
    wins: int
    losses: int
    win_rate: float
    points: int
    streak: list[str]  # ["W", "W", "L", "W", "L"]
    rank_change: int  # +2, -1, 0


class StandingsResponse(BaseModel):
    tournament_id: int
    standings: list[StandingsEntry]
    last_updated: datetime
```

---

## FastAPI Routes

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import tournaments, matches, teams, live

app = FastAPI(
    title="Tournament API",
    description="API for tournament management and live scoring",
    version="1.0.0",
)

# CORS - cho phép frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict trong production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tournaments.router, prefix="/api/tournaments", tags=["Tournaments"])
app.include_router(matches.router, prefix="/api/matches", tags=["Matches"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(live.router, prefix="/api/live", tags=["Live"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
```

```python
# routes/tournaments.py
from fastapi import APIRouter, HTTPException
from models import (
    Tournament, TournamentCreate, 
    BracketResponse, StandingsResponse
)

router = APIRouter()


@router.get("/", response_model=list[Tournament])
async def list_tournaments(
    status: str | None = None,
    game: str | None = None,
    limit: int = 20,
    offset: int = 0,
):
    """Danh sách tournaments với filter"""
    # Database query...
    pass


@router.get("/{tournament_id}", response_model=Tournament)
async def get_tournament(tournament_id: int):
    """Chi tiết tournament"""
    pass


@router.post("/", response_model=Tournament, status_code=201)
async def create_tournament(data: TournamentCreate):
    """Tạo tournament mới"""
    pass


@router.get("/{tournament_id}/bracket", response_model=BracketResponse)
async def get_bracket(tournament_id: int):
    """Lấy bracket data cho frontend rendering"""
    pass


@router.get("/{tournament_id}/standings", response_model=StandingsResponse)
async def get_standings(tournament_id: int):
    """Bảng xếp hạng"""
    pass


@router.post("/{tournament_id}/generate-bracket")
async def generate_bracket(tournament_id: int):
    """Tự động tạo bracket từ danh sách teams đã đăng ký"""
    pass
```

---

## WebSocket cho Live Updates

```python
# routes/live.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set
import json

router = APIRouter()


class ConnectionManager:
    """Quản lý WebSocket connections theo tournament"""

    def __init__(self):
        self.active_connections: dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tournament_id: int):
        await websocket.accept()
        if tournament_id not in self.active_connections:
            self.active_connections[tournament_id] = set()
        self.active_connections[tournament_id].add(websocket)

    def disconnect(self, websocket: WebSocket, tournament_id: int):
        if tournament_id in self.active_connections:
            self.active_connections[tournament_id].discard(websocket)

    async def broadcast(self, tournament_id: int, message: dict):
        """Broadcast update to all clients watching a tournament"""
        if tournament_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[tournament_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.add(connection)
            # Cleanup dead connections
            self.active_connections[tournament_id] -= dead_connections


manager = ConnectionManager()


@router.websocket("/ws/{tournament_id}")
async def websocket_endpoint(websocket: WebSocket, tournament_id: int):
    await manager.connect(websocket, tournament_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle different message types
            if message.get("type") == "score_update":
                # Process score update
                # Broadcast to all connected clients
                await manager.broadcast(tournament_id, {
                    "type": "score_update",
                    "match_id": message["match_id"],
                    "score1": message["score1"],
                    "score2": message["score2"],
                    "timestamp": message.get("timestamp"),
                })

            elif message.get("type") == "match_status":
                await manager.broadcast(tournament_id, {
                    "type": "match_status",
                    "match_id": message["match_id"],
                    "status": message["status"],
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, tournament_id)
```

---

## Bracket Generation Service

```python
# services/bracket.py
import math
from models import Team, Match


def generate_single_elimination(teams: list[Team]) -> dict:
    """
    Tạo single elimination bracket
    Seed order: 1v16, 8v9, 5v12, 4v13, 3v14, 6v11, 7v10, 2v15
    """
    n = len(teams)
    bracket_size = 2 ** math.ceil(math.log2(n))
    num_rounds = int(math.log2(bracket_size))

    # Standard seeding order
    seed_order = _generate_seed_order(bracket_size)

    rounds = []

    # Round 1
    round_1_matches = []
    for i in range(0, bracket_size, 2):
        idx1, idx2 = seed_order[i], seed_order[i + 1]
        team1 = teams[idx1] if idx1 < n else None  # BYE
        team2 = teams[idx2] if idx2 < n else None  # BYE
        round_1_matches.append({
            "match_number": len(round_1_matches) + 1,
            "team1": team1,
            "team2": team2,
            "score1": None,
            "score2": None,
            "status": "upcoming",
        })
    rounds.append({"name": "Round 1", "matches": round_1_matches})

    # Subsequent rounds (empty)
    for r in range(1, num_rounds):
        match_count = bracket_size // (2 ** (r + 1))
        round_name = _get_round_name(r, num_rounds)
        matches = [
            {
                "match_number": i + 1,
                "team1": None,
                "team2": None,
                "score1": None,
                "score2": None,
                "status": "upcoming",
            }
            for i in range(match_count)
        ]
        rounds.append({"name": round_name, "matches": matches})

    # Auto-advance BYEs
    _advance_byes(rounds)

    return {
        "format": "single_elimination",
        "rounds": rounds,
        "total_teams": n,
        "bracket_size": bracket_size,
    }


def _generate_seed_order(size: int) -> list[int]:
    """Generate proper seeding order so #1 seed meets #last seed"""
    if size == 2:
        return [0, 1]
    half = _generate_seed_order(size // 2)
    return [x * 2 for x in half] + [x * 2 + 1 for x in half]


def _get_round_name(round_index: int, total_rounds: int) -> str:
    if round_index == total_rounds - 1:
        return "Grand Final"
    elif round_index == total_rounds - 2:
        return "Semi-Finals"
    elif round_index == total_rounds - 3:
        return "Quarter-Finals"
    return f"Round {round_index + 1}"


def _advance_byes(rounds: list[dict]):
    """Auto-advance teams with BYE opponents"""
    if not rounds:
        return
    round_1 = rounds[0]["matches"]
    if len(rounds) < 2:
        return
    round_2 = rounds[1]["matches"]

    for i, match in enumerate(round_1):
        next_match_idx = i // 2
        if next_match_idx >= len(round_2):
            continue

        if match["team1"] is None and match["team2"] is not None:
            match["status"] = "completed"
            match["score1"] = 0
            match["score2"] = 1
            # Advance team2
            slot = "team1" if i % 2 == 0 else "team2"
            round_2[next_match_idx][slot] = match["team2"]

        elif match["team2"] is None and match["team1"] is not None:
            match["status"] = "completed"
            match["score1"] = 1
            match["score2"] = 0
            slot = "team1" if i % 2 == 0 else "team2"
            round_2[next_match_idx][slot] = match["team1"]
```

---

## Frontend API Client (JavaScript)

```javascript
// js/api.js
const API_BASE = '/api';

class TournamentAPI {
  /**
   * Fetch wrapper with error handling
   */
  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // === TOURNAMENTS ===
  static getTournaments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tournaments${query ? '?' + query : ''}`);
  }

  static getTournament(id) {
    return this.request(`/tournaments/${id}`);
  }

  static getBracket(tournamentId) {
    return this.request(`/tournaments/${tournamentId}/bracket`);
  }

  static getStandings(tournamentId) {
    return this.request(`/tournaments/${tournamentId}/standings`);
  }

  // === MATCHES ===
  static getMatches(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/matches${query ? '?' + query : ''}`);
  }

  static getMatch(id) {
    return this.request(`/matches/${id}`);
  }

  // === LIVE WEBSOCKET ===
  static connectLive(tournamentId, onMessage) {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${location.host}/api/live/ws/${tournamentId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onclose = () => {
      // Auto-reconnect after 3 seconds
      setTimeout(() => this.connectLive(tournamentId, onMessage), 3000);
    };

    return ws;
  }
}

export default TournamentAPI;
```

---

## Chạy Development Server

```bash
# Terminal 1: Python API
cd api
python -m venv venv
source venv/bin/activate  # hoặc venv\Scripts\activate trên Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
npm run dev
```

## Best Practices

1. **CORS config** – Dev: allow all, Production: restrict to frontend domain
2. **Pydantic validation** – Tất cả input đều được validate trước khi xử lý
3. **WebSocket reconnect** – Client tự động reconnect khi mất kết nối
4. **API versioning** – Sử dụng prefix `/api/v1/` cho production
5. **Error responses** – Trả về error message rõ ràng, consistent format
6. **Rate limiting** – Giới hạn requests cho public endpoints
7. **Caching** – Cache bracket/standings data, invalidate khi có update
