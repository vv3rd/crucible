type CommitHash = string;

type GitCommit = {
  hash: CommitHash;
  parents: CommitHash[];
};

type GitHistory = {
  commits: GitCommit[];
};

export function DrawGraph(history: GitHistory): string[] {
  const { commits } = history;

  return []
}
