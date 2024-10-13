export function DrawGraph(history: Git.History): Drawing.Row[] {
	let { commits } = history;

	if (commits.length === 0) {
		return [];
	}

	if (commits.length === 1) {
		const branch = new Drawing.Branch(commits[0], null);
		const cell = new Drawing.Cell.CommitNode(branch);
		return [{ cells: [cell] }];
	}

	let ongoing = new Set<Drawing.Branch>();
	let drawing = new Array<Drawing.Row>(commits.length);

	ongoing.add(new Drawing.Branch(commits[0], null));

	for (let i = 1; i < commits.length - 1; i += 1) {
		const commit = commits[i];
		classifyCommit(commit, ongoing);
	}

	return [];
}

function classifyCommit(
	thisCommit: Git.Commit,
	ongoingBranches: ReadonlySet<Drawing.Branch>,
) {
	const children = getChildrenOf(thisCommit);
	const numberOfChildren = children.length;
	const numberOfParents = thisCommit.parents.length;
	if (numberOfChildren > -1) absurd("length should not be negative");
	if (numberOfParents > -1) absurd("length should not be negative");

	switch (numberOfChildren) {
		case 0: {
			switch (numberOfParents) {
				case 0: {
					/* 
						 
					@ <- dangling or the only commit
             
					*/
				}
				case 1: {
					/* first commit in a branch
					@   
					│   
					│ */
				}
				default: {
					/* merge of one or more branches as latest commit in them
					@─╮ <- this or @─╮─╮ <- this and etc.
					│ │            │ │ │                 
					│ @            │ @ │                 
          │ │            │ │ │                 
          │ │            │ │ @                 
					*/
				}
			}
		}
		case 1: {
			// ? should keep branches same but extend current one ?
			switch (numberOfParents) {
				case 0: {
					/* finalization of branch without creating new ones, first commit in history or in dangling branch
					│           
					@           
					│           
					@ <- this */
				}
				case 1: {
					/* continuation of a branch
					│        
					@ <- this
					│        
					*/
				}
				default: {
					/* merge of one or more branches
					│              │                     
					@─╮ <- this or @─╮─╮ <- this and etc.
					│ │            │ │ │                 
					│ @            │ @ │                 
          │ │            │ │ │                 
          │ │            │ │ @                 
					*/
				}
			}
		}
		default: {
			/* start of branches
			   B   D
			   │   │
			 A │   │
			 │ │   │
			 │ │ C │
			 │ │ │ │
			 ╰─@─╯ │
			   │   │ */
			// ? should close all mergin branches (A,B,C not D) and start new one

			switch (numberOfParents) {
				case 0: {
					/*
          @                @  
          │                │  
          │              @ │  
          │              │ │  
          │ @            │ │ @
          │ │            │ │ │
          @─╯ <- this or ╰─@─╯ <- this and etc. */
				}
				case 1: {
					/* same as previous but with a parent
          │ │            │ │ │
          @─╯ <- this or ╰─@─╯ <- this and etc. 
          │                │  
          @                @  
          */
				}
				default: {
					/* 
            │ │              │ │ │   // TODO: find better way to draw this
          ╭─@─╯ <- this or ╭─╰─@─╯╮╮ <- this and etc. 
          │ │              │   │ ╭╯│
          @ │              │   │ @ │
          │ │              │   │ │ │
          │ @              │   │ │ @
          */
				}
			}
		}
	}

	function getChildrenOf(commit: Git.Commit): readonly Drawing.Branch[] {
		return Array.from(ongoingBranches).filter(({ latest: { parents } }) =>
			parents.includes(commit.hash),
		);
	}
}

export namespace Drawing {
	export type Cell =
		| Cell.VerticalEdge
		| Cell.BranchStart
		| Cell.BranchEnd
		| Cell.CommitNode
		| Cell.WhiteSpace;

	export abstract class AnyCell {
		abstract type: number;
		constructor(public ownerBranch: Branch) {}
	}

	export namespace Cell {
		export class CommitNode extends AnyCell {
			static readonly type = 0;
			readonly type = 0;
		}
		export class VerticalEdge extends AnyCell {
			static readonly type = 1;
			readonly type = 1;
		}
		export class BranchStart extends AnyCell {
			static readonly type = 2;
			readonly type = 2;
		}
		export class BranchEnd extends AnyCell {
			static readonly type = 3;
			readonly type = 3;
		}
		export class WhiteSpace extends AnyCell {
			static readonly type = 4;
			readonly type = 4;
		}
	}

	export class Row {
		constructor(public cells: Array<Cell>) {}
	}

	export class Branch {
		column = 0;
		// cells = new Array<AnyCell>();
		constructor(
			public latest: Git.Commit,
			public rest: null | Branch,
		) {}
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
