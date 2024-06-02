type CommitHash = string;

export namespace Git {
  export type Hash = string

  export type Commit = {
    hash: CommitHash;
    parents: CommitHash[];
  }

  export type History = {
    commits: Commit[];
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
    Emptyness,
    CommitNode,
  }

  type AnyColumn = {
    positionIndex: number
  }

  export type Column = AnyColumn & ({
    type: ColumnType.VerticalEdge
  } | {
    type: ColumnType.BranchStart
    turn: LineTurn
  } | {
    type: ColumnType.BranchEnd
    turn: LineTurn
  } | {
    type: ColumnType.CommitNode
  })

  export type Row = {
    columns: Array<Column>
  }

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


export function DrawGraph(history: Git.History): string[] {
  const { commits } = history;

  if (commits.length === 0) {
    throw new Error("Nothing to draw")
  }

  if (commits.length === 1) {
    return [Drawing.Gliph.Node]
  }

  const hanging = new Array<Git.Commit>();

  const drawing = new Array<Drawing.Row>(commits.length);

  hanging[0] = commits[0];

  for (let i = 1; i < commits.length; i += 1) {
    const thisCommit = commits[i];
    const children = getChildrenOf(thisCommit);

    const commitIsParent = children.length > 0;
    const commitIsHeadOfUmergedBranch = !commitIsParent
    const commitIsMerge = thisCommit.parents.length === 2
    const commitIsFirst = commits.length - 1 === i;
    const commitIsDangling = thisCommit.parents.length === 0 && !commitIsFirst

    if (commitIsParent) {
    }

    if (commitIsHeadOfUmergedBranch) {
      if (commitIsDangling) {
        throw new Error("Do not know how to draw what appears to be a dangling commit")
      }
      if (thisCommit.parents.length === 1) {

      }
    }
  }

  return [];

  function getChildrenOf(commit: Git.Commit) {
    return hanging.filter(({ parents }) => parents.includes(commit.hash)).map((commit, index) => ({ commit, index }));
  }
}
