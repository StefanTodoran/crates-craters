<img src="misc/banner-2.png" alt="Crates and Craters" style="width: 100%;"/>

<h2 style="display: flex; align-items: center;">
  About
  <img src="assets/purple_theme/crate.png" style="height: 1em; margin-left: 0.3em;"/>
  <img src="assets/purple_theme/crater.png" style="height: 1em;"/>
</h2>

Built with JavaScript and React Native, Crates and Craters is a single player puzzle game built for iOS and Android. Don't let the simple premise and minimalist graphics decieve you thought, the game gets challenging, fast!

<h2 style="display: flex; align-items: center;">
  Features
  <img src="assets/purple_theme/theme_icon.png" style="height: 1em;"/>
</h2>

* Dozens of puzzling levels
* A built in level editor and level sharing
* Several color themes
* Minimalist game design and graphics
* Small app size
* And lots more to come!

<table>
  <tr>
    <td><img src="misc/demo-1.jpg" alt="Level One Preview" style="padding: 15%; height: 70%; width: 70%;"/></td>
    <td style="padding-left: 10%;">
      <h2 style="display: flex; align-items: center;">
        How To Play
        <img src="assets/purple_theme/help_icon.png" style="height: 1em; margin-left: 0.3em;"/>
      </h2>
      <p>
        The objective of the game is to collect all of the coins and reach the flag. The map is a grid of square tiles, where the player can move vertically and horizontally one tile at a time. The player can walk on any empty floor tile or tiles occupied by coins or keys to collect those items.
        <br><br>
        There are a number of obstacles in the players way. The first are walls, which cannot be walked through or interacted with in any way. The player cannot walk off the edges of the map either.
        <br><br>
        The second obstacle are doors, which function the same as a wall unless opened with a key. Any key can open any door, but is used up in the process and the door cannot be re-locked to retrieve the key. Once a door tile is opened with a key, it is just like an empty floor tile. To open a door once you have collected a key, move onto the door tile.
      </p>
    </td>
  </tr>

  <tr>
    <td style="padding-right: 10%;">
      <p>
        The primary obstacles and namesakes of the game are crates and craters. The player cannot walk on either type of tile, however, if there is an empty tile or a crater behind a crate, the player can <b>push</b> the crate by walking into it. If the tile behind is an empty tile, this simply moves the crate to that tile. Keep in mind that the player needs to be able to get behind the crate to push it!
        <br><br>
        If the tile the crate is pushed into is a crater, the crate will fall in and <b>fill in</b> the crater, creating a normal, walkable floor space. Crates cannot be pushed onto coins, keys, or into doors or the flag.
      </p>
    </td>
    <td><img src="misc/demo-2.jpg" alt="Level Two Preview" style="padding: 15%; height: 70%; width: 70%;"/></td>
  </tr>

  <tr>
    <td><img src="misc/demo-3.jpg" alt="Level Three Preview" style="padding: 15%; height: 70%; width: 70%;"/></td>
    <td style="padding-left: 10%;">
      <p>
        In order to successfully complete a level, the player must be able to reach the flag and stand on that tile after having collected all the coins.
        <br><br>
        Not every key need be collected. Beware of decoy keys, especially if a level contains less doors than keys!
        <br><br>
        These are all of the basic rules of Crates & Craters. There is a <b>how to play</b> page in the app in case you forget, or you can hop on in and try the tutorial levels to get started!
      </p>
    </td>
  </tr>

  <tr>
    <td style="padding-right: 10%;">
      <h2 style="display: flex; align-items: center;">
        Running Locally
        <img src="assets/purple_theme/player.png" style="height: 1em;"/>
        <img src="assets/purple_theme/left_icon.png" style="width: 1em;"/>
      </h2>
      <p>
        Running and testing the app locally will require that you possess a phone with Expo Go installed on it and a working internet connection. Open the root folder and type `expo start`. For some reason, tunnel is the only connection type that works, so open the dev tools and switch to that mode.
      </p>
      <br>
      <h2 style="display: flex; align-items: center;">
        Building APK
        <img src="assets/purple_theme/options_icon.png" style="height: 1em; margin-left: 0.2em;"/>
        <img src="assets/purple_theme/hammer_icon.png" style="height: 1em;"/>
      </h2>
      <p>
        Make sure you are logged in to expo with `expo whoami`. If not logged in, run <b>expo login</b>.
        Then use this command to build to apk for android: <br>
        <b>eas build -p android --profile preview</b>
      </p>
    </td>
    <td><img src="misc/demo-4.jpg" alt="Level Four Preview" style="padding: 15%; height: 70%; width: 70%;"/></td>
  </tr>
 </table>

