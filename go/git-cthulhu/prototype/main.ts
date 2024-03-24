type CommitHash = string;

export type GitCommit = {
  hash: CommitHash;
  parents: CommitHash[];
};

type GitHistory = {
  commits: GitCommit[];
};

export function DrawGraph(history: GitHistory): string[] {
  const { commits } = history;

  for (const commit of commits) {
    
  }

  return []
}
