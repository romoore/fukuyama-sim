var line = {
	x: 300,
	y: 200,
	length: 50,
	angle: 0
};

var hex = ['1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];

function Ball(x, y, r) {
	this.x = x;
	this.y = y;
	this.r = r;
	this.vx = 0;
	this.vy = 0;
	this.color = "#"+hex[((Math.random()*hex.length)|0)]+hex[((Math.random()*hex.length)|0)]+hex[((Math.random()*hex.length)|0)];
	Ball.all.push(this);
}

Ball.all = [];
Ball.draw_all = function() {
	var i = Ball.all.length;
	while(i--){
		Ball.all[i].draw();
	}
};

Ball.prototype = {
	draw: function() {
		ctx.save();
			ctx.translate(this.x, this.y);
			ctx.fillStyle = this.color;
			ctx.beginPath();
				ctx.arc(0, 0, this.r, 0, Math.PI*2, true);
			ctx.closePath();
			ctx.fill();
		ctx.restore();
	},
	remove: function(){
		Ball.all.splice(Ball.all.indexOf(this),1);
	}
};

var canvas = document.getElementById("canvas");
canvas.height = window.innerHeight-30;
canvas.width = window.innerWidth-30;
line.x = canvas.width/ 2;
line.y = canvas.height/2;
var ctx = canvas.getContext("2d");
var lastTime = 0;
var cH = canvas.height;
var cW = canvas.width;

var resize = function(){
	canvas.height = window.innerHeight - 30;
	canvas.width = window.innerWidth - 30;
	line.x = canvas.width /2 ;
	line.y = canvas.height / 2;

	var i = Ball.all.length;
	while(i--){
		var ball = Ball.all[i];
		ball.y += (canvas.height-cH)/2;
		ball.x += (canvas.width-cW)/2;
	}

	cH = canvas.height;
	cW = canvas.width;
}

window.onresize = resize;

resize();

var draw = function(time){
	
	var timeDelta = (time - lastTime)/1000.0;
	// Clear canvas/display
	ctx.save();
		ctx.fillStyle = "rgba(0, 0, 0,0.3)";
		ctx.fillRect(0,0,canvas.width,canvas.height);
	ctx.restore();

	// Update angle
	line.angle += ((Math.PI*2)/ 10)*timeDelta;
	var x = line.x + line.length * Math.cos(line.angle);
	var y = line.y + line.length * Math.sin(line.angle);

	// Update balls
	if(Ball.all.length < 600){
		for(var i = 0; i < 5; i++){
			var ball = new Ball(x, y, 2);
			var random_offset = Math.random() * 1 - 0.5;
			var speed = Math.random() * 950 + 300;
			ball.vx = speed * Math.cos(line.angle + random_offset);
			ball.vy = speed * Math.sin(line.angle + random_offset);
		}
	}

	var i = Ball.all.length;
	while(i--){
		var ball = Ball.all[i];
		ball.x += ball.vx*timeDelta;
		ball.y += ball.vy*timeDelta;
		ball.vy += 500*timeDelta; //gravity
		ball.vx *= .999;
		ball.vy *= 0.99;
		if(ball.x % canvas.width !== ball.x){
			ball.remove();
		}
		else if(ball.y >= canvas.height-ball.r) {
			ball.y = canvas.height - ball.r;
			ball.vy *= -0.7;
			ball.r *= 1+(timeDelta);
			if(ball.r > 50){
				ball.r = 50;
			}
			if(Math.abs(ball.vy) < 50 && Math.abs(ball.vx < 50)) {
				ball.remove();
			}
		}

	}

	// Draw line
	ctx.save();
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 3;
		ctx.beginPath();
			ctx.moveTo(line.x, line.y);
			ctx.lineTo(x, y);
		ctx.stroke();
	ctx.restore();

	// Draw balls
	Ball.draw_all();

	lastTime = time;
	requestAnimationFrame(draw);

};

requestAnimationFrame(draw);
