jQuery.extend(verge);

// Rendering tiles
var showTileBorder = false;
var showTileFill = true;
var tileFillLuminance = false; // Else hue

// Disks
var showDiskBorder = true;
var showDiskFill = false;
var showDiskCenter = false;

// Transmitters
var showTransmitter = true;
var showWinnerLines = false;
var showLoserLines = false;
var showMaxTile = false;

var clearAlpha = 1.0;

// Canvas resolutions WxH
var resolutions = [{w:"100%",h:"100%"},{w:540,h:360},{w:720,h:480},{w:1080,h:720},{w:1440,h:960},{w:1920,h:1080}];
var isMaxCanvas = true;
var fullScreen = false;



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
Tile.max = 0;

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
				ctx.lineWidth = 1;
				ctx.strokeRect(0,0,this.w,this.h);
			}
			if(showMaxTile && this.score == Tile.max){
				ctx.strokeStyle = showTileFill ? "#000" : "#fff";
				ctx.lineWidth = 1;
				ctx.strokeRect(0,0,this.w-1,this.h-1);
				if(!showTileFill && showTileBorder){
					ctx.fillStyle = this.color;
					ctx.fillRect(0,0,this.w,this.h);
				}
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
	this.vx = Math.random()*.05;
	this.vy = Math.random()*.05;
	this.diskLosers = [];
	this.diskWinners = [];

	var i = Transmitter.all.length;
	while(i--){
		var c = new CapDisk(this,Transmitter.all[i]);
		this.diskWinners.push(c);
		c.t2.diskLosers.push(c);
		c = new CapDisk(Transmitter.all[i],this);
		this.diskLosers.push(c);
		c.t1.diskWinners.push(c);
	}

	Transmitter.all.push(this);
	var h = Math.random()*30 + (Transmitter.all.indexOf(this)/10)*300;
	this.color = "hsl("+h+",100%,60%)";
	this.colorA = "hsla("+h+",100%,60%,.2)";
}

var selectedTransmitter = null;
var paused = false;

function touchStartHandler(ev){
//	ev.preventDefault();
	ev._layerX = (ev.targetTouches[0].pageX - $('#canvas').offset().left);
	ev._layerY = (ev.targetTouches[0].pageY - $('#canvas').offset().top);
	mouseDownHandler(ev);
}

function touchEndHandler(ev){
	ev.preventDefault();
	mouseUpHandler(ev);
}

function touchMoveHandler(ev){
	if(ev.touches.length == 1){
		ev.preventDefault();
		ev._layerX = (ev.targetTouches[0].pageX - $('#canvas').offset().left);
		ev._layerY = (ev.targetTouches[0].pageY - $('#canvas').offset().top);
		mouseMoveHandler(ev);
	}
}

function mouseMoveHandler(ev){
	if(!paused){
		return;
	}
	var pos = getXY(ev);
	if(selectedTransmitter !== null){
		selectedTransmitter.x = pos.x;
		selectedTransmitter.y = pos.y;
	}

};

function getXY(ev){
	var x, y;

	/*
	 * Author: Mihai Sucan
	 * URL: http://dev.opera.com/articles/view/html5-canvas-painting/
	 * Date: Feb 4, 2014
	 */
	if(ev._layerX || ev._layerX == 0){ // touch events
		x = ev._layerX;
		y = ev._layerY;
	} else if(ev.offsetX || ev.offsetX == 0){ // Opera
		x = ev.offsetX;
		y = ev.offsetY;
	}else if(ev.layerX || ev.layerX == 0){ // Firefox
		x = ev.layerX;
		y = ev.layerY;
	} 
	return {x: x, y: y};
}

var mDownTime = 0;

/*
 * Currently paused: select a transmitter
 * Currently animating: time click for pausing
 */
