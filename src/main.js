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

const windows = new Map();

function getWindow(tab) {
	return windows.get(tab.windowId) || setWindow(tab).get(tab.windowId);
}

function setWindow(tab) {
	return windows.set(tab.windowId, new Window(tab));
}

function deleteWindow(tab) {
	windows.delete(tab.windowId);
}

function makeAnchor(tab) {
	getWindow(tab).makeAnchor(tab);
}

function makeKnown(tab) {
	tab.known = true;
}

Tab.onActivated(makeAnchor);

Tab.onMoved(movedTab => {
	if (movedTab.active) {
		makeAnchor(movedTab);
	}
});

Tab.onRemoved((closedTab, removeInfo) => {
	if (removeInfo.isWindowClosing) {
		deleteWindow(removeInfo);
		return;
	}
	const currentWindow = getWindow(removeInfo);
	currentWindow.removeAnchor(closedTab);
	currentWindow.hasRemoved = true;
});

Tab.onUpdated((updatedId, changeInfo, updatedTab) => {
	if (changeInfo.pinned) {
		if (updatedTab.active) {
			makeAnchor(updatedTab);
		} else {
			getWindow(updatedTab).removeAnchor(updatedTab);
		}
	}
});

Tab.onDetached(makeKnown);

Tab.onAttached(makeKnown);

Tab.onCreated(async newTab => {
	const currentWindow = getWindow(newTab);
	const anchors = currentWindow.anchors.slice();
	currentWindow.addAnchor(newTab);

	if (await newTab.known) {
		if (!currentWindow.hasRemoved && !newTab.active) {
			currentWindow.removeAnchor(newTab);
		}
		return;
	}
	makeKnown(newTab);

	for (const anchorId of anchors) {
		var anchorTab = await Tab.get(anchorId);
		if (anchorTab) {
			break;
		}
	}

	if (!anchorTab) {
		return;
	}

	let newIndex = anchors.length;
	if (anchorTab.pinned) {
		const pinnedTabs = await currentWindow.pinnedTabs;
		if (pinnedTabs.length) {
			newIndex += pinnedTabs.length - 1;
		}
	} else {
		newIndex += anchorTab.index;
		if (newTab.index < anchorTab.index) {
			newIndex--;
		}
	}
	if (newIndex != newTab.index) {
		newTab.move(newIndex);
	}
});

Tab.getAll().then(tabs => {
	tabs.forEach(tab => {
		makeKnown(tab);
		if (tab.active) {
			makeAnchor(tab);
		}
	});
});
