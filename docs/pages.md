# Pages

## Home

Purpose: Entry page for the app.

Actions available:

- Start New Game
- Continue Game
- View Statistics

---

## Game Setup

Purpose: Configure a new game before starting.

Steps:

1. Select Game Type from dropdown
2. Select Players from dropdown
3. Add a new player if not listed
4. Configure Extra Settings (dependent on selected game type)
5. Create Game

Game types currently supported:

- Killer

Future game types:

- X01
- SplitScore

---

## Game Screen

Purpose: Main gameplay screen where players interact with the game.

This screen changes depending on the selected game type.

---

### Killer Game Screen

Displays:

- Killer score to aim for
- Player names
- Player numbers
- Player lives
- Current player turn
- Current round
- Player scores
- Player targets

Inputs:

- Buttons for numbers 1–20
- Bullseye input
- Miss input

Game state rules:

- First round: killers cannot score on other players
- Points are calculated based on singles, doubles, triples
- Killer and target mechanics applied according to game rules

---

## Game Complete

Purpose: Display final results when a game ends.

Displays:

- Game type
- Game winner
- Player rankings
- Game statistics (dependent on game type)

Actions:

- Return to Home
- View Statistics

---

## Statistics

Purpose: View statistics for players and games.

Filters:

- Select Player(s)
- Select Game Type

Statistics displayed:

- Games Played
- Games Won
- Average Finish
- Game-specific statistics (e.g., Killer: biggest save, most points in a round)