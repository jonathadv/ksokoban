YUI.add('ksokoban-view-choose-level', function (Y) {
	'use strict';

	Y.namespace('KSokoban').ChooseLevelView = Y.Base.create('chooseLevelView', Y.View, [], {
		render: function () {
			var level_set = this.get('level_set'),
				container = this.get('container'),
				level_links = [];

			Y.Array.each(level_set.levels, function(level, index) {
				level_links.push('<li class="level"><a href="#/' + level_set.name + '/' + (index + 1) + '">' + (index + 1) + '</a></li>');
			});

			container.addClass('choose-level');
			container.setHTML('<h2 class="level-title">' + level_set.name + '</h2><ul class="levels">' + level_links.join('') + '</ul>');

			var header = container.one('h2');
			header.appendChild('<a class="up left" href="#/" title="Choose level set" />');
			header.appendChild('<a class="up right" href="#/" title="Choose level set" />');

			return this;
		}
	});

}, '0.1', {
	requires: ['view']
});
