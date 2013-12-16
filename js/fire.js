$(function() {
	var canvas = $("#fire").first()[0];

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var sketch = new Processing.Sketch();
	sketch.attachFunction = function(p) {
		// Simple function to pull all settings from an object and dump them into the processing object
		p.updateSettings = function(settings) {
			for (var x in settings) {
				p.s[x] = settings[x];
			}
		};

		// Resizes the processing canvas based on the html canvas
		p.resize = function() {
			p.size(canvas.width, canvas.height);

			p.gridHeight = p.floor(canvas.height / p.s.pixelSize);
			p.gridWidth = p.floor(canvas.width / p.s.pixelSize);
		};

		p.setup = function() {
			p.s = {};

			p.updateSettings({
				pixelSize: 15,

				// Perlin Variables
				perlinScale: 0.2,
				perlinStep: 0.2,

				// Ember Variables
				emberMin: 100,
				emberAlpha: 128,

				// Display Variables
				pixelBoundaries: false,
				heightScale: 0.5,

				currentPalette: 0,

				palettes: [
				   	[
						{val: 70,  color: [0,   0,   0]},
						{val: 110, color: [255, 0,   0]},
						{val: 150, color: [255, 255, 0]},
					],
					[
						{val: 70,  color: [0,   0,   0]},
						{val: 79,  color: [0,   0,   10]},
						{val: 80,  color: [0,   0,   90]},
						{val: 81,  color: [150, 75,  0]},
						{val: 82,  color: [150, 90,  0]},
						{val: 83,  color: [175, 75,  0]},
						{val: 84,  color: [255, 0,   0]},
						{val: 85,  color: [255, 128, 0]},
						{val: 115, color: [255, 255, 0]},
						{val: 120, color: [255, 255, 255]},
					],
				],
			});

			// Set the counters
			p.perlinTimer = 0,
			p.emberTimer = 0,

			// Set up the size
			p.resize();

			// Use this to limit tearing and make it more "pixely"
			p.frameRate(15);

			p.embers = [];
		};

		// Draws a big pixel
		p.pixelRect = function(x,y) {
			p.rect(x, y, 1, 1);
		};

		p.setupTransform = function() {
			var w = canvas.width;
			var h = canvas.height;

			p.translate(0,h);
			p.scale(1, -1);
			p.translate((w - p.gridWidth * p.s.pixelSize) / 2.0, 0);
			p.scale(p.s.pixelSize, p.s.pixelSize);
			p.strokeWeight(1 / p.s.pixelSize);
		};

		p.arrColor = function(cr) {
			return p.color(cr[0], cr[1], cr[2]);
		}

		p.heatToColor = function(heat) {
			var last = {val: 0, color: [0, 0, 0]};
			var color = 0;
			var palette = p.s.palettes[p.s.currentPalette];
			for (var i = 0; i < palette.length; i++) {
				if (heat <= palette[i].val) {
					color = p.lerpColor(p.arrColor(last.color),
					                    p.arrColor(palette[i].color),
					                    (heat - last.val) / (palette[i].val - last.val));
					break;
				}
				last = palette[i];
				color = p.arrColor(last.color);
			}
			return color;
		};

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
			if (p.s.pixelBoundaries) {
				strokeFunc = function (h) {
					return p.color(0, 0, 0);
				};
			}

			var black = p.color(0, 0, 0);

			for (var i = 0; i < p.gridHeight; i++) {
				for (var j = 0; j < p.gridWidth; j++) {
					var h = p.fire[i][j].h;
					var pixelColor = colorFunc(h);
					if (pixelColor != black) {
						p.stroke(strokeFunc(h));
						p.fill(colorFunc(h));
						p.pixelRect(j, i);
					}
				}
			}

			for (var i = 0; i < p.embers.length; i++) {
				p.noStroke();
				p.fill(p.heatToColor(90), p.s.emberAlpha);
				p.pixelRect(p.embers[i].x, p.embers[i].y+1);
			}

			p.popMatrix();
		};

		p.updateFire = function() {
			// Update fire
			p.fire = [];
			p.perlinTimer += 1;

			var maxDist = p.dist(0, 2, p.gridWidth / 2, p.gridHeight);
			for (var i = 0; i < p.gridHeight; i++) {
				p.fire.push([]);
				for (var j = 0; j < p.gridWidth; j++) {
					// Perlin noise
					var h = 255 * p.noise(j * p.s.perlinScale, i * p.s.perlinScale, p.perlinTimer * p.s.perlinStep);

					// Scale down based on height
					h *= 1.0 - (i / p.gridHeight) * p.s.heightScale;

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

				if (p.embers[i].y > canvas.height / p.s.pixelSize) {
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
					if (p.fire[i][x].h > p.s.emberMin) {
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
	};

	var p = new Processing(canvas, sketch);

	$(window).bind('keydown', function (e) {
		var matched = true;
		var s = p.s;
		//console.log(e.which);
		switch (e.which) {
			// Arrows
			case 37: // Left
				s.currentPalette = (s.currentPalette + s.palettes.length - 1) % s.palettes.length;
				break;
			case 38: // Up
				s.heightScale -= 0.1;
				break;
			case 39: // Right
				s.currentPalette = (s.currentPalette + 1) % s.palettes.length;
				break;
			case 40: // Down
				s.heightScale += 0.1;
				break;
			case 80: // 'p'
				s.pixelBoundaries = !s.pixelBoundaries;
				break;
			default:
				matched = false;
				break;
		}
		if (matched) e.preventDefault();
		p.updateSettings(s);
	});

	$(window).resize(function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		p.resize();
	});
});

