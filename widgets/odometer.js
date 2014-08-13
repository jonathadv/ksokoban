YUI.add('ksokoban-odometer-widget', function (Y) {
	'use strict';

	Y.namespace('KSokoban').OdometerWidget = Y.Base.create('odometerWidget', Y.Widget, [], {

		MEASUREMENT_TEMPLATE: '<div class="{measurementClassName}">{titleText}: <span class="{valueClassName}"></span></div>',

		renderUI: function () {
			var set_name = this.get('setName'),
				level_no = this.get('levelNo'),
				content_box = this.get('contentBox'),
				steps_html = '<div class="measurement step">Steps: <span class="value"></span></div>',
				pushes_html = '<div class="measurement push">Pushes: <span class="value"></span></div>',
				header_node = Y.Node.create('<h2 class="level-title">' + set_name + ' #' + level_no + '</h2>'),
				measurements_node = Y.Node.create('<div class="measurements"></div>'),
				navigation_node = Y.Node.create('<nav>');

			header_node.appendChild('<a class="up left" href="#/' + set_name + '" />');
			header_node.appendChild('<a class="up right" href="#/' + set_name + '" />');
			content_box.appendChild(header_node);

			measurements_node.appendChild(steps_html);
			measurements_node.appendChild(pushes_html);
			content_box.appendChild(measurements_node);

			if (level_no > 1) {
				navigation_node.appendChild('<a class="level prev" href="#/' + set_name + '/' + (level_no - 1) + '">&lt;</a>');
			}
			else {
				navigation_node.appendChild('<span class="level prev">&lt;</span>');
			}
			if (level_no < this.get('levelCountInSet')) {
				navigation_node.appendChild('<a class="level next" href="#/' + set_name + '/' + (level_no + 1) + '">&gt;</a>');
			}
			else {
				navigation_node.appendChild('<span class="level next">&gt;</span>');
			}
			content_box.appendChild(navigation_node);
		},

		syncUI: function () {
			var content_box = this.get('contentBox');
			content_box.one('.measurement.step .value').setHTML(this.get('stepCount'));
			content_box.one('.measurement.push .value').setHTML(this.get('pushCount'));
		}


	}, {
		NAME: 'odometer',

		ATTRS: {
			setName:         { value: undefined },
			levelNo:         { value: undefined },
			stepCount:       { value: 0 },
			pushCount:       { value: 0 },
			levelCountInSet: { value: 0 }
		}
	});

}, '0.1', {
	requires: ['widget', 'ksokoban-model-cave']
});
