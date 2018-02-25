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

"use strict";

var windowAnchors = new Map();
var messyWindows = new Set();

function getAnchors(tab) {
	return windowAnchors.get(tab.windowId) ||
		setAnchors(tab, []).get(tab.windowId);
}

function setAnchors(tab, anchors) {
	return windowAnchors.set(tab.windowId, anchors);
}

function removeWindow(tab) {
	windowAnchors.delete(tab.windowId);
	messyWindows.delete(tab.windowId);
}

function makeAnchor(tab) {
	setAnchors(tab, [tab.tabId || tab.id]);
}

function addAnchor(tab) {
	getAnchors(tab).push(tab.id);
}

function removeAnchor(tab) {
	setAnchors(tab, getAnchors(tab).filter(anchorId => anchorId != tab.id));
}

function makeKnown(tab) {
	return browser.sessions.setTabValue(tab.id || tab, "known", true);
}

function isKnown(tab) {
	return browser.sessions.getTabValue(tab.id, "known");
}

function hasRemoved(tab) {
	return messyWindows.has(tab.windowId);
}

function setMessy(tab) {
	return messyWindows.add(tab.windowId);
}

function moveTab(tab, index) {
	return browser.tabs.move(tab.id, {
		index: index
	});
}

function getPinnedTabs(tab) {
	return browser.tabs.query({
		windowId: tab.windowId,
		pinned: true
	});
}

function getAllTabs() {
	return browser.tabs.query({});
}

function getTab(id) {
	return browser.tabs.get(id);
}

browser.tabs.onActivated.addListener(makeAnchor);

browser.tabs.onMoved.addListener(async movedId => {
	let movedTab = await getTab(movedId);
	if (movedTab.active) {
		makeAnchor(movedTab);
	}
});

browser.tabs.onRemoved.addListener((closedId, removeInfo) => {
	if (removeInfo.isWindowClosing) {
		removeWindow(removeInfo);
		return;
	}
	if (!hasRemoved(removeInfo)) {
		setMessy(removeInfo);
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

browser.tabs.onDetached.addListener(makeKnown);

browser.tabs.onAttached.addListener(makeKnown);

browser.tabs.onCreated.addListener(async newTab => {
	const anchors = getAnchors(newTab).slice();
	addAnchor(newTab);

	if (await isKnown(newTab)) {
		if (!hasRemoved(newTab) && !newTab.active) {
			removeAnchor(newTab);
		}
		return;
	}
	makeKnown(newTab);

	for (const anchorId of anchors) {
		var anchorTab = await getTab(anchorId);
		if (anchorTab) {
			break;
		}
	}

	if (!anchorTab) {
		return;
	}

	let newIndex = anchors.length;
	if (anchorTab.pinned) {
		const pinnedTabs = await getPinnedTabs(anchorTab);
		if (pinnedTabs.length) {
			newIndex += pinnedTabs.length - 1;
		}
	} else {
		newIndex += anchorTab.index;
	}
	if (newIndex != newTab.index) {
		moveTab(newTab, newIndex);
	}
});

getAllTabs().then(tabs => {
	tabs.forEach(tab => {
		makeKnown(tab);
		if (tab.active) {
			makeAnchor(tab);
		}
	});
});
