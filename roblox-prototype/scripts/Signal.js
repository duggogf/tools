// Signal.js
// RBXScriptSignal: Connect returns a connection with Disconnect.

export class Signal {
	constructor() {
		this._handlers = new Set();
	}

	Connect(fn) {
		this._handlers.add(fn);
		return { Disconnect: () => this._handlers.delete(fn) };
	}

	Fire(...args) {
		for (const fn of [...this._handlers]) fn(...args);
	}

	DisconnectAll() {
		this._handlers.clear();
	}
}
