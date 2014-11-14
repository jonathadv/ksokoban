YUI.add('ksokoban-info-widget', function (Y) {
	'use strict';

	Y.namespace('KSokoban').InfoWidget = Y.Base.create('infoWidget', Y.Widget, [], {

		CONTENT_TEMPLATE:
			'<div class="cover cover-hidden"></div>' +
			'<div class="buttons">' +
				'<a class="button help" href="#">Help</a>' +
				'<a class="button credits" href="#">Credits</a>' +
			'</div>' +
			'<div class="side-panel help-panel side-panel-hidden">' +
				'<h2>Controls</h2>' +
				'<dl>' +
					'<dt>Cursor keys</dt>' +
					'<dd>move</dd>' +
					'<dt>Cursor keys with CTRL key pressed</dt>' +
					'<dd>move as far as possible in a direction without pushing any gems</dd>' +
					'<dt>Cursor keys with SHIFT key pressed</dt>' +
					'<dd>move as far as possible in a direction, possibly pushing a gem if it is in the way</dd>' +
					'<dt>Left mouse button</dt>' +
					'<dd>move to any place you can reach without pushing any gems</dd>' +
					'<dt>Right mouse button</dt>' +
					'<dd>move in a straight line, possibly pushing a gem if it is in the way</dd>' +
					'<dt>Middle mouse button</dt>' +
					'<dd>undo the last move</dd>' +
					'<dt>Middle mouse button with CTRL key pressed</dt>' +
					'<dd>redo move</dd>' +
					'<dt>Middle mouse button with ALT+SHIFT+CTRL keys pressed</dt>' +
					'<dd>restart current level</dd>' +
				'</dl>' +
			'</div>' +
			'<div class="side-panel credits-panel side-panel-hidden">' +
				'<h2>Credits</h2>' +
				'<p>KSokoban original game was written by:<br/>Anders Widell <a href="mailto:awl@hem.passagen.se">awl@hem.passagen.se</a></p>' +
				'<p>Porting to KDE4/Qt4 was made by:<br/>Łukasz Kalamłacki <a href="mailto:kalamlacki@gmail.com">kalamlacki@gmail.com</a></p>' +
				'<p>Porting to JavaScript/YUI3 was made by:<br/>Sergey Galanin <a href="mailto:s.galanin@gmail.com">s.galanin@gmail.com</a></p>' +
			'</div>',

		bindUI: function () {
			var bounding_box = this.get('boundingBox'),
				help_button = bounding_box.one('.buttons .button.help'),
				credits_button = bounding_box.one('.buttons .button.credits'),
				cover = bounding_box.one('.cover');

			help_button.on('click', function (e) {
				e.preventDefault();
				this.get('boundingBox').one('.help-panel').removeClass('side-panel-hidden');
				this.get('boundingBox').one('.cover').removeClass('cover-hidden');
			}, this);

			credits_button.on('click', function (e) {
				e.preventDefault();
				this.get('boundingBox').one('.credits-panel').removeClass('side-panel-hidden');
				this.get('boundingBox').one('.cover').removeClass('cover-hidden');
			}, this);

			cover.on('click', function (e) {
				e.preventDefault();
				this.get('boundingBox').all('.side-panel').addClass('side-panel-hidden');
				this.get('boundingBox').one('.cover').addClass('cover-hidden');
			}, this);
		},

		renderUII: function () {
			var set_name = this.get('setName'),
				level_no = this.get('levelNo'),
				content_box = this.get('contentBox'),
				steps_html = '<div class="measurement step">Steps: <span class="value"></span></div>',
				pushes_html = '<div class="measurement push">Pushes: <span class="value"></span></div>',
				header_node = Y.Node.create('<h2 class="level-title">' + set_name + ' #' + level_no + '</h2>'),
				measurements_node = Y.Node.create('<div class="measurements"></div>'),
				navigation_node = Y.Node.create('<nav>');

			header_node.appendChild('<a class="up left" href="#/' + set_name + '" title="Choose level" />');
			header_node.appendChild('<a class="up right" href="#/' + set_name + '" title="Choose level" />');
			content_box.appendChild(header_node);

			measurements_node.appendChild(steps_html);
			measurements_node.appendChild(pushes_html);
			content_box.appendChild(measurements_node);

			if (level_no > 1) {
				navigation_node.appendChild('<a class="btn left" href="#/' + set_name + '/' + (level_no - 1) + '" title="Previous level"></a>');
			}
			else {
				navigation_node.appendChild('<span class="btn left"></span>');
			}
			if (level_no < this.get('levelCountInSet')) {
				navigation_node.appendChild('<a class="btn right" href="#/' + set_name + '/' + (level_no + 1) + '" title="Next level"></a>');
			}
			else {
				navigation_node.appendChild('<span class="btn right"></span>');
			}
			content_box.appendChild(navigation_node);
		},

		syncUII: function () {
			var content_box = this.get('contentBox');
			content_box.one('.measurement.step .value').setHTML(this.get('stepCount'));
			content_box.one('.measurement.push .value').setHTML(this.get('pushCount'));
		}


	}, {
		NAME: 'info',

		ATTRS: {}
	});

}, '0.1', {
	requires: ['widget', 'ksokoban-model-cave']
});
