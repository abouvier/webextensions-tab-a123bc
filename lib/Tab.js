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

brother.Tab = class {
	constructor(obj) {
		if (obj.tabId) {
			this.id = obj.tabId;
			this.windowId = obj.windowId;
		} else if (Number.isInteger(obj)) {
			this.id = obj;
		} else {
			Object.assign(this, obj);
		}
	}

	static async get(id) {
		return new this(await browser.tabs.get(id));
	}

	static async getAll() {
		return (await browser.tabs.query({})).map(tab => {
			return new this(tab);
		});
	}

	static onActivated(callback) {
		browser.tabs.onActivated.addListener(activeInfo => {
			callback(new this(activeInfo));
		});
	}

	static onMoved(callback) {
		browser.tabs.onMoved.addListener(async (tabId, moveInfo) => {
			callback(await this.get(tabId), moveInfo);
		});
	}

	static onRemoved(callback) {
		browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
			callback(new this(tabId), removeInfo);
		});
	}

	static onUpdated(callback) {
		browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			callback(tabId, changeInfo, new this(tab));
		});
	}

	static onDetached(callback) {
		browser.tabs.onDetached.addListener((tabId, detachInfo) => {
			callback(new this(tabId), detachInfo);
		});
	}

	static onAttached(callback) {
		browser.tabs.onAttached.addListener((tabId, attachInfo) => {
			callback(new this(tabId), attachInfo);
		});
	}

	static onCreated(callback) {
		browser.tabs.onCreated.addListener(tab => {
			callback(new this(tab));
		});
	}

	get known() {
		return browser.sessions.getTabValue(this.id, "known");
	}

	set known(state) {
		browser.sessions.setTabValue(this.id, "known", state);
	}

	move(index) {
		return browser.tabs.move(this.id, {
			index: index
		});
	}
};
