class Drawer{
    constructor(h, w, image){
      this.tileSize = 16;
      this.canvas = document.getElementById("screen");
      this.context = this.canvas.getContext("2d");
      this.context.font = '48px serif';
      this._defineTiles(image);
    }
}  