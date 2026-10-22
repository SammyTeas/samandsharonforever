setBackdropColor("#8CFFC2")

// =====================================================
// SETTINGS (tweak these)
// =====================================================
var DANGER_DISTANCE = 130;     // how close an enemy gets before the player looks worried
var REVERSE_SECONDS = 3;       // length of the reverse window
var BONUS_SECONDS = 3;         // seconds added per bonus
var ENEMY_LIFETIME = 10;       // seconds before an enemy disappears
var HOMING_UNLOCK_TIME = 10;   // seconds before homing enemies start appearing

// =====================================================
// PLAYER (mouse controlled)
// =====================================================
var player = new Image({
  url: "sandia.png",
  height: 60,
  width: 60,
  x: 0,
  y: 0
})

// Drawn on top of the player when an enemy is close
var playerWorried = new Image({
  url: "sandia_worried.png",   // swap in your own image
  height: 60,
  width: 60,
  x: 0,
  y: 0
})
playerWorried.hide()

// =====================================================
// TEXT
// =====================================================
var gameOverText = new Text({
  x: 0, y: 80, fontFamily: "Lato", size: 30,
  color: "#0B9957", text: "Search for Skype"
});
var playAgainText = new Text({
  x: 0, y: 40, fontFamily: "Lato", size: 20,
  color: "#0B9957", text: "Like, actually search for it (press P)"
});
var finalText = new Text({
  x: 0, y: 0, fontFamily: "Lato", size: 24,
  color: "#0B9957", text: ""
});
gameOverText.hide()
playAgainText.hide()
finalText.hide()

var timerText = new Text({
  x: 0, y: maxY - 60, fontFamily: "Lato", size: 30,
  color: "red", text: "Time: 0"
});
var reverseText = new Text({
  x: 0, y: maxY - 100, fontFamily: "Lato", size: 24,
  color: "purple", text: ""
});

// =====================================================
// STATE
// =====================================================
var enemies = [];
var timer = 0;          // seconds survived
var bonus = 0;          // bonus seconds collected
var reverseTicks = 0;   // counts down in 0.1s steps

// =====================================================
// TIMERS + HUD
// =====================================================
every(1, "second", () => {
  timer++;
});

every(0.1, "seconds", () => {
  if (reverseTicks > 0) {
    reverseTicks--;
  }
  timerText.text = 'Time: ' + (timer + bonus) + (bonus > 0 ? '  (+' + bonus + ' bonus)' : '');
  if (reverseTicks > 0) {
    reverseText.text = 'REVERSE! ' + Math.ceil(reverseTicks / 10);
  } else {
    reverseText.text = '';
  }
});

// =====================================================
// PLAYER FOLLOWS THE MOUSE
// =====================================================
forever(() => {
  player.x = mouseX;
  player.y = mouseY;
});

// =====================================================
// WORRIED FACE WHEN AN ENEMY IS CLOSE
// =====================================================
forever(() => {
  playerWorried.x = player.x;
  playerWorried.y = player.y;

  var danger = false;

  // during reverse nothing is dangerous, so no warning
  if (reverseTicks == 0) {
    enemies.forEach(enemy => {
      // bonus and reverse enemies are good, so they never trigger the warning
      if (enemy.kind == "bonus" || enemy.kind == "reverse") return;

      var dx = enemy.x - player.x;
      var dy = enemy.y - player.y;
      var distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < DANGER_DISTANCE) {
        danger = true;
      }
    });
  }

  if (danger) {
    playerWorried.show();
  } else {
    playerWorried.hide();
  }
});

// =====================================================
// SPAWNING
// =====================================================
every(0.5, "seconds", () => {
  var roll = random(1, 100);
  var kind = "default";

  if (roll <= 60) {
    kind = "default";
  } else if (roll <= 75) {
    kind = timer >= HOMING_UNLOCK_TIME ? "homing" : "default";
  } else if (roll <= 90) {
    kind = "bonus";
  } else {
    kind = "reverse";
  }

  var url = "boom.png";
  var size = 60;
  var speed = random(4, 9);   // default enemies vary in speed

  if (kind == "homing") {
    url = "boom.png";    // swap in your own image
    speed = 3;
  }
  if (kind == "bonus") {
    url = "boom.png";    // swap in your own image
    size = 50;
    speed = 4;
  }
  if (kind == "reverse") {
    url = "boom.png";    // swap in your own image
    size = 50;
    speed = 5;
  }

  var enemy = new Image({
    url: url, height: size, width: size, x: 0, y: 0
  });
  enemy.kind = kind;
  enemy.speed = speed;
  enemy.spawnTime = timer;
  enemy.dead = false;

  var side = random(1, 4);
  if (side == 1) { enemy.x = randomX(); enemy.y = maxY; }
  if (side == 2) { enemy.x = randomX(); enemy.y = minY; }
  if (side == 3) { enemy.x = maxX; enemy.y = randomY(); }
  if (side == 4) { enemy.x = minX; enemy.y = randomY(); }

  enemy.pointTowards(player.x, player.y);
  enemies.push(enemy);
});

