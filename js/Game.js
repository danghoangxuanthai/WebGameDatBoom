<reference path="lib/phaser.js"/>

Game.Game = function(game) {};

Game.Game.prototype = {

    init: function(stageBomberman) {
        this._stageBomberman = stageBomberman;
    },
    
    create: function() {
        this.createMap();
        this.createControls();
        this.createCharacter();
        this.createStatistics();
        this.createBomb();
        this.createAutonomy();
        this.createEnemies();
    },
    
    update: function() {
        
        this.physics.arcade.collide(this._bomberman, this._brick);
        this.physics.arcade.collide(this._bomberman, this._layer);
        this.physics.arcade.collide(this._bomberman, this._bombs);
        this.physics.arcade.collide(this._enemies, this._bombs);
        
        this.physics.arcade.collide(this._enemies, this._layer, null, function(enemy) {
            if (enemy.physicsLayer) return true;
            else return false;
        }, this);
        
        this.physics.arcade.collide(this._enemies, this._brick, null, function(enemy) {
            if (enemy.physicsBrick) return true;
            else return false;
        }, this);
        
        this.physics.arcade.overlap(this._bomberman, this._enemies, function(hero, enemy) { this.lose(); }, null, this);
        this.physics.arcade.overlap(this._bomberman, this._explosion, function(hero, explosion) { this.lose(); }, null, this);
        this.physics.arcade.overlap(this._explosion, this._bombs, function(explosion, detected_bomb) {
           this.exploitBomb(detected_bomb);
        }, null, this);
        
        this.physics.arcade.overlap(this._bomberman, this._specialties.getByName('power'), function(hero, power) { 
            this.updateCharacter(power.TypePower);            
            power.kill();
        }, null, this);
        
        this.physics.arcade.overlap(this._bomberman, this._specialties.getByName('door'), function(hero, door) { 
            if (this._enemies.length == 0 && (this._timerGame.running) && (Math.round(this._bomberman.body.x) == Math.round(door.body.x) && Math.round(this._bomberman.body.y) == Math.round(door.body.y))) 
                this.win();
        }, null, this);
        
        this.physics.arcade.collide(this._explosion, this._layer, null, function(explosion, layer) {
            explosion.kill();
        }, this);
        
        this.physics.arcade.overlap(this._explosion, this._enemies, function(explosion, enemy) {
            enemy.autonomy = false;
            enemy.body.enable = false;
            this.destroyEnemy(enemy);
        }, null, this);
        
        this.physics.arcade.overlap(this._explosion, this._brick, function(fragment, brick) { 
            brick.animations.play('destroy', 10, false, true); 
            if (brick.name == 'door-brick') this._specialties.getByName('door').revive();
            else if (brick.name == 'power-brick') this._specialties.getByName('power').revive();
            fragment.kill();
        }, null, this);
        
        this.physics.arcade.overlap(this._explosion, this._specialties.getByName('power'), function(power, fragment) { 
            fragment.events.onAnimationComplete.add(function() {
                for (var i = 0; i < this._numberEnemies; i++)
                    var stage = this._stageBomberman.stage - 1;
                    this.putEnemy(this._stageBomberman.stage_enemies[stage][0], false, power.body.x, power.body.y);
            }, this);
            power.kill();
        }, null, this);
        
        this.moveCharacter();
        this.activeMotionEnemy();
    },
    
    render: function() {
        this.game.debug.body(this._bomberman);
        if (this._bombs != undefined) {
            this._bombs.forEach(function(brick) {
                this.game.debug.body(brick);
            }, this);
        }
        this.game.debug.spriteInfo(this.hero.getByName('hero'), 50, 50);
    },
}