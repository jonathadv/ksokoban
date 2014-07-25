YUI.add('ksokoban-view-wall', function (Y) {
	'use strict';

	Y.namespace('KSokoban').WallView = Y.Base.create('wallView', Y.View, [], {
		render: function () {
			var stones = [], length = this.get('length');

			stones.push(this._createStone(0, 0, 'half'));
			stones.push(this._createStone(length - 0.5, 0, 'half'));

			for (var i = 0; i < length - 1; i ++) stones.push(this._createStone(i + 0.5, 0));
			for (var i = 0; i < length; i ++) stones.push(this._createStone(i, .5));

			this.set('stones', stones);

			this.get('container').addClass('item wall');

			return this;
		},

		_createStone: function (x, y, kind) {
			var max = kind === 'half' ? 4 : 6,
				cls = (kind || '') + 'stone' + Math.floor((Math.random() * max) + 1),
				node = new Y.Node.create('<div class="stone ' + cls + '"></div>');
			this.get('container').appendChild(node);
			return { x: x, y: y, kind: kind, node: node };
		}

	}, {
		ATTRS: {
			x: { value: null },
			y: { value: null },
			length: { value: 1 },
			stones: { value: [] },

			cellSize: {
				setter: function (cell_size) {
					this.get('container').setStyles({
						left:   this.get('x') * cell_size,
						top:    this.get('y') * cell_size,
						width:  this.get('length') * cell_size,
						height: cell_size
					});
					Y.Array.each(this.get('stones'), function (stone) {
						stone.node.setStyles({
							left:   stone.x * cell_size,
							top:    stone.y * cell_size,
							width:  stone.kind === 'half' ? cell_size / 2 : cell_size,
							height: cell_size / 2
						});
					});
				}
			}
		}
	});

}, '0.1', {
	requires: ['view', 'node']
});
