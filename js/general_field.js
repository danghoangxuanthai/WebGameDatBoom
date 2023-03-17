class GeneralField{
    constructor(h, w){
        this.height = h;
        this.width = w;
        this.field = this._generateField();
        this.bonuses = this._generateBonuses();
        while (!this._fieldIsValid(this.field)){
          console.log('Regenerate');
          this.field = this._generateField();
        }
      }

}