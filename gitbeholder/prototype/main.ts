export function DrawGraph(history: Git.History): Drawing.Row[] {
	let { commits } = history;

	if (commits.length === 0) {
		return [];
	}

	if (commits.length === 1) {
		return [new Drawing.Row(commits[0], [], [], [])];
	}

	let ongoing = new Set<Drawing.Branch>();
	let drawing = new Array<Drawing.Row>(commits.length);

	ongoing.add(new Drawing.Branch([commits[0]]));

	for (let i = 1; i < commits.length; i += 1) {
		let thisCommit = commits[i];
		let children = Array.from(ongoing).filter(({ commits }) =>
			commits[commits.length - 1].parents.includes(thisCommit.hash),
		);

		let numberOfChildren = children.length;
		let numberOfParents = thisCommit.parents.length;

		if (numberOfChildren === 0) {
			if (numberOfParents === 0) {
				/* 
	│  
	│ @ <- dangling commit
  │  
	@					
				*/
				// TODO: create snapshot with single commit branch but
				// don't add that branch to ongoing
			} //
			else if (numberOfParents === 1) {
				/* 
	@ <- first commit in a branch
	│   
	│ 
				*/
				// TODO: add new branch to ongoing and push snapshow with them
			} //
			else {
				/* merge of one or more branches as latest commit in them
	@─╮ <- this or @─╮─╮ <- this and etc.
	│ │            │ │ │                 
	│ @            │ @ │                 
  │ │            │ │ │                 
  │ │            │ │ @ 
				*/
				// TODO: add two or more branches to ongoing and push snapshot with them
			}
		} //
		else if (numberOfChildren === 1) {
			if (numberOfParents === 0) {
				/* finalization of branch without creating new ones, first commit in history or in dangling branch
	│           
	@           
	│           
	@ <- this 
				*/
				// TODO: ?
			} //
			else if (numberOfParents === 1) {
				/* continuation of a branch
	│        
	@ <- this
	│         
				*/
				// TODO: ?
			} //
			else {
				/* merge of one or more branches
	│              │                     
	@─╮ <- this or @─╮─╮ <- this and etc.
	│ │            │ │ │                 
	│ @            │ @ │                 
	│ │            │ │ │                 
	│ │            │ │ @                 
				*/
				// TODO: ?
			}
		} // more than 1 child
		else {
			if (numberOfParents === 0) {
				/*
  @                @  
  │                │  
  │              @ │  
  │              │ │  
  │ @            │ │ @
  │ │            │ │ │
  @─╯ <- this or ╰─@─╯ <- this and etc. 
				*/
				// TODO: ?
			} //
			else if (numberOfParents === 1) {
				/* same as previous but with a parent
  │ │            │ │ │
  @─╯ <- this or ╰─@─╯ <- this and etc. 
  │                │  
  @                @  
      	*/
				// TODO: ?
			} //
			else {
				/* 
    │ │             │ │ │   // TODO: find better way to draw this
  ╭─@─╯ <- this or ╭╰─@─╯╮╮ <- this and etc. 
  │ │              ╰╮ │ ╭╯│
  @ │               │ │ @ │
  │ │               │ │ │ │
  │ @               │ │ │ @
      	*/
				// TODO: ?
			}
		}

		continue;
	}

	return [];
}

export namespace Drawing {
	export class Row {
		constructor(
			public commit: Git.Commit,
			public ongoing: ReadonlyArray<Branch>,
			public merged: ReadonlyArray<Branch>,
			public started: ReadonlyArray<Branch>,
		) {}
	}

	export class Branch {
		column = 0;
		// cells = new Array<AnyCell>();
		constructor(public commits: Array<Git.Commit>) {}
	}

	export enum Gliph {
		Node = "@",
		EdgeV = "│",
		EdgeH = "─",
		TurnNE = "╰",
		TurnSE = "╭",
		TurnSW = "╮",
		TurnNW = "╯",
	}
}

export namespace Git {
	export type Hash = string;

	export class Commit {
		constructor(
			public index: number,
			public hash: Hash,
			public parents: Hash[],
		) {}
	}

	export class History {
		constructor(public commits: Commit[]) {}
	}
}

function absurd(clarification: string = ""): never {
	throw new Error(
		"This branch of code is supposed to be impossible." + clarification,
	);
}

function assert(condition: boolean, or: string = "Absurd"): asserts condition {
	if (!condition) {
		throw new Error(or);
	}
}