// =====================================================
// ENEMY MOVEMENT + CLEANUP
// =====================================================
forever(() => {
  enemies.forEach(enemy => {
    if (enemy.kind == "homing") {
      enemy.pointTowards(player.x, player.y);
    }
    enemy.move(enemy.speed);

    // remove enemies that have been around too long (homing ones never expire)
    if (enemy.kind != "homing" && timer - enemy.spawnTime > ENEMY_LIFETIME) {
      enemy.dead = true;
      enemy.delete();
    }
  });
  enemies = enemies.filter(e => !e.dead);
});

// =====================================================
// COLLISIONS
// =====================================================
forever(() => {
  enemies.forEach(enemy => {
    if (enemy.dead) return;
    if (!enemy.touching(player)) return;

    if (enemy.kind == "bonus") {
      bonus += BONUS_SECONDS;
      enemy.dead = true;
      enemy.delete();
    } else if (enemy.kind == "reverse") {
      reverseTicks = REVERSE_SECONDS * 10;
      enemy.dead = true;
      enemy.delete();
    } else if (reverseTicks > 0) {
      // during reverse, default/homing enemies count as bonuses
      bonus += BONUS_SECONDS;
      enemy.dead = true;
      enemy.delete();
    } else {
      // game over
      finalText.text = 'You scored ' + (timer + bonus) + ' (' + timer + ' survived + ' + bonus + ' bonus)';
      gameOverText.show();
      playAgainText.show();
      finalText.show();
      player.hide();
      playerWorried.hide();
      freeze();
    }
  });
  enemies = enemies.filter(e => !e.dead);
});

// =====================================================
// RESTART (press P)
// =====================================================
forever(() => {
  if (keysDown.includes("P")) {
    player.show();
    gameOverText.hide();
    playAgainText.hide();
    finalText.hide();
    enemies.forEach(enemy => enemy.delete());
    enemies = [];
    timer = 0;
    bonus = 0;
    reverseTicks = 0;
    defrost();
  }
});

// =====================================================
// KEEP PLAYER ON SCREEN
// =====================================================
forever(() => {
  if (player.x > maxX) { player.x = maxX; }
  if (player.x < minX) { player.x = minX; }
  if (player.y > maxY) { player.y = maxY; }
  if (player.y < minY) { player.y = minY; }
});
setBackdropColor("#8CFFC2")

// =====================================================
// SETTINGS (tweak these)
// =====================================================
var DANGER_DISTANCE = 130;     // how close an enemy gets before the player looks worried
var REVERSE_SECONDS = 3;       // length of the reverse window
var BONUS_SECONDS = 3;         // seconds added per bonus
var ENEMY_LIFETIME = 10;       // seconds before an enemy disappears
var HOMING_UNLOCK_TIME = 10;   // seconds before homing enemies start appearing

// =====================================================
// PLAYER (mouse controlled)
// =====================================================
var player = new Image({
  url: "sandia.png",
  height: 60,
  width: 60,
  x: 0,
  y: 0
})

// Drawn on top of the player when an enemy is close
var playerWorried = new Image({
  url: "sandia_worried.png",   // swap in your own image
  height: 60,
  width: 60,
  x: 0,
  y: 0
})
playerWorried.hide()

// =====================================================
// TEXT
// =====================================================
var gameOverText = new Text({
  x: 0, y: 80, fontFamily: "Lato", size: 30,
  color: "#0B9957", text: "Search for Skype"
});
var playAgainText = new Text({
  x: 0, y: 40, fontFamily: "Lato", size: 20,
  color: "#0B9957", text: "Like, actually search for it (press P)"
});
var finalText = new Text({
  x: 0, y: 0, fontFamily: "Lato", size: 24,
  color: "#0B9957", text: ""
});
gameOverText.hide()
playAgainText.hide()
finalText.hide()

var timerText = new Text({
  x: 0, y: maxY - 60, fontFamily: "Lato", size: 30,
  color: "red", text: "Time: 0"
});
var reverseText = new Text({
  x: 0, y: maxY - 100, fontFamily: "Lato", size: 24,
  color: "purple", text: ""
});

// =====================================================
// STATE
// =====================================================
var enemies = [];
var timer = 0;          // seconds survived
var bonus = 0;          // bonus seconds collected
var reverseTicks = 0;   // counts down in 0.1s steps

// =====================================================
// TIMERS + HUD
// =====================================================
every(1, "second", () => {
  timer++;
});

every(0.1, "seconds", () => {
  if (reverseTicks > 0) {
    reverseTicks--;
  }
  timerText.text = 'Time: ' + (timer + bonus) + (bonus > 0 ? '  (+' + bonus + ' bonus)' : '');
  if (reverseTicks > 0) {
    reverseText.text = 'REVERSE! ' + Math.ceil(reverseTicks / 10);
  } else {
    reverseText.text = '';
  }
});

