YUI.add('ksokoban-view-choose-level', function (Y) {
	'use strict';

	Y.namespace('KSokoban').ChooseLevelView = Y.Base.create('chooseLevelView', Y.View, [], {
		render: function () {
			var level_set = this.get('level_set'),
				level_links = [];

			Y.Array.each(level_set.levels, function(level, index) {
				level_links.push('<li class="level"><a href="#/' + level_set.name + '/' + (index + 1) + '">' + (index + 1) + '</a></li>');
			});

			this.get('container').setHTML('<h2>' + level_set.name + '</h2><ul class="levels">' + level_links.join('') + '</ul>');

			return this;
		}
	});

}, '0.1', {
	requires: ['view']
});
