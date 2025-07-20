export function DrawGraph(history: Git.History): string[] {
	BuildGraph(history);

	todo();
}

export function BuildGraph(history: Git.History): Row[] {
	let { commits } = history;

	if (commits.length === 0) {
		return [];
	}

	// if (commits.length === 1) {
	// 	return [new Row(commits[0], [])];
	// }

	let ongoing = new Set<Branch>();
	let drawing = new Array<Row>(commits.length);

	let previousRow = (drawing[0] = Row.fromFirstCommit(commits[0]));

	for (let i = 1; i < commits.length; i += 1) {
		let thisCommit = commits[i];
		let children = Array.from(ongoing).filter((branch) =>
			branch.lastCommit.parents.includes(thisCommit.hash),
		);

		let numberOfChildren = children.length;
		let numberOfParents = thisCommit.parents.length;

		if (numberOfChildren === 0) {
			if (numberOfParents === 0) {
				let thisSlice = BranchSlice.currentFrom(Branch.start(thisCommit));
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
    │ │            ╭╯ │ │   // TODO: find better way to draw this
  ╭─@─╯ <- this or ╰╭─@─╯╮╮ <- this and etc. 
  │ │               │ │ ╭╯│
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

interface Joint {
	beginning: Branch[];
	finishing: Branch[];
}

// before sleep idea: a row is a slice of a graph, it holds "branches" instances
// were a branch is a stretch of commits between joint commits, it also holds
// indecies of commits within these branches that are part of the slice
export class Row {
	static fromFirstCommit(commit: Git.Commit) {
		return new Row([BranchSlice.currentFrom(new Branch([commit]))]);
	}

	constructor(
		public readonly snapshot: ReadonlyArray<BranchSlice>,
		//
	) {}
}

export class BranchSlice {
	static ongoingFrom(branch: Branch) {
		return new BranchSlice(branch, branch.commits.length - 1, false);
	}
	static currentFrom(branch: Branch) {
		return new BranchSlice(branch, branch.commits.length - 1, true);
	}

	constructor(
		public branch: Branch,
		public commitIndex: number,
		public isCurrent: boolean,
	) {}
}

export class Branch {
	static start(commit: Git.Commit) {
		return new Branch([commit]);
	}

	column = 0;

	constructor(public commits: Array<Git.Commit>) {}

	get length() {
		return this.commits.length;
	}
	get firstCommit() {
		return this.commits[0];
	}
	get lastCommit() {
		return this.commits[this.commits.length - 1];
	}
}

export enum Char {
	Gap = " ",
	Node = "@",
	EdgeV = "│",
	EdgeH = "─",
	TurnNE = "╰",
	TurnSE = "╭",
	TurnSW = "╮",
	TurnNW = "╯",
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

function todo(): never {
	throw new Error("Implement this");
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
