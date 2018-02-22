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

var windowAnchors = new Map();
var hasRemoved = false;

function getAnchors(tab) {
	return windowAnchors.get(tab.windowId) ||
		setAnchors(tab, []).get(tab.windowId);
}

function setAnchors(tab, anchors) {
	return windowAnchors.set(tab.windowId, anchors);
}

function deleteAnchors(tab) {
	windowAnchors.delete(tab.windowId);
}

function makeAnchor(tab) {
	setAnchors(tab, [tab.tabId || tab.id]);
}

function addAnchor(tab) {
	getAnchors(tab).unshift(tab.id);
}

function removeAnchor(tab) {
	setAnchors(tab, getAnchors(tab).filter(anchorId => anchorId != tab.id));
}

function makeKnown(tab) {
	return browser.sessions.setTabValue(tab.id, "known", true);
}

function isKnown(tab) {
	return browser.sessions.getTabValue(tab.id, "known");
}

browser.tabs.onActivated.addListener(makeAnchor);

browser.tabs.onRemoved.addListener((closedId, removeInfo) => {
	if (!hasRemoved) {
		hasRemoved = true;
	}
	if (removeInfo.isWindowClosing) {
		deleteAnchors(removeInfo);
		return;
	}
	removeAnchor({
		windowId: removeInfo.windowId,
		id: closedId
	});
});

browser.tabs.onUpdated.addListener((updatedId, changeInfo, updatedTab) => {
	if (changeInfo.pinned) {
		if (updatedTab.active) {
			makeAnchor(updatedTab);
		} else {
			removeAnchor(updatedTab);
		}
	}
});

browser.tabs.onCreated.addListener(async newTab => {
	let anchors = getAnchors(newTab).slice();
	addAnchor(newTab);

	if (await isKnown(newTab)) {
		if (!hasRemoved) {
			removeAnchor(newTab);
		}
		return;
	}
	makeKnown(newTab);

	for (const anchorId of anchors) {
		var anchorTab = await browser.tabs.get(anchorId);
		if (anchorTab) {
			break;
		}
	}

	if (!anchorTab) {
		return;
	}

	let newIndex = anchorTab.index;
	if (anchorTab.pinned) {
		let pinnedTabs = await browser.tabs.query({
			windowId: anchorTab.windowId,
			pinned: true
		});
		if (pinnedTabs.length) {
			newIndex = pinnedTabs.length;
		}
	} else if (newTab.index > anchorTab.index) {
		newIndex++;
	}
	if (newIndex != newTab.index) {
		browser.tabs.move(newTab.id, {
			index: newIndex
		});
	}
});

browser.tabs.query({}).then(tabs => {
	tabs.forEach(tab => {
		makeKnown(tab);
		if (tab.active) {
			makeAnchor(tab);
		}
	});
});