<!-- <div style="display: flex; flex-direction: row; align-items: center;">
  <img src="misc/demo-1.jpg" alt="Level One Preview" style="width: 30%;"/>
  <div style="display: flex; flex-direction: column; padding-left: 10%; width: 60%;">
    <h2 style="display: flex; align-items: center;">
      How To Play
      <img src="assets/purple_theme/help_icon.png" style="height: 1em; margin-left: 0.3em;"/>
    </h2>
    <p>
      The objective of the game is to collect all of the coins and reach the flag. The map is a grid of square tiles, where the player can move vertically and horizontally one tile at a time. The player can walk on any empty floor tile or tiles occupied by coins or keys to collect those items.
      <br><br>
      There are a number of obstacles in the players way. The first are walls, which cannot be walked through or interacted with in any way. The player cannot walk off the edges of the map either.
      <br><br>
      The second obstacle are doors, which function the same as a wall unless opened with a key. Any key can open any door, but is used up in the process and the door cannot be re-locked to retrieve the key. Once a door tile is opened with a key, it is just like an empty floor tile. To open a door once you have collected a key, move onto the door tile.
    </p>
  </div>
</div> -->

<!-- <div style="display: flex; flex-direction: row; align-items: center;">
  <p style="padding-right: 20%; width: 50%;">
    The primary obstacles and namesakes of the game are crates and craters. The player cannot walk on either type of tile, however, if there is an empty tile or a crater behind a crate, the player can <b>push</b> the crate by walking into it. If the tile behind is an empty tile, this simply moves the crate to that tile. Keep in mind that the player needs to be able to get behind the crate to push it!
    <br><br>
    If the tile the crate is pushed into is a crater, the crate will fall in and <b>fill in</b> the crater, creating a normal, walkable floor space. Crates cannot be pushed onto coins, keys, or into doors or the flag.
  </p>
  <img src="misc/demo-2.jpg" alt="Level One Preview" style="width: 30%;"/>
</div> -->

<!-- <div style="display: flex; flex-direction: row; align-items: center;">
  <img src="misc/demo-3.jpg" alt="Level One Preview" style="width: 30%;"/>
  <p style="padding-left: 20%; width: 50%;">
    In order to successfully complete a level, the player must be able to reach the flag and stand on that tile after having collected all the coins.
    <br><br>
    Not every key need be collected. Beware of decoy keys, especially if a level contains less doors than keys!
    <br><br>
    These are all of the basic rules of Crates & Craters. There is a <b>how to play</b> page in the app in case you forget, or you can hop on in and try the tutorial levels to get started!
  </p>
</div> -->

<!-- <div style="display: flex; flex-direction: row; align-items: center;">
  <div style="display: flex; flex-direction: column; padding-right: 10%; width: 60%;">
    <h2 style="display: flex; align-items: center;">
      Running Locally
      <img src="assets/purple_theme/player.png" style="height: 1em;"/>
      <img src="assets/purple_theme/left_icon.png" style="width: 1em;"/>
    </h2>
    <p>
      Running and testing the app locally will require that you possess a phone with Expo Go installed on it and a working internet connection. Open the root folder and type `expo start`. For some reason, tunnel is the only connection type that works, so open the dev tools and switch to that mode.
    </p>
    <br>
    <h2 style="display: flex; align-items: center;">
      Building APK
      <img src="assets/purple_theme/options_icon.png" style="height: 1em; margin-left: 0.2em;"/>
      <img src="assets/purple_theme/hammer_icon.png" style="height: 1em;"/>
    </h2>
    <p>
      Make sure you are logged in to expo with `expo whoami`. If not logged in, run <b>expo login</b>.
      Then use this command to build to apk for android: <br>
      <b>eas build -p android --profile preview</b>
    </p>
  </div>
  <img src="misc/demo-4.jpg" alt="Level One Preview" style="width: 30%;"/>
</div> -->

<br>

<h2 style="display: flex; align-items: center;">
  TODO
  <img src="assets/purple_theme/flag.png" style="height: 1em;"/>
</h2>

* Add more sound variations
* Add option to turn off sounds
* Finish creating local saving funcitonality
* Make more levels
* Create a proper tutorial?
* Look into ways to have level sharing server
* Complete UI overhaul
