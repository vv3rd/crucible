export function DrawGraph(history: Git.History): string[] {
	let { commits } = history;

	if (commits.length === 0) {
		throw new Error("Nothing to draw");
	}

	if (commits.length === 1) {
		return [Drawing.Gliph.Node];
	}

	let ongoing = new Set<Git.Commit>();

	let drawing = new Array<Drawing.Row>(commits.length);

	ongoing[0] = commits[0];

	for (let i = 1; i < commits.length; i += 1) {
		let thisCommit = commits[i];
		let children = getChildrenOf(thisCommit);

		let commitIsParent = children.length > 0;
		let commitIsHeadOfUmergedBranch = !commitIsParent;
		let commitIsMerge = thisCommit.parents.length === 2;
		let commitIsInitial = commits.length - 1 === i;
		let commitIsDangling = thisCommit.parents.length === 0 && !commitIsInitial;

		if (commitIsParent) {
			let columns = new Array<Drawing.Column>(ongoing.size);
		} else if (commitIsHeadOfUmergedBranch) {
			if (commitIsDangling) {
				throw new Error(
					"Don't know how to draw what appears to be a dangling commit",
				);
			}
			if (thisCommit.parents.length === 1) {
			}
		}

		if (!commitIsInitial && !commitIsDangling) {
			ongoing;
		}
	}

	return [];

	function getChildrenOf(commit: Git.Commit) {
		return Array.from(ongoing)
			.filter(({ parents }) => parents.includes(commit.hash))
			.map((commit, index) => ({ commit, index }));
	}
}

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
		positionIndex: number;
	};

	export type Column = AnyColumn &
		(
			| {
					type: ColumnType.VerticalEdge;
			  }
			| {
					type: ColumnType.BranchStart;
					turn: LineTurn;
			  }
			| {
					type: ColumnType.BranchEnd;
					turn: LineTurn;
			  }
			| {
					type: ColumnType.CommitNode;
			  }
		);

	export type Row = {
		columns: Array<Column>;
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

	export type OngoingBranch = {
		last: Commit;
		rest: OngoingBranch;
	};
}
