YUI.add('ksokoban-model-cave', function (Y) {
	'use strict';

	Y.namespace('KSokoban').CaveModel = Y.Base.create('cave', Y.Model, [], {

		initializer: function () {
			var level_data = this.get('level_data'),
				width_map = Y.Array.map(level_data, function (row_str) { return row_str.length; }),
				width = Y.Array.reduce(width_map, 0, function (a, v) { return Math.max(a, v); });

			this.set('history', []);
			this.set('historyPointer', 0);

			this.set('width', width);
			this.set('height', level_data.length);

			this._initMap(level_data, width);
			this._resetReachable();

			this.publish('steps', { emitFacade: true });

			this.on('steps', this._resetReachable, this);
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

		_resetReachable: function () {
			var map = this.get('map'),
				player = this.get('player'),
				reachable = [], new_reachable;

			Y.Array.each(map, function (row) {
				Y.Array.each(row, function (cell) {
					delete cell.reachable;
					delete cell.from;
				});
			});

			map[player.y][player.x].reachable = true;
			reachable.push(player);

			do {
				new_reachable = [];

				Y.Array.each(reachable, function (r) {
					var x = r.x, y = r.y,
						base_cell = map[y][x],
						steps = [{ x: x + 1, y: y }, { x: x - 1, y: y }, { x: x, y: y + 1 }, { x: x, y: y - 1 }];

					Y.Array.each(steps, function (step) {
						var cell = map[step.y][step.x];
						if (!(cell.wall || cell.gem || cell.reachable)) {
							cell.reachable = true;
							cell.from = { x: x, y: y };
							new_reachable.push(step);
						}
					});
				});

				reachable = new_reachable;
			} while (new_reachable.length > 0)
		},

		_steps: function (steps) {
			this.fire('steps', { steps: steps });
			this._pushHistory(steps);
		},

		_step: function (direction, steps, allow_push) {
			var map = this.get('map'),
				player = this.get('player'),
				dx = 0, dy = 0,
				step = {},
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

			if (new_player_cell.wall) { return false; }

			if (new_player_cell.gem && !allow_push) { return false; }

			if (new_player_cell.gem) {
				new_gem_y = new_player_y + dy;
				new_gem_x = new_player_x + dx;
				new_gem_cell = map[new_gem_y][new_gem_x];

				if (new_gem_cell.wall || new_gem_cell.gem) { return false; }

				this._moveGem(new_player_cell.gem_no, new_gem_x, new_gem_y);

				step.gem = { x: new_gem_x, y: new_gem_y, no: new_gem_cell.gem_no };
			}

			step.player = { x: new_player_x, y: new_player_y };

			if (steps.length == 0) {
				step.player.from = { x: player.x, y: player.y };
			}

			player.x = new_player_x;
			player.y = new_player_y;

			steps.push(step);

			return true;
		},

		_moveGem: function (gem_no, x, y) {
			var gems = this.get('gems'),
				gem = gems[gem_no],
				map = this.get('map'),
				old_cell = map[gem.y][gem.x],
				cell = map[y][x];

			gem.x = x;
			gem.y = y;
			cell.gem_no = gem_no;
			cell.gem = true;
			delete old_cell.gem;
			delete old_cell.gem_no;
		},

		step: function (direction) {
			var steps = [];

			if (this._step(direction, steps, true)) {
				this._steps(steps);
			}
		},

		goStraight: function (direction) {
			var steps = [];

			while (this._step(direction, steps, false));

			if (steps.length > 0) {
				this._steps(steps);
			}
		},

		goStraightAndPush: function (direction) {
			var steps = [];

			while (this._step(direction, steps, true));

			if (steps.length > 0) {
				this._steps(steps);
			}
		},

		go: function (x, y) {
			var map = this.get('map'),
				steps = [{ player: { x: x, y: y }}],
				cell = map[y][x];

			if (!cell.reachable || cell.from == null) { return false; }

			do {
				steps.unshift({ player: cell.from });
				cell = map[cell.from.y][cell.from.x];
			} while (cell.from != null);

			steps[0].player.from = this.get('player');

			this.set('player', { x: x, y: y });

			this._steps(steps);
		},

		goStraightAndPushUntil: function (x, y) {
			var player = this.get('player'),
				direction, steps = [], step_count = 0;

			if (player.x != x && player.y != y) { return false; }

			if (x < player.x)      { step_count = player.x - x; direction = 'left'; }
			else if (x > player.x) { step_count = x - player.x; direction = 'right'; }
			else if (y < player.y) { step_count = player.y - y; direction = 'up'; }
			else if (y > player.y) { step_count = y - player.y; direction = 'down'; }

			if (direction == null) { return false; }

			while (this._step(direction, steps, true) && -- step_count > 0);

			this._steps(steps);
		},

		_pushHistory: function (steps) {
			var history = this.get('history'),
				history_pointer = this.get('historyPointer');

			history[history_pointer ++] = steps;
			history.length = history_pointer;

			this.set('historyPointer', history_pointer);
		},

		undo: function () {
			var history_pointer = this.get('historyPointer');

			if (history_pointer == 0) { return false; }

			var gems = this.get('gems'),
				player = this.get('player'),
				history = this.get('history'),
				steps = history[-- history_pointer],
				back_steps = [];

			this.set('historyPointer', history_pointer);

			for (var i = steps.length - 1; i >= 0; i --) {
				var step = steps[i],
					from = step.player.from || steps[i-1].player,
					back_step = { player: { x: from.x, y: from.y } };

				player.x = back_step.player.x;
				player.y = back_step.player.y;

				if (step.gem != null) {
					back_step.gem = { x: step.player.x, y: step.player.y, no: step.gem.no };
					this._moveGem(back_step.gem.no, back_step.gem.x, back_step.gem.y);
				}

				back_steps.push(back_step);
			}

			this.fire('steps', { steps: back_steps });
		},

		redo: function () {
			var history = this.get('history'),
				history_pointer = this.get('historyPointer'),
				player = this.get('player');

			if (history_pointer >= history.length) { return false; }

			var steps = history[history_pointer ++];

			Y.Array.each(steps, Y.bind(function (step) {
				player.x = step.player.x;
				player.y = step.player.y;
				if (step.gem != null) {
					this._moveGem(step.gem.no, step.gem.x, step.gem.y);
				}
			}, this));

			this.set('historyPointer', history_pointer);

			this.fire('steps', { steps: steps });
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
