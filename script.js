
setBackdropColor("#8CFFC2")
var player = new Image({
  url: "sandia.png",
  height: 60,
  width: 60,
  x: 0,
  y: 0
}) 
var gameOverText = new Text({
  x: 0,
  y: 80,
  fontFamily: "Lato",
  size: 30,
  color: "#0B9957",
  text: "Search for HiddenTreasure"
});
var playAgainText = new Text({
  x: 0,
  y: 40,
  fontFamily: "Lato",
  size: 20,
  color: "#0B9957",
  text: "Like, actually search for it"
});
gameOverText.hide()
playAgainText.hide()
forever(() => {
  if (keysDown.includes('UP')) {
    player.y += 7;
  }
  if (keysDown.includes('DOWN')) {
    player.y -= 7;
  }
  if (keysDown.includes('RIGHT')) {
    player.x += 7;
  }
  if (keysDown.includes('LEFT')) {
    player.x -= 7;
  }
});
var enemies = [];
every(0.5, "seconds", () => {
  var enemy = new Image({
    url: "boom.png",
    height: 60,
    width: 60,
    x: 0,
    y: 0
  })
  var randomNumber = random(1, 4);
  if (randomNumber == 1) {
    enemy.x = randomX();
    enemy.y = maxY;
  }
  if (randomNumber == 2) {
    enemy.x = randomX();
    enemy.y = minY;
  }
  if (randomNumber == 3) {
    enemy.x = maxX;
    enemy.y = randomY();
  }
  if (randomNumber == 4) {
    enemy.x = minX;
    enemy.y = randomY();
  }
  enemy.pointTowards(player.x, player.y);
  enemies.push(enemy);
});
forever(() => {
  enemies.forEach(enemy => {
    enemy.move(6);
    enemy.show()
  })
});
var timer = 0
var timerText = new Text({
  x: 0,
  y: maxY - 60,
  fontFamily: "Lato",
  size: 30,
  color: "red",
  text: () => 'Timer: ' + timer
});
every(1, "second", () => {
  timer++;
  timerText.text = 'Timer: ' + timer
});
forever(() => {
  enemies.forEach(enemy => {
    if (enemy.touching(player)) {
      gameOverText.show()
      playAgainText.show()
      player.hide()
      freeze();
    }
  })
});
forever(() => {
  if (keysDown.includes("P")) {
    player.show()
    gameOverText.hide()
    playAgainText.hide()
    enemies.forEach(enemy => enemy.delete())
    enemies = []
    timer = 0
    player.x = 0
    player.y = 0
    defrost();
  }
})
forever(() => {
  if (player.x > maxX) {
    player.x = maxX;
  }
  if (player.x < minX) {
    player.x = minX;
  }
  if (player.y > maxY) {
    player.y = maxY;
  }
  if (player.y < minY) {
    player.y = minY;
  }
});
