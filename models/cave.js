YUI.add('ksokoban-model-cave', function (Y) {
	'use strict';

	Y.namespace('KSokoban').CaveModel = Y.Base.create('cave', Y.Model, [], {

		initializer: function () {
			var level_data = this.get('level_data'),
				width_map = Y.Array.map(level_data, function (row_str) { return row_str.length; }),
				width = Y.Array.reduce(width_map, 0, function (a, v) { return Math.max(a, v); });

			this.set('width', width);
			this.set('height', level_data.length);

			this._initMap(level_data, width);

			this.publish('steps', {emitFacade: true});

		},

		_initMap: function (level_data, width) {
			var map = [], gems = [], player;

			Y.Array.each(level_data, function (data_row, y) {
				var row = [], was_wall = false,
					data_cell_arr = Y.Lang.trimRight(data_row).split('');
				for (var x = 0; x < width; x++) {
					var cell = {};
					switch (data_cell_arr[x]) {
						case '#':
							cell.wall = was_wall = true;
							break;
						case '$':
							cell.gem = cell.floor = true;
							cell.gem_no = gems.length;
							gems.push({ cell: cell, x: x, y: y });
							break;
						case '.':
							cell.goal = cell.floor = true;
							break;
						case '*':
							cell.goal = cell.floor = cell.gem = true;
							cell.gem_no = gems.length;
							gems.push({ cell: cell, x: x, y: y });
							break;
						case '@':
							cell.floor = true;
							player = { x: x, y: y };
							break;
						case ' ':
							cell [ was_wall && (0 < y && y < level_data.length - 1) ? 'floor' : 'space' ] = true;
						default:
							cell.space = true;
					}
					row.push(cell);
				}
				map.push(row);
			});
			this.set('map', map);
			this.set('gems', gems);
			this.set('player', player);
		},

		_step: function (direction, steps, allow_push) {
			var map = this.get('map'),
				player = this.get('player'),
				dx = 0, dy = 0,
				step,
				new_player_x, new_player_y, new_player_cell,
				new_gem_x, new_gem_y, new_gem_cell;

			switch (direction) {
				case 'up':    dy = -1; break;
				case 'down':  dy = +1; break;
				case 'left':  dx = -1; break;
				case 'right': dx = +1; break;
				default: return false;
			}

			new_player_y = player.y + dy;
			new_player_x = player.x + dx;
			new_player_cell = map[new_player_y][new_player_x];

			if (new_player_cell.wall) {
				return false;
			}

			if (new_player_cell.gem) {
				if (!allow_push) {
					return false;
				}
				new_gem_y = new_player_y + dy;
				new_gem_x = new_player_x + dx;
				new_gem_cell = map[new_gem_y][new_gem_x];

				if (new_gem_cell.wall || new_gem_cell.gem) {
					return false;
				}

				var gems = this.get('gems'),
					gem = gems[new_player_cell.gem_no];
				gem.x = new_gem_x;
				gem.y = new_gem_y;
				player.x = new_player_x;
				player.y = new_player_y;
				new_gem_cell.gem_no = new_player_cell.gem_no;
				new_gem_cell.gem = true;
				new_player_cell.gem = false;
				delete new_player_cell.gem_no;

				step = {
					player: { x: new_player_x, y: new_player_y },
					gem: { x: new_gem_x, y: new_gem_y, no: new_gem_cell.gem_no }
				}
			}
			else {
				player.x = new_player_x;
				player.y = new_player_y;
				step = {
					player: { x: new_player_x, y: new_player_y }
				};
			}

			steps.push(step);

			return true;
		},

		step: function (direction) {
			var steps = [];

			if (this._step(direction, steps, true)) {
				this.fire('steps', { steps: steps });
			}
		},

		goStraight: function (direction) {
			var steps = [];

			while (this._step(direction, steps, false));

			if (steps.length > 0) {
				this.fire('steps', { steps: steps });
			}
		},

		goStraightAndPush: function (direction) {
			var steps = [];

			while (this._step(direction, steps, true));

			if (steps.length > 0) {
				this.fire('steps', { steps: steps });
			}
		}

	}, {
		ATTRS: {
			map: { value: [] },
			gems: { value: [] },
			player: { value: { x: null, y: null } }
		}
	});

}, '0.1', {
	requires: ['model', 'array-extras']
});
