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
							gems.push({ cell: cell, x: x, y: y });
							break;
						case '.':
							cell.goal = cell.floor = true;
							break;
						case '*':
							cell.goal = cell.floor = cell.gem = true;
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