function mouseDownHandler(ev){
	// Double event - touch?
	if(mDownTime > 0 && (Date.now()-mDownTime < 200)){
		return;
	}
	mDownTime = Date.now();
	if(paused){
		var pos = getXY(ev);
		var nearTx = null;
		var dist = 20;
		var i = Transmitter.all.length;
		while(i--){
			var t = Transmitter.all[i];
			var d = Math.abs(pos.x-t.x + pos.y-t.y);
			if(d<dist){
				nearTx = t;
				dist = d;
			}
		}
		if(nearTx !== null){
			selectedTransmitter = nearTx;
			selectedTransmitter.x = pos.x;
			selectedTransmitter.y = pos.y;
		}
	}
};

function mouseUpHandler(ev){
	// If animating, check to see if a "click" occurred to pause
	if(!paused){
		paused = true;
		$('#status').html('Paused&nbsp;-&nbsp;Drag&nbsp;transmitters');
	}else {
		if(selectedTransmitter == null && mDownTime > 0 && (Date.now() - mDownTime)<1000){
			paused = false;
			$('#status').html('Animating:&nbsp;Click&nbsp;to&nbsp;pause');
		}else {
			selectedTransmitter = null;
		}	
	}
	mDownTime = 0;
}

Transmitter.all = [];

