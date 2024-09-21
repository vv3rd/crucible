export function DrawGraph(history: Git.History): Drawing.Row[] {
	let { commits } = history;

	if (commits.length === 0) {
		return [];
	}

	if (commits.length === 1) {
		return [{ columns: [Drawing.Column.CommitNode(0)] }];
	}

	let ongoing = new Set<Drawing.Branch>();
	let drawing = new Array<Drawing.Row>(commits.length);

	ongoing.add({
		last: commits[0],
		rest: null,
	});

	for (let i = 1; i < commits.length - 1; i += 1) {
		let thisCommit = commits[i];
		let children = getChildrenOf(thisCommit);

		let commitIsParent = children.length > 0;
		let commitIsHeadOfUmergedBranch = !commitIsParent;
		let commitIsMergeIn = thisCommit.parents.length === 2;
		let commitIsDangling = thisCommit.parents.length === 0;

		if (commitIsParent) {
			let columns = new Array<Drawing.Column>(ongoing.size);
			// TODO: do something with columns
			drawing[i] = { columns };
		} else if (commitIsDangling) {
			throw new Error(DANGLING_COMMIT_ERROR); // FIXME: figure out how to draw dangling commits
		} else {
			// commit is head of unmerged branch
			if (thisCommit.parents.length === 1) {
			}
		}
	}

	return [];

	function getChildrenOf(commit: Git.Commit) {
		return Array.from(ongoing)
			.filter(({ last: { parents } }) => parents.includes(commit.hash))
			.map((commit, index) => ({ commit, index }));
	}
}

const DANGLING_COMMIT_ERROR =
	"Don't know how to draw what appears to be a dangling commit";

export namespace Drawing {
	enum LineTurn {
		Right,
		Left,
	}

	enum ColumnType {
		VerticalEdge,
		BranchStart,
		BranchEnd,
		WhiteSpace,
		CommitNode,
	}

	type AnyColumn = {
		position: number;
	};

	export type Column = AnyColumn &
		(
			| ReturnType<typeof Column.VerticalEdge>
			| ReturnType<typeof Column.BranchStart>
			| ReturnType<typeof Column.BranchEnd>
			| ReturnType<typeof Column.CommitNode>
			| ReturnType<typeof Column.WhiteSpace>
		);

	export namespace Column {
		export const VerticalEdge = (i: number) =>
			({
				position: i,
				type: ColumnType.VerticalEdge,
			}) as const;
		export const BranchStart = (i: number, turn: LineTurn) =>
			({
				position: i,
				type: ColumnType.BranchStart,
				turn: turn,
			}) as const;
		export const BranchEnd = (i: number, turn: LineTurn) =>
			({
				position: i,
				type: ColumnType.BranchEnd,
				turn: turn,
			}) as const;
		export const CommitNode = (i: number) =>
			({
				position: i,
				type: ColumnType.CommitNode,
			}) as const;
		export const WhiteSpace = (i: number) =>
			({
				position: i,
				type: ColumnType.WhiteSpace,
			}) as const;
	}

	export type Row = {
		columns: Array<Column>;
	};

	export type Branch = {
		last: Git.Commit;
		rest: null | Branch;
	};

	export enum Gliph {
		Node = "@",
		EdgeV = "│",
		EdgeH = "─",
		TurnTR = "╰",
		TurnBR = "╭",
		TurnBL = "╮",
		TurnTL = "╯",
	}
}

export namespace Git {
	export type Hash = string;

	export type Commit = {
		hash: Hash;
		parents: Hash[];
	};

	export type History = {
		commits: Commit[];
	};
}
