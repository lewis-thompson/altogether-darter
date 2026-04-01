# Database Schema

Database: Cloud Firestore

Authentication is handled by Firebase Authentication.
The authenticated user's UID is used as the `userId`.

All user-owned data is stored under the `/users/{userId}` document to simplify security rules.

---

# Root Collections

users

---

# Users

Path:

users/{userId}

Represents an authenticated application user.

Fields:

displayName: string
createdAt: timestamp

Example:

users/abc123
{
displayName: "Alex",
createdAt: timestamp
}

Subcollections:

players
games

---

# Players

Players represent people that can participate in games.
A user may create multiple players (for local multiplayer).

Path:

users/{userId}/players/{playerId}

Fields:

name: string
createdAt: timestamp

Example:

users/{userId}/players/p1
{
name: "Dave",
createdAt: timestamp
}

Subcollections:

stats

---

# Player Statistics

Statistics are stored per game type.

Path:

users/{userId}/players/{playerId}/stats/{gameType}

Example gameType values:

killer
x01
splitscore

Example:

users/{userId}/players/{playerId}/stats/killer

Fields:

gamesPlayed: number
gamesWon: number
averageFinishPosition: number
biggestSave: number
mostPointsInRound: number

Example document:

{
gamesPlayed: 10,
gamesWon: 4,
averageFinishPosition: 2.1,
biggestSave: 3,
mostPointsInRound: 5
}

---

# Games

Stores saved or completed games.

Path:

users/{userId}/games/{gameId}

Fields:

type: string
savedAt: timestamp
status: string

Possible values for `status`:

in_progress
finished
abandoned

Example:

users/{userId}/games/g1
{
type: "killer",
savedAt: timestamp,
status: "in_progress"
}

Subcollections:

players
state

---

# Game Players

Stores the current state for each player within a game.

Path:

users/{userId}/games/{gameId}/players/{playerId}

Fields:

playerNumber: number
score: number
targetScore: number

Example:

{
playerNumber: 1,
score: 2,
targetScore: 18
}

---

# Game State

Stores configuration and state specific to each game type.

Path:

users/{userId}/games/{gameId}/state/{gameType}

Example gameType values:

killer
x01
splitscore

---

# Killer Game State

Path:

users/{userId}/games/{gameId}/state/killer

Fields:

roundsPlayed: number
bullseyeBuyback: boolean

Example:

{
roundsPlayed: 4,
bullseyeBuyback: true
}

---

# Notes

1. All data for a user is stored under `/users/{userId}`.
2. `playerId` is generated when a player is created.
3. `gameId` is generated when a game is created.
4. Game-specific logic and fields are stored in `/state/{gameType}`.
5. Player state for a game is stored in `/players/{playerId}` within that game.
6. Statistics are stored per player and per game type.

---

# Example Full Game Structure

users/{userId}/games/g1
{
type: "killer",
savedAt: timestamp,
status: "in_progress"
}

users/{userId}/games/g1/state/killer
{
roundsPlayed: 4,
bullseyeBuyback: true
}

users/{userId}/games/g1/players/p1
{
playerNumber: 1,
score: 2,
targetScore: 18
}

users/{userId}/games/g1/players/p2
{
playerNumber: 2,
score: 3,
targetScore: 14
}