// =====================================================
// PLAYER FOLLOWS THE MOUSE
// =====================================================
forever(() => {
  player.x = mouseX;
  player.y = mouseY;
});

// =====================================================
// WORRIED FACE WHEN AN ENEMY IS CLOSE
// =====================================================
forever(() => {
  playerWorried.x = player.x;
  playerWorried.y = player.y;

  var danger = false;

  // during reverse nothing is dangerous, so no warning
  if (reverseTicks == 0) {
    enemies.forEach(enemy => {
      // bonus and reverse enemies are good, so they never trigger the warning
      if (enemy.kind == "bonus" || enemy.kind == "reverse") return;

      var dx = enemy.x - player.x;
      var dy = enemy.y - player.y;
      var distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < DANGER_DISTANCE) {
        danger = true;
      }
    });
  }

  if (danger) {
    playerWorried.show();
  } else {
    playerWorried.hide();
  }
});

// =====================================================
// SPAWNING
// =====================================================
every(0.5, "seconds", () => {
  var roll = random(1, 100);
  var kind = "default";

  if (roll <= 60) {
    kind = "default";
  } else if (roll <= 75) {
    kind = timer >= HOMING_UNLOCK_TIME ? "homing" : "default";
  } else if (roll <= 90) {
    kind = "bonus";
  } else {
    kind = "reverse";
  }

  var url = "boom.png";
  var size = 60;
  var speed = random(4, 9);   // default enemies vary in speed

  if (kind == "homing") {
    url = "boom.png";    // swap in your own image
    speed = 3;
  }
  if (kind == "bonus") {
    url = "boom.png";    // swap in your own image
    size = 50;
    speed = 4;
  }
  if (kind == "reverse") {
    url = "boom.png";    // swap in your own image
    size = 50;
    speed = 5;
  }

  var enemy = new Image({
    url: url, height: size, width: size, x: 0, y: 0
  });
  enemy.kind = kind;
  enemy.speed = speed;
  enemy.spawnTime = timer;
  enemy.dead = false;

  var side = random(1, 4);
  if (side == 1) { enemy.x = randomX(); enemy.y = maxY; }
  if (side == 2) { enemy.x = randomX(); enemy.y = minY; }
  if (side == 3) { enemy.x = maxX; enemy.y = randomY(); }
  if (side == 4) { enemy.x = minX; enemy.y = randomY(); }

  enemy.pointTowards(player.x, player.y);
  enemies.push(enemy);
});

// =====================================================
// ENEMY MOVEMENT + CLEANUP
// =====================================================
forever(() => {
  enemies.forEach(enemy => {
    if (enemy.kind == "homing") {
      enemy.pointTowards(player.x, player.y);
    }
    enemy.move(enemy.speed);

    // remove enemies that have been around too long (homing ones never expire)
    if (enemy.kind != "homing" && timer - enemy.spawnTime > ENEMY_LIFETIME) {
      enemy.dead = true;
      enemy.delete();
    }
  });
  enemies = enemies.filter(e => !e.dead);
});

// =====================================================
// COLLISIONS
// =====================================================
forever(() => {
  enemies.forEach(enemy => {
    if (enemy.dead) return;
    if (!enemy.touching(player)) return;

    if (enemy.kind == "bonus") {
      bonus += BONUS_SECONDS;
      enemy.dead = true;
      enemy.delete();
    } else if (enemy.kind == "reverse") {
      reverseTicks = REVERSE_SECONDS * 10;
      enemy.dead = true;
      enemy.delete();
    } else if (reverseTicks > 0) {
      // during reverse, default/homing enemies count as bonuses
      bonus += BONUS_SECONDS;
      enemy.dead = true;
      enemy.delete();
    } else {
      // game over
      finalText.text = 'You scored ' + (timer + bonus) + ' (' + timer + ' survived + ' + bonus + ' bonus)';
      gameOverText.show();
      playAgainText.show();
      finalText.show();
      player.hide();
      playerWorried.hide();
      freeze();
    }
  });
  enemies = enemies.filter(e => !e.dead);
});

// =====================================================
// RESTART (press P)
// =====================================================
forever(() => {
  if (keysDown.includes("P")) {
    player.show();
    gameOverText.hide();
    playAgainText.hide();
    finalText.hide();
    enemies.forEach(enemy => enemy.delete());
    enemies = [];
    timer = 0;
    bonus = 0;
    reverseTicks = 0;
    defrost();
  }
});

// =====================================================
// KEEP PLAYER ON SCREEN
// =====================================================
forever(() => {
  if (player.x > maxX) { player.x = maxX; }
  if (player.x < minX) { player.x = minX; }
  if (player.y > maxY) { player.y = maxY; }
  if (player.y < minY) { player.y = minY; }
});