function winLoseLine(tx,line,color){
	ctx.save();
		ctx.beginPath();
		ctx.moveTo(0,0);
		ctx.lineTo(line.x-tx.x,line.y-tx.y);
		ctx.closePath();
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.strokeStyle = color;
		ctx.lineWidth = 1;
		ctx.stroke();
	ctx.restore();

}

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
		if(showTransmitter || showLoserLines || showWinnerLines ){
			ctx.save();
				ctx.translate(this.x,this.y);
				if(showTransmitter){
					ctx.fillStyle = "#abc";
					ctx.beginPath();
						ctx.arc(0,0,this.r,0,Math.PI*2,true);
					ctx.closePath();
					ctx.fill();
					ctx.strokeStyle = "#000";
					ctx.stroke();
				}
				
				if(showLoserLines){
					var i = this.diskLosers.length;
					while(i--){
						winLoseLine(this,this.diskLosers[i],"#f44");
					}
				}
				if(showWinnerLines){
					var i = this.diskWinners.length;
					while(i--){
						winLoseLine(this,this.diskWinners[i],"#00f");
					}
				}

			ctx.restore();
		}
	},
	remove: function(){
		var i = this.diskLosers.length;
		while(i--){
			var d = this.diskLosers[i];
			d.t1.diskWinners.splice(d.t1.diskWinners.indexOf(d),1);
			CapDisk.all_disks.splice(CapDisk.all_disks.indexOf(d),1);
		}
		this.diskLosers.length = 0;
		i = this.diskWinners.length;
		while(i--){
			var d = this.diskWinners[i];
			d.t2.diskLosers.splice(d.t2.diskLosers.indexOf(d),1);
			CapDisk.all_disks.splice(CapDisk.all_disks.indexOf(d),1);
		}
		this.diskWinners.length = 0;
		Transmitter.all.splice(Transmitter.all.indexOf(this),1);
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
				ctx.strokeStyle = this.t1.color;
				ctx.stroke();
			}
			// Fill
			if(showDiskFill){
				ctx.fillStyle = this.t1.colorA;
//				ctx.fillStyle = "rgba(0,255,0,.04)";
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
				ctx.lineWidth = 1;
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
var ctx = canvas.getContext("2d");

canvas.addEventListener('mousemove', mouseMoveHandler, false);
canvas.addEventListener('mousedown',mouseDownHandler,false);
canvas.addEventListener('mouseup',mouseUpHandler,false);
canvas.addEventListener('touchmove', touchMoveHandler, false);
canvas.addEventListener('touchstart',touchStartHandler,false);
canvas.addEventListener('touchend',touchEndHandler,false);


var numRows = 5;
var numCols = 5;

var fps = 10;
var msToDraw = 1000/fps;


var tileWidth = (canvas.width / numCols)|0;
var tileHeight = (canvas.height / numRows)|0;

var hex = ['a','b','c','d','e','f'];


function genTiles(){
	tileWidth = (canvas.width / numCols)|0;
	tileHeight = (canvas.height / numRows)|0;
	for(var x = 0; x < numCols; ++x){
		for (var y = 0; y < numRows; ++y){
			new Tile(x*tileWidth,y*tileHeight,tileWidth,tileHeight,0,"#fff");
		}
	}
}
var cH = canvas.height;
var cW = canvas.width;

var originalCanvasStyle = null;
var originalIconStyle = null;

function toggleFullScreen(){
	
	fullScreen = !fullScreen;
	if(fullScreen){
		var $canvas = $('#canvas');
		originalCanvasStyle = $canvas.css(['position','right','bottom']);
		$canvas.css('position','fixed');
		$canvas.css('left','0');
		$canvas.css('top','0');
		$('.settings-row').hide();
		var $icon = $('#resize');
		originalIconStyle = $icon.css(['position','bottom','right']);
		$('#resize').css('position','fixed').css('bottom','5px').css('right','5px');
	}else {
		var $canvas = $('#canvas');
		$canvas.css(originalCanvasStyle);
		$('.settings-row').show();
		var $icon = $('#resize');
		$icon.css(originalIconStyle);
	}
	resize();
}


function resize(){
	if(fullScreen){
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}else if(isMaxCanvas){
		autoCanvasSize();
	}	
	if((tileWidth != (canvas.width/numCols)|0) || (tileHeight != (canvas.height/numRows)|0)){
		Tile.all.length = 0;
		genTiles();
	}
	tileWidth = canvas.width / numCols;
	tileHeight = canvas.height / numRows;

	var i = Tile.all.length;
	if(i == 0){
		genTiles();
		i = Tile.all.length;
	}
	while(i--){
		var tile = Tile.all[i]
		tile.w = tileWidth;
		tile.h = tileHeight;
	}

	i = Transmitter.all.length;
	while(i--){
		Transmitter.all[i].x *= (canvas.width/cW);//+= (canvas.width - cW)/2;
		Transmitter.all[i].y *= (canvas.height/cH);//+= (canvas.height - cH)/2;
	}


	cH = canvas.height;
	cW = canvas.width;
};
window.addEventListener('resize',resize,false);
window.addEventListener('orientationchange',resize,false);
resize();

var lastDraw = 0;

var fpsDiv = document.getElementById("fps");
var numTransmitters = 5;

for(var i = 0; i < numTransmitters; ++i){
	new Transmitter(canvas.width*Math.random(),canvas.height*Math.random());
}

function animate(dT){
	// Clear canvas
	ctx.save();
	if(clearAlpha < 1.0){
		ctx.fillStyle = "rgba(0, 0, 0,"+clearAlpha+")";
	}else {
		ctx.fillStyle = "#000";
	}
		ctx.fillRect(0,0,canvas.width,canvas.height);
	ctx.restore();

	updateSim(dT);

	// Draw tiles
	//Tile.draw_all(ctx);
	var i = Tile.all.length;
	if(i == 0){
		genTiles();
		i = Tile.all.length;
	}

	Tile.draw_all(ctx);
	if(showDiskBorder || showDiskFill || showDiskCenter ){
		i = CapDisk.all_disks.length;
		while(i--){
			CapDisk.all_disks[i].draw(ctx);
		}
	}

	i = Transmitter.all.length;
	while(i--){
		Transmitter.all[i].draw(ctx);
	}

}

var draw = function(time){
	//setTimeout(function(){
		window.requestAnimationFrame(draw);
		var dT = time - lastDraw;
		lastDraw = time;
		animate(dT);
	//	},1000/fps);
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
	Tile.max = 0;
	if(!paused){
	var i;
		i = Transmitter.all.length;
		while(i--){
			Transmitter.all[i].update(dT);
		}
	}
	if(showTileFill || showDiskBorder || showDiskFill || showDiskCenter || showWinnerLines || showLoserLines){
		i = CapDisk.all_disks.length;
		while(i--){
			CapDisk.all_disks[i].update(dT);
		}
	}
	if(showTileFill || showMaxTile){
		// Update tiles
		i = Tile.all.length;
		if(i == 0){
			genTiles();
			i = Tile.all.length;
		}
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
			if(tile.score > Tile.max){
				Tile.max = tile.score;
			}

			Tile.all[i].color = tileFillLuminance ? "hsla(0,100%,"+(tile.score > 0 ?
						70*tile.score : "0")+"%,1)" :  "hsla(" + Tile.all[i].score*120 +
				",80%,"+(tile.score > 0 ? "40%" : "0%")+",1)"; 
		}
	}
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
	},
	spin: function(evt,ui){
		fps = ui.value;
		msToDraw = 1000/fps;
	}});
	
