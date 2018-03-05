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

"use strict";

const windows = new Map();

function getWindow(tab) {
	return windows.get(tab.windowId) || setWindow(tab).get(tab.windowId);
}

function setWindow(tab) {
	return windows.set(tab.windowId, new brother.Window(tab));
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

brother.Tab.onActivated(makeAnchor);

brother.Tab.onMoved(movedTab => {
	if (movedTab.active) {
		makeAnchor(movedTab);
	}
});

brother.Tab.onRemoved((closedTab, removeInfo) => {
	if (removeInfo.isWindowClosing) {
		deleteWindow(removeInfo);
		return;
	}
	const currentWindow = getWindow(removeInfo);
	currentWindow.removeAnchor(closedTab);
	currentWindow.hasRemoved = true;
});

brother.Tab.onUpdated((updatedId, changeInfo, updatedTab) => {
	if ("pinned" in changeInfo) {
		if (updatedTab.active) {
			makeAnchor(updatedTab);
		} else {
			getWindow(updatedTab).removeAnchor(updatedTab);
		}
	}
});

brother.Tab.onDetached(makeKnown);

brother.Tab.onAttached(makeKnown);

brother.Tab.onCreated(async newTab => {
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
	if (!anchors.length) {
		return;
	}
	const activeTab = await brother.Tab.get(anchors[0]);
	let newIndex = activeTab.index + anchors.length;
	if (activeTab.pinned) {
		if (options.pinFromPinned) {
			await newTab.pin();
			if (!newTab.active) {
				currentWindow.addAnchor(newTab);
			}
		} else {
			const pinnedTabs = await currentWindow.pinnedTabs;
			newIndex = pinnedTabs.length + anchors.length - 1;
		}
	}
	if (newTab.index < activeTab.index) {
		newIndex--;
	}
	if (newIndex != newTab.index) {
		newTab.move(newIndex);
	}
});

brother.Tab.getAll().then(tabs => {
	tabs.forEach(tab => {
		makeKnown(tab);
		if (tab.active) {
			makeAnchor(tab);
		}
	});
});

brother.Storage.onChanged((key, newValue) => {
	options[key] = newValue;
});

brother.Storage.get(options).then(results => {
	options = results;
});
