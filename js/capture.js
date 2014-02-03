// Flags

// Rendering tiles
var showTileBorder = false;
var showTileFill = true;
var tileFillLuminance = false; // Else hue

// Disks
var showDiskBorder = false;
var showDiskFill = false;
var showDiskCenter = false;

// Transmitters
var showTransmitter = true;


// Tile represents a possible location for a receiver
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
			ctx.translate(this.x,this.y);
			if(showTileFill){
				ctx.fillStyle = this.color;
				ctx.fillRect(0,0,this.w,this.h);
			}
			if(showTileBorder){
				ctx.strokeStyle = "#fff";
				ctx.strokeWidth = 1;
				ctx.strokeRect(0,0,this.w,this.h);
			}
		ctx.restore();
	}
};

Tile.draw_all = function(ctx){
	for(var i = 0; i < Tile.all.length; ++i){
		Tile.all[i].draw(ctx);
	}
};

// Transmitter
function Transmitter(x, y){
	this.x = x;
	this.y = y;
	this.r = 4;
	this.vx = Math.random()*.1;
	this.vy = Math.random()*.1;

	var i = Transmitter.all.length;
	while(i--){
		new CapDisk(this,Transmitter.all[i]);
		new CapDisk(Transmitter.all[i],this);
	}

	Transmitter.all.push(this);
}

Transmitter.all = [];

Transmitter.prototype = {
	update: function(dt) {
		this.x += this.vx*dt;
		this.y += this.vy*dt;

		if(this.x + this.r >= ctx.canvas.width){
			this.x = ctx.canvas.width - this.r;
			this.vx *= -1.0;
		}
		else if(this.x - this.r <= 0){
			this.x = this.r;
			this.vx *= -1.0;
		}

		if(this.y + this.r >= ctx.canvas.height){
			this.y = ctx.canvas.height - this.r;
			this.vy *= -1.0;
		}else if(this.y - this.r <= 0){
			this.y = this.r;
			this.vy *= -1.0;
		}
	},

	draw: function(ctx){
		if(showTransmitter){
			ctx.save();
				ctx.translate(this.x,this.y);
				ctx.fillStyle = "#abc";
				ctx.beginPath();
					ctx.arc(0,0,this.r,0,Math.PI*2,true);
				ctx.closePath();
				ctx.fill();
				ctx.strokeStyle = "#000";
				ctx.stroke();
			ctx.restore();
		}
	}
};

/* Buncha constants for disks below */

// Beta is the result of the capture power required
// Assumes ~6dBm
var beta = 0.65;
var betaSquared = Math.pow(0.65,2);
var denom = 1- betaSquared;
var betaOverDenom = beta / denom;

// Capture disk
function CapDisk(t1, t2){
	this.t1 = t1;
	this.t2 = t2;

	CapDisk.all_disks.push(this);

	this.update();
}

CapDisk.all_disks = [];

CapDisk.prototype = {
	draw: function(ctx){
		ctx.save();
			ctx.translate(this.x, this.y);
			ctx.beginPath();
				ctx.arc(0,0,this.r,0,Math.PI*2,true);
			ctx.closePath();
			// Border
			if(showDiskBorder){
				ctx.strokeStyle = "#fff";
				ctx.stroke();
			}
			// Fill
			if(showDiskFill){
				ctx.fillStyle = "rgba(0,255,0,.04)";
				ctx.fill();
			}
			// Center
			if(showDiskCenter){
				ctx.beginPath();
					ctx.arc(0,0,3,0,Math.PI*2,true);
				ctx.closePath();
				ctx.fillStyle = "#44f";
				ctx.fill();
				ctx.strokeStyle = "#fff";
				ctx.strokeWidth = 1;
				ctx.stroke();
			}
		ctx.restore();
	},
	update: function() {
		this.x = (this.t1.x - (betaSquared*this.t2.x))/denom;
		this.y = (this.t1.y - (betaSquared*this.t2.y))/denom;
		var dx = this.t1.x - this.t2.x;
		var dy = this.t1.y - this.t2.y;
		var dist = Math.sqrt(dx*dx+dy*dy);
		this.r = betaOverDenom * dist;
	}
};


var canvas = document.getElementById("canvas");
//canvas.width =  window.innerWidth - 30;
//canvas.height = window.innerHeight - 30;
var ctx = canvas.getContext("2d");


var numRows = 40;
var numCols = 40;

var fps = 10;
var msToDraw = 1000/fps;


var tileWidth = (canvas.width / numCols)|0;
var tileHeight = (canvas.height / numRows)|0;

var hex = ['a','b','c','d','e','f'];

for(var x = 0; x < numCols; ++x){
	for (var y = 0; y < numRows; ++y){
		new Tile(x*tileWidth,y*tileHeight,tileWidth,tileHeight,0,"#fff");
	}
}
var cH = canvas.height;
var cW = canvas.width;

var resize = function(){
//	canvas.height = window.innerHeight - 30;
//	canvas.width = window.innerWidth - 30;
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

	i = Transmitter.all.length;
	while(i--){
		Transmitter.all[i].x += (canvas.width - cW)/2;
		Transmitter.all[i].y += (canvas.height - cH)/2;
	}


	cH = canvas.height;
	cW = canvas.width;
};


window.onresize = resize;
resize();

var lastDraw = 0;

var fpsDiv = document.getElementById("fps");
var numTransmitters = 5;

for(var i = 0; i < numTransmitters; ++i){
	new Transmitter(canvas.width*Math.random(),canvas.height*Math.random());
}


