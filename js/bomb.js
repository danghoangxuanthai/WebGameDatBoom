class Bomb{
    constructor(x, y, power){
        this.timeLeft = 300;
        this.x = x;
        this.y = y;
        this.power = power;
      }
    
      checkState(players, general_field){
        this.timeLeft -= 1;
        if (this.timeLeft == 50) this._fire(players, general_field)
        else if (this.timeLeft == 0){
          this._cleanFire(general_field.field);
          return true;
        };
        return false;
      }
    
      _burnCell(players, general_field, x, y){
          players.forEach(player => {if ((player.actualX() == x) && (player.actualY() == y)) player.alive = false});
          if (general_field.field[y][x] != marks.empty){
            if (general_field.field[y][x] == marks.destructive) general_field.field[y][x] = marks.fire;
            return true;
          }
          general_field.field[y][x] = marks.fire;
          if (general_field.bonuses[y][x] != null){
            general_field.bonuses[y][x] = null;
            return true;
          }
          return false;
    
    }
}