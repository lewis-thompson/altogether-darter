- The hits for each player should only what they have hit in that turn if it is currently their turn, otherwise it should only show the last 3 shots at all times. There is currently a bug where I pressed back and it went back a player and every number theyve hit was there, I only want the previous 3.
If it is a current players turn, and they havent had any shots yet, when they press back it should undo the previous players final shot, so the other two shots should be the only shown.

- In around the world, the Dx button should count as a double (so the score should go up by 2 if hit) and the Tx button should count as treble (so the score should go up by 3) however this is not the case, they are both going up by 1.

- In score killer, when a player is out, they need to be shown as out, and their turn should be skipped as they are no longer in the game. It currently goes to that player who then cant input anything as they are out, so the game can not continue.

- X01, there is a bug here which I might need to investigate more. It is possible that when one player goes bust, all players get reset to the same number but it should just be the player that went bust

- the killer page is still not loading properly but the dummy-killer is. Apply the killer logic to the dummy-killer page and afterwards we can replace killer with the dummy-killer page if it works as inteded.