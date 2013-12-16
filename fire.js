$(function() {
	var canvas = $("#fire").first()[0];

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var sketch = new Processing.Sketch();
	sketch.attachFunction = function(p) {
		// Simple function to pull all settings from an object and dump them into the processing object
		p.updateSettings = function(settings) {
			p.settings = settings;
			for (var x in settings) {
				p[x] = settings[x];
			}
		}

		// Resizes the processing canvas based on the html canvas
		p.resize = function() {
			p.size(canvas.width, canvas.height);

			p.gridHeight = p.floor(canvas.height / p.pixelSize);
			p.gridWidth = p.floor(canvas.width / p.pixelSize);
		}

		p.setup = function() {
			p.updateSettings({
				pixelSize: 15,

				// Perlin Variables
				perlinTimer: 0,
				perlinScale: 0.2,
				perlinStep: 0.2,

				// Ember Variables
				emberTimer: 0,
				emberAlpha: 128,

				// Display Variables
				pixelBoundaries: false,
				heightScale: 0.5,

				pallete: [
					{val: 80,  color: [0,0,0]},
					{val: 110, color: [255,0,0]},
					{val: 150, color: [255,255,0]}
				]
			});

			// Set up the size
			p.resize();

			// Use this to limit tearing and make it more "pixely"
			p.frameRate(15);


			p.embers = [];
		}

		// Draws a big pixel
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

		p.arrColor = function(cr) {
			return p.color(cr[0], cr[1], cr[2]);
		}

		// black -> blue -> -> red -> orange -> yellow
		p.heatToColor = function(heat) {
			var last = {val: 0, color: [0,0,0]};
			var color = 0;
			for (var i = 0; i < p.pallete.length; i++) {
				if (heat <= p.pallete[i].val) {
					color = p.lerpColor(p.arrColor(last.color),
					                    p.arrColor(p.pallete[i].color),
					                    (heat - last.val) / (p.pallete[i].val - last.val));
					break;
				}
				last = p.pallete[i];
				color = p.arrColor(last.color);
			}
			return color;
		}

		p.draw = function() {
			// Update state
			p.updateFire();

			// Clear the screen
			p.background(0);

			p.pushMatrix();
			p.setupTransform();

			var x1 = p.gridWidth / 2;
			var y1 = 2;

			var maxDist = p.dist(x1, y1, 0, p.gridHeight);

			p.noStroke();

			var strokeFunc = p.heatToColor;
			var colorFunc = p.heatToColor;
			if (p.pixelBoundaries) {
				strokeFunc = function (h) {
					return p.color(0, 0, 0);
				}
			}

			for (var i = 0; i < p.gridHeight; i++) {
				for (var j = 0; j < p.gridWidth; j++) {
					var h = p.fire[i][j].h;
					//p.stroke(p.heatToColor(h));
					p.stroke(strokeFunc(h));
					p.fill(colorFunc(h));
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

		p.updateFire = function() {
			// Update fire
			p.fire = [];
			p.perlinTimer += 1;

			var maxDist = p.dist(0, 2, p.gridWidth / 2, p.gridHeight);
			for (var i = 0; i < p.gridHeight; i++) {
				p.fire.push([]);
				for (var j = 0; j < p.gridWidth; j++) {
					// Perlin noise
					var h = 255 * p.noise(j * p.perlinScale, i * p.perlinScale, p.perlinTimer * p.perlinStep);

					// Scale down based on height
					h *= 1.0 - (i / p.gridHeight) * p.heightScale;

					// Scale down based on distance from origin
					h *= 1.0 - p.dist(p.gridWidth / 2, 2, j, i) / maxDist;
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

			// Possibly generate new embers
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

	$(window).bind('keypress', function (e) {
		var s = p.settings;
		switch (e.which) {
			case 112: // 'p'
				s.pixelBoundaries = !s.pixelBoundaries;
				break;
		}
		p.updateSettings(s);
	});

	$(window).resize(function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		p.resize();
	});
});
