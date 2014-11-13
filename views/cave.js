YUI.add('ksokoban-view-cave', function (Y) {
	'use strict';

	Y.namespace('KSokoban').CaveView = Y.Base.create('caveView', Y.View, [], {

		events: {
			'.cave': {
				mouseup: '_onClick',
				contextmenu: function (event) { event.preventDefault(); }
			}
		},

		initializer: function () {
			var cave = this.get('model');
			cave.after('steps', this._onSteps, this);
			cave.after('sync', this._onSync, this);
			cave.after('complete', this._onComplete, this);
		},

		render: function () {
			var cave = this.get('model'),
				map = cave.get('map'),
				container = this.get('container'),
				odometer = new Y.KSokoban.OdometerWidget(cave.getAttrs(['setName', 'levelNo', 'stepCount', 'pushCount', 'levelCountInSet']));

			this.set('odometer', odometer);

			odometer.render(container);
			container.appendChild('<div class="cave"></div>');
			this.set('caveNode', container.one('.cave'));

			this._createWalls(map);
			this._createItems(map);
			this._createGems(cave.get('gems'));
			this._createPlayer(cave);

			this._calcScale();

			Y.on('windowresize', Y.bind(this._calcScale, this));

			Y.one('doc').on('keypress', this._onKey, this);

			return this;
		},

		_createItems: function (map) {
			var _this = this;

			Y.Array.each(map, function (row, y) {
				Y.Array.each(row, function (cell, x) {
					if (cell.floor) {
						_this._createItem('floor', x, y);
					}
					if (cell.goal) {
						_this._createItem('goal', x, y);
					}
				});
			});
		},

		_createItem: function (cls, x, y) {
			var node = Y.Node.create('<div class="item ' + cls + '"></div>'),
				item = { x: x, y: y, node: node };
			this.get('items').push(item);
			this.get('caveNode').appendChild(node);

			return item;
		},

		_createGems: function (cave_gems) {
			var _this = this,
				gems = [];

			Y.Array.each(cave_gems, function (gem) {
				gems.push(_this._createItem('gem', gem.x, gem.y));
			});

			this.set('gems', gems);
		},

		_createPlayer: function (cave) {
			var player_node = Y.Node.create('<div class="item player"></div>'),
				player = Y.merge(cave.get('player'), { node: player_node });
			this.get('items').push(player);
			this.get('caveNode').appendChild(player_node);
			this.set('player', player);
		},

		_createWalls: function (map) {
			var walls = [], wall_models = [], cave_node = this.get('caveNode');

			Y.Array.each(map, function (row, y) {
				var wall;
				Y.Array.each(row, function (cell, x) {
					if (cell.wall) {
						wall = wall || { x: x, y: y, length: 0 };
						wall.length ++;
					}
					else if (wall != null) {
						walls.push(wall);
						wall = undefined;
					}
				});
				if (wall != null) {
					walls.push(wall);
				}
			});

			Y.Array.each(walls, function (wall) {
				var wall_view = new Y.KSokoban.WallView(wall);
				wall_models.push(wall_view.render());
				cave_node.appendChild(wall_view.get('container'));
			});

			this.set('walls', wall_models);
		},

		_calcScale: function () {
			var cave = this.get('model'),
				width = cave.get('width'),
				height = cave.get('height'),
				container = this.get('container'),
				win_width = container.get('winWidth') - 60,
				win_height = container.get('winHeight') - 86,
				cell_width = Math.floor(win_width / width / 2) * 2,
				cell_height = Math.floor(win_height / height / 2) * 2,
				cell_size = Math.min(cell_width, cell_height, 96);
			this.set('cellSize', cell_size);

			this.get('caveNode').setStyles({
				width: width * cell_size,
				height: height * cell_size
			});

			Y.Array.each(this.get('items'), Y.bind(this._placeItem, this));

			Y.Array.each(this.get('walls'), function (wall) {
				wall.set('cellSize', cell_size);
			});
		},

		_placeItem: function (item) {
			var cell_size = this.get('cellSize');
			item.node.setStyles({
				left:   item.x * cell_size,
				top:    item.y * cell_size,
				width:  cell_size,
				height: cell_size
			});
		},

		_onSync: function () {
			var attrs = this.getAttrs(['player', 'gems']),
				cave = this.get('model'),
				cave_attrs = cave.getAttrs(['player', 'gems']);

			attrs.player.x = cave_attrs.player.x;
			attrs.player.y = cave_attrs.player.y;

			Y.Array.each(cave_attrs.gems, function (gem, i) {
				attrs.gems[i].x = gem.x;
				attrs.gems[i].y = gem.y;
			});

			this._placeItem(attrs.player);
			Y.Array.each(attrs.gems, Y.bind(this._placeItem, this));

			this._syncOdometer();

			var banner = this.get('container').one('.level-completed');
			banner && banner.remove(true);
		},

		_syncOdometer: function () {
			var cave = this.get('model'),
				odometer = this.get('odometer');

			odometer.setAttrs(cave.getAttrs(['stepCount', 'pushCount']));
			odometer.syncUI();
		},

		_onKey: function (event) {
			var cave = this.get('model'),
				direction;

			switch (event.keyCode) {
				case 37: direction = 'left'; break;
				case 38: direction = 'up'; break;
				case 39: direction = 'right'; break;
				case 40: direction = 'down'; break;
			}

			if (direction != null) {
				if (event.shiftKey) {
					cave.goStraightAndPush(direction);
				}
				else if (event.ctrlKey) {
					cave.goStraight(direction);
				}
				else {
					cave.step(direction);
				}
				event.halt();
			}
		},

		_onClick: function (event) {
			var cave = this.get('model'),
				cell_size = this.get('cellSize'),
				region = this.get('caveNode').get('region'),
				x = Math.floor((event.clientX - region.left) / cell_size),
				y = Math.floor((event.clientY - region.top) / cell_size);

			switch (event.button) {
				case 1: cave.go(x, y); break;
				case 2:
					if (event.ctrlKey && event.altKey && event.shiftKey) {
						cave.reset();
					}
					else {
						cave[event.ctrlKey ? 'redo' : 'undo']();
					}
					break;
				case 3: cave.goStraightAndPushUntil(x, y); break;
			}

			event.halt();
		},

		_onSteps: function (event) {
			this._animateSteps(event.steps.slice());
			this._syncOdometer();
		},

		_animateSteps: function (steps) {
			var step = steps.shift(),
				player = this.get('player'),
				cell_size = this.get('cellSize');

			player.x = step.player.x;
			player.y = step.player.y;
			player.node.setStyles({
				left: player.x * cell_size,
				top:  player.y * cell_size
			});
			if (step.gem != null) {
				var gem = this.get('gems')[step.gem.no];
				gem.x = step.gem.x;
				gem.y = step.gem.y;
				gem.node.setStyles({
					left: gem.x * cell_size,
					top:  gem.y * cell_size
				});
			}
			if (steps.length > 0) {
				Y.later(25, this, this._animateSteps, [steps]);
			}
		},

		_onComplete: function () {
			var node = Y.Node.create('<div class="level-completed">Level completed!</div>');
			this.get('caveNode').appendChild(node);
		}

	}, {
		ATTRS: {
			cellSize: { value: null },
			caveNode: { value: null },
			items: { value: [] },
			gems: { value: [] },
			walls: { value: [] },
			player: { value: {} }
		}
	});

}, '0.1', {
	requires: ['view', 'node', 'event-resize', 'ksokoban-view-wall', 'ksokoban-odometer-widget']
});
