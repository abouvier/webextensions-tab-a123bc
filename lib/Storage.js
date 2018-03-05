// Copyright (C) 2018  Alexandre Bouvier
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

var brother = brother || {};

brother.Storage = class {
	static get(keys) {
		return browser.storage.sync.get(keys);
	}

	static set(key, value) {
		return browser.storage.sync.set({
			[key]: value
		});
	}

	static onChanged(callback) {
		browser.storage.onChanged.addListener(changes => {
			Object.keys(changes).forEach(key => {
				callback(key, changes[key].newValue);
			});
		});
	}
};
