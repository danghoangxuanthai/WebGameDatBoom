var fieldHeight = 12;
var fieldWidth = 17;
//tanthai
loadImage("img/tileset.png")
.then(image => {
  var drawer = new Drawer(fieldHeight, fieldWidth, image);
  var game = new Game(drawer, fieldHeight, fieldWidth);
});