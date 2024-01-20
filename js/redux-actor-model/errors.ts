import type { Token, } from ".";

export class CircularDependencyError extends Error {
	constructor(token: Token<{}>) {
		super(`Detected circular denepndency in resolution chain for ${Symbol.keyFor(token)}`);
	}
}
export class UnboundTokenError extends Error {
	constructor(token: Token<{}>) {
		super(`No resolver registered for ${Symbol.keyFor(token)}`);
	}
}
