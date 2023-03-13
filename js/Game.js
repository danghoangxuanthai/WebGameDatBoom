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
    createMap: function() {
        this._timers = [];
        this._coordsBrick = [];
        this._brickPosition = [];
        
        this._map = this.add.tilemap('world');
        this._map.addTilesetImage('playing-environment');
        
        if (typeof this._stageBomberman.map != 'undefined') this._map.objects.Objects = this._stageBomberman.map;
        
        this._map.objects.Objects.forEach(function(brick) {
            if (brick.name == '' || brick.name.includes('brick')) brick.gid = 10;
            else if (brick.name == 'power') brick.gid = 20;
            else if (brick.name == 'door') brick.gid = 15;
        }, this);
        
        this._map.setCollisionBetween(1, 14, true, 'Map');
        
        this._brick = this.add.group();
        this._brick.enableBody = true;
        this._brick.physicsBodyType = Phaser.Physics.ARCADE;

        this._specialties = this.add.group();
        this._specialties.enableBody = true;
        this._specialties.physicsBodyType = Phaser.Physics.ARCADE;

        this._soundFindTheDoor = this.add.audio('find-the-door');
        this._soundStage = this.add.audio('stage-theme');

        this._soundStage.loopFull();
        
        this.game.stage.backgroundColor = '#1F8B00';
    
        this._layer = this._map.createLayer('Map');
        this._layer.resizeWorld();
        
        this._map.createFromObjects('Objects', 10, 'brick', 0, true, true, this._brick, Phaser.Sprite, false);
        this._brick.callAll('animations.add', 'animations', 'wait', [0], 10, true);
        this._brick.callAll('animations.add', 'animations', 'destroy', [1, 2, 3, 4, 5, 6], 10, true);
        this._brick.callAll('animations.play', 'animations', 'wait');
        this._brick.forEach(function(element) {
            element.body.setSize(16, 16, 1, 1);
            element.body.immovable = true;
            element.smoothed = false;
            this._brickPosition.push(Math.round(element.body.x)+','+Math.round(element.body.y));
        }, this);
        
        var powers_group = ['power-1', 'ExtendExplosion', 'power-2', 'AddBomb', 'power-3', 'TimeExploitBomb'],
            index = this.rnd.integerInRange(0, powers_group.length - 1);
        
        if (index % 2 != 0) index = 0;
        
        this._map.createFromObjects('Objects', 15, 'door', 0, true, true, this._specialties, Phaser.Sprite, false);
        this._map.createFromObjects('Objects', 20, powers_group[index], 0, true, true, this._specialties, Phaser.Sprite, false);
        
        this._specialties.getByName('door').kill();
        var power = this._specialties.getByName('power');
        power.kill();
        power.TypePower = powers_group[++index];
        
        this._crossroads = this.add.group();
        this._crossroads.enableBody = true;
        this._crossroads.physicsBodyType = Phaser.Physics.ARCADE;
        
         var distance = 40 * 2,
             rows = 11 / 2,
             cols = 35 / 2;
        
        for (var i = 0, y = 117, id = 0; i < rows; i++, y += distance) 
            for (var j = 0, x = 55; j < cols; j++, x += distance, id++) {
                //Modify JSON
                this._map.objects.Crossroads.push(
                        {
                         "height":1.6,
                         "id":id,
                         "name":("crossroad"+id),
                         "rotation":0,
                         "type":"",
                         "visible":true,
                         "width":1.6,
                         "x":x,
                         "y":y,
                         "gid":30
                        }
                );
            }
        
        this._map.createFromObjects('Crossroads', 30, null, 0, true, true, this._crossroads, Phaser.Sprite, false);
    },
}
