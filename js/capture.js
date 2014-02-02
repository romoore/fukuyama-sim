function Tile(x, y, w, h, score, color){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.score = score;
	this.color = color;
	Tile.all.push(this);
}

Tile.all = [];

Tile.prototype = {
	draw: function(ctx){
		ctx.save();
			ctx.translate(this.x*this.w,this.y*this.h);
			ctx.fillStyle = this.color;
			ctx.fillRect(0,0,this.w,this.h);
		ctx.restore();
	}
};

Tile.draw_all = function(ctx){
	for(var i = 0; i < Tile.all.length; ++i){
		Tile.all[i].draw(ctx);
	}
};

var canvas = document.getElementById("canvas");
canvas.width =  window.innerWidth - 30;
canvas.height = window.innerHeight - 30;
var ctx = canvas.getContext("2d");


var numRows = 5;
var numCols = 5;

var fps = 15;
var msToDraw = 1000/fps;


var tileWidth = (canvas.width / numCols)|0;
var tileHeight = (canvas.height / numRows)|0;

var hex = ['a','b','c','d','e','f'];

for(var x = 0; x < numCols; ++x){
	for (var y = 0; y < numRows; ++y){
		new Tile(x,y,tileWidth,tileHeight,0,"#fff");
	}
}

var resize = function(){
	canvas.height = window.innerHeight - 30;
	canvas.width = window.innerWidth - 30;
	if(canvas.height > 960)canvas.height = 960;
	if(canvas.width > 960) canvas.width = 960;
	tileWidth = canvas.width / numCols;
	tileHeight = canvas.height / numRows;

	var i = Tile.all.length;
	while(i--){
		var tile = Tile.all[i]
		tile.w = tileWidth;
		tile.h = tileHeight;
	}
};

window.onresize = resize;
resize();

var lastDraw = 0;

var draw = function(time){
	var start = Date.now();
	var dT = time - lastDraw;
	lastDraw = time;

	// Clear canvas
	ctx.save();
		ctx.fillStyle = "rgba(0, 0, 0, .1)";
		ctx.fillRect(0,0,canvas.width,canvas.height);
	ctx.restore();

	// Update tiles
	var i = Tile.all.length;
	while(i--){
		Tile.all[i].score = Math.random() > .98 ? 1 : 0 ;
		Tile.all[i].color = "hsla(" + Tile.all[i].score*120 + ",100%,"+Tile.all[i].score*50+"%,.2)";
	}

	// Draw tiles
	Tile.draw_all(ctx);

	var delay = msToDraw - (Date.now()-start);
	if(delay > 0) {

		setTimeout(function() {
			requestAnimationFrame(draw);
		},delay);
	}else {
		requestAnimationFrame(draw);
	}

}

requestAnimationFrame(draw);
