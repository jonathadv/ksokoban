YUI.add('ksokoban-odometer-widget', function (Y) {
	'use strict';

	Y.namespace('KSokoban').OdometerWidget = Y.Base.create('odometerWidget', Y.Widget, [], {

		MEASUREMENT_TEMPLATE: '<div class="{measurementClassName}">{titleText}: <span class="{valueClassName}"></span></div>',

		renderUI: function () {
			var content_box = this.get('contentBox'),
				header_html = Y.Lang.sub('<div class="{headerClassName}">{setName} #{levelNo}</div>', {
					headerClassName: this.getClassName('header'),
					setName: this.get('setName'),
					levelNo: this.get('levelNo')
				}),

				measurement_class_name = this.getClassName('measurement'),
				value_class_name = this.getClassName('value'),
				steps_html = Y.Lang.sub(this.MEASUREMENT_TEMPLATE, {
					measurementClassName: measurement_class_name + ' ' + this.getClassName('step-count'),
					valueClassName: value_class_name,
					titleText: 'Steps'
				}),
				steps_node = Y.Node.create(steps_html),
				pushes_html = Y.Lang.sub(this.MEASUREMENT_TEMPLATE, {
					measurementClassName: measurement_class_name + ' ' + this.getClassName('push-count'),
					valueClassName: value_class_name,
					titleText: 'Pushes'
				}),
				pushes_node = Y.Node.create(pushes_html);

			content_box.appendChild(Y.Node.create(header_html));
			content_box.appendChild(steps_node);
			content_box.appendChild(pushes_node);

			this.set('stepsValueNode', steps_node.one('.' + value_class_name));
			this.set('pushesValueNode', pushes_node.one('.' + value_class_name));
		},

		syncUI: function () {
			this.get('stepsValueNode').setHTML(this.get('stepCount'));
			this.get('pushesValueNode').setHTML(this.get('pushCount'));
		}


	}, {
		NAME: 'odometer',

		ATTRS: {
			setName:   { value: undefined },
			levelNo:   { value: undefined },
			stepCount: { value: 0 },
			pushCount: { value: 0 }
		}
	});

}, '0.1', {
	requires: ['widget', 'ksokoban-model-cave']
});
