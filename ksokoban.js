YUI({
	debug: true,
	filter: 'raw'
}).use(
	'datatype-number-parse',
	'app',
	'ksokoban-model-game-data',
	'ksokoban-view-choose-set',
	'ksokoban-view-choose-level',
	'ksokoban-model-cave',
	'ksokoban-view-cave',

	function (Y) {
		'use strict';

		var KSokoban = Y.Base.create('kSokobanApp', Y.App, [], {
			views: {
				choose_set   : { preserve: true, type: Y.KSokoban.ChooseSetView },
				choose_level : { parent: 'choose_set', type: Y.KSokoban.ChooseLevelView },
				play_game    : { parent: 'choose_level', type: Y.KSokoban.CaveView }
			},

			// Default route handlers inherited by all CustomApp instances.

			handleHome: function (req) {
				this.showView('choose_set', { level_sets: Y.KSokoban.GameData.get('sets') });
			},

			handleChooseLevel: function (req) {
				var game_data = Y.KSokoban.GameData,
					level_set = game_data.getSetByName(req.params.set_name);
				if (level_set != null) {
					this.showView('choose_level', { level_set: level_set });
				}
				else {
					this.save('/');
				}
			},

			handlePlayGame: function (req) {
				var game_data = Y.KSokoban.GameData,
					level_set = game_data.getSetByName(req.params.set_name);

				if (level_set != null) {
					var level = level_set.levels[Y.Number.parse(req.params.level_no) - 1];
					if (level != null) {
						var cave_model = new Y.KSokoban.CaveModel({ setName: req.params.set_name, levelNo: req.params.level_no, levelData: level });
						this.showView('play_game', {
							model: cave_model
						});
						return;
					}
				}

				this.save('/');
			}

		}, {
			ATTRS: {
				routes: {
					value: [
						{path: '/',                    callbacks: 'handleHome'},
						{path: '/:set_name',           callbacks: 'handleChooseLevel'},
						{path: '/:set_name/:level_no', callbacks: 'handlePlayGame'}
					]
				},
				serverRouting: { value: false }
			}
		});

		var app = new KSokoban();

		app.render().dispatch();
	}
);
