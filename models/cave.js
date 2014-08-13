YUI.add('ksokoban-model-cave', function (Y) {
	'use strict';

	Y.namespace('KSokoban').CaveModel = Y.Base.create('cave', Y.Model, [], {

		initializer: function () {
			var level_data = this.get('levelData'),
				width_map = Y.Array.map(level_data, function (row_str) { return row_str.length; }),
				width = Y.Array.reduce(width_map, 0, function (a, v) { return Math.max(a, v); });

			this.set('id', this.get('setName') + '#' + this.get('levelNo'));

			this.set('width', width);
			this.set('height', level_data.length);

			this._initMap(level_data, width);

			this.publish('steps', { emitFacade: true });
			this.publish('sync', { emitFacade: false });
			this.publish('turn', { emitFacade: true });

			this.on('steps', this._resetReachable, this);

			this.load();
		},

		_initMap: function (level_data, width) {
			var map = [], gems = [], player;

			Y.Array.each(level_data, function (data_row, y) {
				var row = [],
					data_cell_arr = Y.Lang.trimRight(data_row).split('');
				for (var x = 0; x < width; x++) {
					var cell = {};
					switch (data_cell_arr[x]) {
						case '#':
							cell.wall = true;
							break;
						case '$':
							cell.gem = true;
							cell.gem_no = gems.length;
							gems.push({ x: x, y: y });
							break;
						case '.':
							cell.goal = true;
							break;
						case '*':
							cell.goal = cell.gem = true;
							cell.gem_no = gems.length;
							gems.push({ x: x, y: y });
							break;
						case '@':
							player = { x: x, y: y };
							break;
					}
					row.push(cell);
				}
				map.push(row);
			});
			this._initFloor(map, player.x, player.y);

			this.set('originalMap', map);
			this.set('originalGems', gems);
			this.set('originalPlayer', player);
			this._reset();
		},

		_initFloor: function (map, x, y) {
			this._flood(map, x, y,
				function (cell) {
					return !(cell.wall || cell.floor);
				},
				function (cell, x, y) {
					cell.floor = true;
				});
		},

		reset: function () {
			this._reset();
			this.save();
			this.fire('sync');
		},

		_reset: function () {
			this.setAttrs({
				map: Y.clone(this.get('originalMap'), true),
				gems: Y.clone(this.get('originalGems'), true),
				player: Y.clone(this.get('originalPlayer'), true),
				historyPointer: 0,
				history: [],
				stepCount: 0,
				pushCount: 0
			});
			this._resetReachable();
		},

		_resetReachable: function () {
			var map = this.get('map'),
				player = this.get('player');

			Y.Array.each(map, function (row) {
				Y.Array.each(row, function (cell) {
					delete cell.reachable;
					delete cell.from;
				});
			});

			this._flood(map, player.x, player.y,
				function (cell) {
					return !(cell.wall || cell.gem || cell.reachable);
				},
				function (cell, x, y) {
					cell.reachable = true;
					if (x != null && y != null) {
						cell.from = { x: x, y: y };
					}
				});
		},

		_flood: function (map, x, y, condition_callback, action_callback) {
			var cells = [], new_cells = [],
				cell = { x: x, y: y };

			action_callback(cell);
			cells.push(cell);

			do {
				new_cells = [];

				Y.Array.each(cells, function (r) {
					var x = r.x, y = r.y,
						steps = [{ x: x + 1, y: y }, { x: x - 1, y: y }, { x: x, y: y + 1 }, { x: x, y: y - 1 }];

					Y.Array.each(steps, function (step) {
						var cell = map[step.y][step.x];
						if (condition_callback(cell)) {
							action_callback(cell, x, y);
							new_cells.push(step);
						}
					});
				});

				cells = new_cells;
			} while (new_cells.length > 0)
		},

		_step: function (direction, steps, allow_push) {
			var map = this.get('map'),
				player = this.get('player'),
				dx = 0, dy = 0,
				step = {}, gem_no,
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
				gem_no = new_player_cell.gem_no;

				if (new_gem_cell.wall || new_gem_cell.gem) { return false; }

				this._moveGem(gem_no, new_gem_x, new_gem_y);

				step.gem = { x: new_gem_x, y: new_gem_y, no: gem_no };

				this.set('pushCount', this.get('pushCount') + 1);
			}

			step.player = { x: new_player_x, y: new_player_y };

			if (steps.length == 0) {
				step.player.from = { x: player.x, y: player.y };
			}

			player.x = new_player_x;
			player.y = new_player_y;

			steps.push(step);

			this.set('stepCount', this.get('stepCount') + 1);

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
				this._steps(direction, 1, steps);
			}
		},

		goStraight: function (direction) {
			var steps = [];

			while (this._step(direction, steps, false));

			if (steps.length > 0) {
				this._steps(direction, steps.length, steps);
			}
		},

		goStraightAndPush: function (direction) {
			var steps = [];

			while (this._step(direction, steps, true));

			if (steps.length > 0) {
				this._steps(direction, steps.length, steps);
			}
		},

		_go: function (x, y) {
			var map = this.get('map'),
				player = this.get('player'),
				steps = [{ player: { x: x, y: y }}],
				cell = map[y][x];

			if (!cell.reachable || cell.from == null) { return false; }

			while (cell.from.x != player.x || cell.from.y != player.y) {
				steps.unshift({ player: cell.from });
				cell = map[cell.from.y][cell.from.x];
			}

			steps[0].player.from = this.get('player');

			this.set('player', { x: x, y: y });

			this.set('stepCount', this.get('stepCount') + steps.length);

			return steps;
		},

		go: function (x, y) {
			var steps = this._go(x, y);

			if (steps === false) { return false; }

			this._steps(x, y, steps);
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

			if (steps.length > 0) {
				this._steps(direction, steps.length, steps);
			}
		},

		_steps: function (direction, count, steps) {
			this._pushHistory(direction, count, steps);
			this.save();
			this.fire('steps', { steps: steps });
		},

		_pushHistory: function (direction, count, steps) {
			var history = this.get('history'),
				history_pointer = this.get('historyPointer'),
				turn = { steps: steps };

			if (typeof direction == 'number') {
				turn.x = direction;
				turn.y = count;
			}
			else {
				turn.direction = direction;
				turn.count = count;
			}
			history[history_pointer ++] = turn;
			history.length = history_pointer;

			this.set('historyPointer', history_pointer);
		},

		undo: function () {
			var attrs = this.getAttrs(['historyPointer', 'history', 'player', 'gems']);

			if (attrs.historyPointer == 0) { return false; }

			var steps = attrs.history[-- attrs.historyPointer].steps,
				back_steps = this._backSteps(steps);

			this.set('historyPointer', attrs.historyPointer);

			this.save();
			this.fire('steps', { steps: back_steps });
		},

		_backSteps: function (steps) {
			var player = this.get('player'),
				back_steps = [],
				counters = this.getAttrs(['stepCount', 'pushCount']);

			for (var i = steps.length - 1; i >= 0; i --) {
				var step = steps[i],
					from = step.player.from || steps[i-1].player,
					back_step = { player: { x: from.x, y: from.y } };

				player.x = back_step.player.x;
				player.y = back_step.player.y;
				counters.stepCount --;

				if (step.gem != null) {
					back_step.gem = { x: step.player.x, y: step.player.y, no: step.gem.no };
					this._moveGem(back_step.gem.no, back_step.gem.x, back_step.gem.y);
					counters.pushCount --;
				}

				back_steps.push(back_step);
			}

			this.setAttrs(counters);

			return back_steps;
		},

		redo: function () {
			var history = this.get('history'),
				history_pointer = this.get('historyPointer'),
				player = this.get('player'),
				counters = this.getAttrs(['stepCount', 'pushCount']);

			if (history_pointer >= history.length) { return false; }

			var steps = history[history_pointer ++].steps;

			Y.Array.each(steps, Y.bind(function (step) {
				player.x = step.player.x;
				player.y = step.player.y;
				counters.stepCount ++;
				if (step.gem != null) {
					this._moveGem(step.gem.no, step.gem.x, step.gem.y);
					counters.pushCount ++;
				}
			}, this));

			this.set('historyPointer', history_pointer);
			this.setAttrs(counters);

			this.save();
			this.fire('steps', { steps: steps });
		},

		toJSON: function () {
			var attrs = this.getAttrs(['player', 'gems', 'history', 'historyPointer']),
				json = { historyPointer: attrs.historyPointer, history: [], checksum: this._checksum() };

			Y.Array.each(attrs.history, function (turn) {
				var save_turn = {};

				Y.Object.each(turn, function (v, k) {
					if (k != 'steps') {
						save_turn[k] = v;
					}
				});

				json.history.push(save_turn);
			});

			return json;
		},

		fromJSON: function (json) {
			var _this = this,
				steps, history;

			this._reset();

			try {
				Y.Array.each(json.history, function (turn) {
					if (turn.direction != null) {
						steps = [];
						for (var i = turn.count; i > 0 && _this._step(turn.direction, steps, true); i--);
						_this._pushHistory(turn.direction, turn.count, steps);
					}
					else {
						steps = _this._go(turn.x, turn.y);
						if (steps !== false) {
							_this._pushHistory(turn.x, turn.y, steps);
						}
					}
					_this._resetReachable();
				});

				history = this.get('history');

				if (json.historyPointer < history.length) {
					for (var i = history.length - 1; i >= 0 && i >= json.historyPointer; i--) {
						this._backSteps(history[i].steps);
					}
				}

				this.set('historyPointer', json.historyPointer);

				if (json.checksum != this._checksum()) {
					throw 'Checksum doesn\'t match';
				}
			}
			catch (e) {
				this._reset();
				this.save();
			}
		},

		sync: function (action, options, callback) {
			var data;

			switch (action) {
				case 'read':
					data = localStorage.getItem(this.get('id'));

					if (data) {
						this.fromJSON(Y.JSON.parse(data));
						callback(null, {});
					} else {
						callback('Model not found');
					}

					return;

				case 'update':
					data = this.toJSON();

					localStorage.setItem(this.get('id'), Y.JSON.stringify(data));

					callback(null, {});

					return;

				case 'delete':
					localStorage.removeItem(this.get('id'));

					callback();

					return;

				default:
					callback('Invalid action');
			}
		},

		_checksum: function () {
			var sum_array = [],
				attrs = this.getAttrs(['player', 'gems']);

			sum_array.push(attrs.player.x);
			sum_array.push(attrs.player.y);

			Y.Array.each(attrs.gems, function (gem) {
				sum_array.push(gem.x);
				sum_array.push(gem.y);
			});

			return sum_array.join(',');
		}

	}, {
		ATTRS: {
			map: { value: [] },
			gems: { value: [] },
			player: { value: { x: null, y: null } }
		}
	});

}, '0.1', {
	requires: ['model', 'array-extras', 'oop']
});
