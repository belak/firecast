$(function() {
	var canvas = $("#fire").first()[0]

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var sketch = new Processing.Sketch();
	sketch.attachFunction = function(p) {
		p.setup = function() {
			p.size(canvas.width, canvas.height);

			// Use this to limit tearing and make it more "pixely"
			p.frameRate(15);
			p.pixelSize = 20;
			p.perlinTimer = 0;
			p.perlinScale = 0.3;
			p.perlinStep = 0.2;
			p.emberTimer = 0;
			p.emberAlpha = 128;

			p.embers = [];

			p.resize();
		}

		p.pixelRect = function(x,y) {
			p.rect(x, y, 1, 1);
		}

		p.setupTransform = function() {
			var w = canvas.width;
			var h = canvas.height;

			p.translate(0,h);
			p.scale(1, -1);
			p.translate((w - p.gridWidth * p.pixelSize) / 2.0, 0);
			p.scale(p.pixelSize, p.pixelSize);
			p.strokeWeight(1 / p.pixelSize);
		}

		// black -> blue -> -> red -> orange -> yellow
		p.heatToColor = function(heat) {
			heat *= 3;
			if (heat < 10) {
				return p.color(0,0,0);
			} else if (heat < 100) {
				return p.color(55+heat*2,0,0);
			} else {
				return p.color(255, (heat-100)*255/155,0);
			}
		}

		p.draw = function() {
			// Update stuff that needs to be
			p.updateFire();

			p.background(0);

			p.pushMatrix();
			p.setupTransform();

			var x1 = p.gridWidth / 2;
			var y1 = 2;

			var maxDist = p.dist(x1, y1, 0, p.gridHeight);

			p.noStroke();

			for (var i = 0; i < p.gridHeight; i++) {
				for (var j = 0; j < p.gridWidth; j++) {
					var h = p.fire[i][j].h - Math.abs(i - p.gridWidth / 2) * p.pixelSize / 7;
					p.stroke(p.heatToColor(h));
					p.fill(p.heatToColor(h));
					p.pixelRect(j, i);
				}
			}

			for (var i = 0; i < p.embers.length; i++) {
				p.stroke(128, 0, 0, p.emberAlpha);
				p.fill(128, 0, 0, p.emberAlpha);
				p.pixelRect(p.embers[i].x, p.embers[i].y+1);
			}

			p.popMatrix();
		}

		p.resize = function() {
			p.size(canvas.width, canvas.height);
			p.gridHeight = p.floor(canvas.height / p.pixelSize * 2 / 3);
			p.gridWidth = p.floor(canvas.width / p.pixelSize);
		}

		p.updateFire = function() {
			// Update fire
			p.fire = [];
			p.perlinTimer += 1;

			var maxDist = p.dist(0,2,p.gridWidth/2,p.gridHeight);
			for (var i = 0; i < p.gridHeight; i++) {
				p.fire.push([]);
				for (var j = 0; j < p.gridWidth; j++) {
					var h = 255 * p.noise(j * p.perlinScale, i * p.perlinScale, p.perlinTimer * p.perlinStep) - i * 7;
					h *= 1 - p.dist(p.gridWidth/2,2,j,i)/maxDist;
					var pixel = {
						h: h
					};
					p.fire[i].push(pixel);
				}
			}

			// Update embers
			for (var i = p.embers.length - 1; i >= 0; i--) {
				if (p.embers[i].t > 10) {
					p.embers[i].y += 1;
				}

				p.embers[i].t += 1;

				if (p.embers[i].y > canvas.height / p.pixelSize) {
					// Remove it
					p.embers.splice(i, 1);
				}
			}

			p.emberTimer += 1;
			if (p.emberTimer > 5) {
				p.emberTimer = 0;
				var x = p.floor(p.random() * (p.gridWidth));
				for (var i = 0; i < p.gridHeight; i++) {
					if (p.fire[i][x].h > 50) {
						var ember = {
							x: x,
							y: i,
							t: 10,
						};
						p.embers.push(ember);
						break;
					}
				}
			}
		}
	}

	var p = new Processing(canvas, sketch);

	$(window).resize(function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		p.resize();
	});
});
