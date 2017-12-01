var Settings = function() {};

Settings.prototype = {
	gvar:  {
		beenHereBefore: false,
		xBG: 0,
		yBG: 0,
		xStart: 200,
		yStart: 350
	},

	preload: function(){
		// fixes all the positions
		if (!this.gvar.beenHereBefore){
			this.gvar.beenHereBefore = true;
			for (var i in this.gvar){
				if (i.startsWith('x'))
					this.gvar[i] += gameSettings.xOffset / 2;
				if (i.startsWith('y'))
					this.gvar[i] += gameSettings.yOffset / 2;
			}
		}
	},

	create: function(){
		game.add.sprite(this.gvar.xBG,this.gvar.yBG,'theatlas','menubg');
		var txt = game.add.bitmapText(this.gvar.xStart, this.gvar.yStart,'streamster','Back',60);
		txt.anchor.x = 0.5;
		txt.anchor.y = 0.5;
		txt.inputEnabled = true;
		txt.events.onInputUp.add(function () { game.state.start("Menu") });
	}
};