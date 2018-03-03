// Copyright 2018 Alexandre Bouvier
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* exported Tab */

class Tab {
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
}
