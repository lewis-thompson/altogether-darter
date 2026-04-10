Here I will define the logic needed for each game.
I will define the rules for each game.
Killer is the existing game, and I will define the logic for that too as an example of my definitions but I want no changes to the killer page or logic.

In all games, the player gets 3 turns which is known as a visit unless the game ends in the middle of a turn.


Killer:
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


Every Number:
- players must hit each number the target number of times
- Scoring:
  - Single hit = 1 point
  - Double hit = 2 points
  - Triple hit = 3 points
- If a player goes over the target, the excess is subtracted from their points on that number
- Game ends:
  - When a player has the target number for all numbers


Score Killer:
- players must get as many points as possible per visit
- they must equal or beat the previous players visit
- if they do not then they lose a life
- once a player runs out of lives they are eliminated from the game
- the scoring is the sum of the number values they hit in that visit
- Game ends:
  - The last player standing is the winner


X01:
- players must get to 0 points as fast as possible, starting on x01 points
- The numerical value they hit is subtracted from the starting number each go
- the players must get to exactly 0 points
- the players must finish on a double
- if the player gets to 0 with the last dart being a double they win and the game ends
- other than the last dart being a double, if they go to 1 or below then they are bust, their turn ends and they go back up to the number they started on


Doubles:
- the player aims for the given double
- they get a point for each hit
- the game ends when every double has been attempted
- the winner is who has the most points


Splitscore:
- the player has to aim for the given number each round
- each player starts on 40 points
- any hits on the given number add the numerical value to the players score
- if the player does not hit the number segmant with all 3 darts then their score is halved
- the rounds are fixed and are as follows:
- rounds:
    - 1 : the 15 segment
    - 2 : the 16 segment
    - 3 : hit any double
    - 4 : the 17 segment
    - 5 : the 18 segment
    - 6 : hit any treble
    - 7 : the 19 segment
    - 8 : the 20 segment
    - 9 : the bullseye segment
- the game ends when every player has had a go at all 9 rounds
- the winner of the game is the player with the most points
   


Cricket:



Shanghai:
- each player will aim for the assigned number
- Scoring (points based):
  - Single hit = 1 point
  - Double hit = 2 points
  - Triple hit = 3 points
- Scoring (numerical based) is the value of each hit
- the game ends when all rounds are completed or if a player hits a single, double and treble of the designated number which is called a shanghai
- the winner is the player that hits a shanghai or the player with the most points at the end of all rounds if a shanghai is not hit


Around The World:
- players must hit their number to advance
- players start at 1
- they go up the numbers all the way to 20, then outer bull then bullseye
- if they hit a single they move up 1 number
- if they hit a double they move up 2 numbers
- if they hit a treble they move up 3 numbers
- if they successfully hit with each dart in a visit then they get another turn
- the game ends when a player hits Treble 20 when they are on 20 or if they hit the bullseye when they are on bullseye
- the winner is the first player to do that