$("#txCount").spinner({min: 1, max: 50,
	change: function(evt,ui){
		var newTxCnt = $('#txCount').val();
		while(newTxCnt > numTransmitters){
			new Transmitter(canvas.width*Math.random(),canvas.height*Math.random());
			++numTransmitters;
		}
		while(newTxCnt < numTransmitters){
			Transmitter.all[Transmitter.all.length-1].remove();
			--numTransmitters;
		}
	},
	spin: function(evt,ui){
		var newTxCnt = ui.value;
		while(newTxCnt > numTransmitters){
			new Transmitter(canvas.width*Math.random(),canvas.height*Math.random());
			++numTransmitters;
		}
		while(newTxCnt < numTransmitters){
			Transmitter.all[Transmitter.all.length-1].remove();
			--numTransmitters;
		}
		
	}
	});
$("#showTransmitters").click(function(){
	showTransmitter = $(this).is(':checked');
});

$('#numRows').spinner({min:1,max:100,
	spin: function(evt,ui){
		if(numRows != ui.value){
			numRows = ui.value;
			Tile.all.length = 0; // Empty Tile array
		}

	},
	change: function(evt,ui){
		var nv = $('#numRows').val();
		if(nv != numRows){
			numRows = nv;
			Tile.all.length = 0; // Empty tile array
		}
	}
});

$('#numCols').spinner({min:1,max:100,
	spin: function(evt,ui){
		if(numCols != ui.value){
			numCols = ui.value;
			Tile.all.length = 0; // Empty Tile array
		}

	},
	change: function(evt,ui){
		var nv = $('#numCols').val();
		if(nv != numCols){
			numCols = nv;
			Tile.all.length = 0; // Empty tile array
		}
	}
});


$('#transparencySlide').slider({min: 0, max: 1.0, step: 0.01, value: 1.0,
	slide: function(evt,ui){
		clearAlpha = ui.value;
		$('#transSlideLabel').text("Transparency: " + ((clearAlpha*100)|0) + "%");
	}
});

function autoCanvasSize(){
	var $c = $('#canvas');
	var $p = $($c.parent());
	$c.attr('width',$p.width());
	var h = $p.height();
	var vp2 = $.viewportH()/2;
	if(h > vp2){
		h = vp2;
	}
	$c.attr('height',h);
}

$('#resolutionSlide').slider({min:0,max:resolutions.length-1,step:1,value:0,
	slide: function(evt,ui){
		if(ui.value == 0){
			autoCanvasSize();
			isMaxCanvas = true;
		}else {
			canvas.width = resolutions[ui.value].w;
			canvas.height = resolutions[ui.value].h;
			isMaxCanvas = false;
		}
		resize();
		$('#resSlideLabel').html("Resolution: " + resolutions[ui.value].w + "&times;"+resolutions[ui.value].h);
	}
});

$('#showWinnerLines').click(function(){
	showWinnerLines = $(this).is(':checked');
});
$('#showLoserLines').click(function(){
	showLoserLines = $(this).is(':checked');
});

$('#showMaxTile').click(function(){
	showMaxTile = $(this).is(':checked');
});

$('#resize').click(function(){
	toggleFullScreen();
	var $icon = $('#full-icon');
	if(fullScreen){
		$icon.removeClass('glyphicon-fullscreen').addClass('glyphicon-resize-small');
	}else {
		$icon.removeClass('glyphicon-resize-small').addClass('glyphicon-fullscreen');
	}
});
