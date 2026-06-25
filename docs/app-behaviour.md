# Game Flow

## Game Setup Flow

1. User selects game type from dropdown
2. User adds players from dropdown
3. User can add new player not in the dropdown
4. User fills in extra fields dependent on selected game

---

## Killer Game Setup

1. User selects "Killer" as game type
2. User adds players from dropdown
3. User enters target number to be the killer
4. User can choose to assign numbers:
   - Randomly
   - Manually to each player
5. User selects if bullseye buyback option is enabled
   - If enabled, user chooses how many rounds bullseye buyback is available
6. User creates the game

---

## Killer Game Rules / Gameplay

- Players must hit their assigned number
- Scoring:
  - Single hit = 1 point
  - Double hit = 2 points
  - Triple hit = 3 points
- To become a killer, a player must reach exact target points
- Points rules:
  - If a player goes over the target, the excess is subtracted from their points
  - Once a player becomes a killer, they can hit other players' numbers
  - A killer hitting any active number deducts points from the corresponding player
  - Hitting their own number as a killer removes their killer status and deducts points from themselves
- Bust / Negative points:
  - If a player's score goes negative, they have one visit to return to 0 or they are out
- Bullseye Buyback:
  - If the bullseye buyback option is enabled and the round number ≤ buyback rounds, a player can come back
  - Comeback is achieved by hitting the bullseye
- First round:
  - Killers cannot take points from other players
- Game ends:
  - The last player standing is the winner