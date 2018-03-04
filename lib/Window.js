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

var brother = brother || {};

brother.Window = class {
	constructor(obj) {
		if (obj.windowId) {
			this.id = obj.windowId;
		} else if (Number.isInteger(obj)) {
			this.id = obj;
		} else {
			Object.assign(this, obj);
		}
		this.hasRemoved = false;
		this.anchors = [];
	}

	get pinnedTabs() {
		return browser.tabs.query({
			windowId: this.id,
			pinned: true
		}).then(tabs => {
			return tabs.map(tab => {
				return new brother.Tab(tab);
			});
		});
	}

	makeAnchor(tab) {
		this.anchors = [tab.id];
	}

	addAnchor(tab) {
		this.anchors.push(tab.id);
	}

	removeAnchor(tab) {
		this.anchors = this.anchors.filter(anchorId => anchorId != tab.id);
	}
};
