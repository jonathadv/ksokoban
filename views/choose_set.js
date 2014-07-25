YUI.add('ksokoban-view-choose-set', function (Y) {
	'use strict';

	Y.namespace('KSokoban').ChooseSetView = Y.Base.create('chooseSetView', Y.View, [], {
		render: function () {
			var level_sets = this.get('level_sets'),
				set_links = [];

			Y.Array.each(level_sets, function(level_set) {
				set_links.push('<li class="set"><a href="#/' + level_set.name + '">' + level_set.name + '</a></li>');
			});

			this.get('container').setHTML('<h2>KSokoban</h2><ul class="level-sets">' + set_links.join('') + '</ul>');

			return this;
		}
	});
}, '0.1', {
	requires: ['view']
});