var draw = function(time){
	var start = Date.now();
	fpsDiv.innerHTML = fps+" FPS";

	var dT = time - lastDraw;
	lastDraw = time;

	// Clear canvas
	ctx.save();
		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.fillRect(0,0,canvas.width,canvas.height);
	ctx.restore();

	updateSim(dT);

	// Draw tiles
	//Tile.draw_all(ctx);
	var i = Tile.all.length;
	while(i--){
		Tile.all[i].draw(ctx);
	}
	i = Transmitter.all.length;
	while(i--){
		Transmitter.all[i].draw(ctx);
	}

	i = CapDisk.all_disks.length;
	while(i--){
		CapDisk.all_disks[i].draw(ctx);
	}



	var delay = msToDraw - (Date.now()-start);
//	console.log(delay+"/"+dT+'/'+time);	
	if(delay > 0) {

		setTimeout(function() {
			requestAnimationFrame(draw);
		},delay);
	}else {
		requestAnimationFrame(draw);
	}

}

function LineSegment(x1,y1,x2,y2){
	this.x1 = x1;
	this.y1 = y1;
	this.x2 = x2;
	this.y2 = y2;
}

function Point(x,y){
	this.x = x;
	this.y = y;
}

function euclidDist(x1,y1,x2,y2){
	return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
}

/*
 * Author: ShreevatsaR
 * URL: http://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
 * Date: Feb 2, 2014
 */
function pointInRectangle(p,r){
	// AP DOT AB
	var APx = (p.x-r.x);
	var APy = (p.y-r.y);
	var ABx = r.w;
	var ABy = 0;
	var ADx = 0;
	var ADy = r.h;
	var APAB = (APx*ABx)+(APy*ABy);
	var ABAB = (ABx*ABx)+(ABy*ABy);
	var APAD = (APx*ADx)+(APy*ADy);
	var ADAD = (ADx*ADx)+(ADy*ADy);
	return (0 <= APAB) && (APAB <= ABAB) && (0 <= APAD) && (APAD <= ADAD);
}

/*
 * Author: bobobobo
 * URL: http://stackoverflow.com/questions/1073336/circle-line-collision-detection
 * Date: Feb 2, 2014
 */
function intersectCircle(c,ls){
	var d = {x: ls.x2-ls.x1, y:ls.y2-ls.y1};
	var f = {x: ls.x1-c.x, y: ls.y1-c.y};
	var a = (d.x*d.x)+(d.y*d.y);
	var b = 2*((f.x*d.x)+(f.y*d.y));
	var c = (f.x*f.x)+(f.y*f.y) - c.r*c.r;

	var disc =  b*b-4*a*c;
	if(disc < 0){
		return false;
	}
	disc = Math.sqrt(disc);

	var t1 = (-b - disc)/(2*a);
	var t2 = (-b + disc)/(2*a);

	if(t1 >= 0 && t1 <= 1){
		return true;
	}

	if(t2 >=0 && t2 <= 1){
		return true;
	}

	if(t1 <= 0 && t2 >= 1){
		return true;
	}

	return false;
}


function intersect(c,r){
	return pointInRectangle(new Point(c.x,c.y),r) ||
		intersectCircle(c,new LineSegment(r.x,r.y,r.x+r.w,r.y)) || // AB
		intersectCircle(c,new LineSegment(r.x+r.w,r.y,r.x+r.w,r.y+r.h)) || // BC
		intersectCircle(c,new LineSegment(r.x+r.w,r.y+r.h,r.x,r.y+r.h)) || // CD
		intersectCircle(c,new LineSegment(r.x,r.y+r.h,r.x,r.y)); // DA

}

var updateSim = function(dT){
	var i = Transmitter.all.length;
	while(i--){
		Transmitter.all[i].update(dT);
	}
	i = CapDisk.all_disks.length;
	while(i--){
		CapDisk.all_disks[i].update(dT);
	}

	// Update tiles
	i = Tile.all.length;
	while(i--){
		var tile = Tile.all[i];
		tile.score = 0;
		var j = CapDisk.all_disks.length;
		while(j--){
			var disk = CapDisk.all_disks[j];
			if(intersect(disk,tile)) {
				tile.score++;
			}
		}

		tile.score = tile.score / ((CapDisk.all_disks.length/2)|0);



		Tile.all[i].color = tileFillLuminance ? "hsla(0,100%,"+(tile.score > 0 ?
					70*tile.score : "0")+"%,1)" :  "hsla(" + Tile.all[i].score*120 +
			",80%,"+(tile.score > 0 ? "40%" : "0%")+",1)"; }



	

};

requestAnimationFrame(draw);

// Now handle events
$("#showTileBordersCheck").click(function(){
	showTileBorder = $(this).is(':checked');
});
$("#showTileFill").click(function(){
	showTileFill = $(this).is(':checked');
});
$("#tileFillLuminance").click(function(){
	tileFillLuminance = $(this).is(':checked');
});
$("#showDiskBorder").click(function(){
	showDiskBorder = $(this).is(':checked');
});
$("#showDiskFill").click(function(){
	showDiskFill = $(this).is(':checked');
});
$("#showDiskCenter").click(function(){
	showDiskCenter = $(this).is(':checked');
});
$('#fps').spinner({min: 1, max: 30,
	change: function(evt,ui){
		fps = $('#fps').val();
		msToDraw = 1000/fps;
		console.log(fps);
	},
	spin: function(evt,ui){
		fps = $('#fps').val();
		msToDraw = 1000/fps;
		console.log(fps);
	}});
	
