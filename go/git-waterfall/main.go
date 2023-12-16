package main

//   │ │ │
// ╭─O─╯─╯─╮
//         │
//
// ╭╮╯╰│─

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func main() {
	commitsJson, _ := json.Marshal(GetCommitsHistory())
	fmt.Println(string(commitsJson))
}

const repo = "/home/odmin/Projects/dunmer-bot"

func GetCommitsHistory() []GitCommit {
	gitFormatParts := []string{"%H", "%P", "%at", "%s"}
	gitFormatSeparator := " nxvix4ahuqi_613z51ft7ix_pgdrqss94di "

	cmd := exec.Command(
		"git",
		"-c",
		"log.showSignature=false",
		"log",
		fmt.Sprintf("--max-count=%d", 10),
		fmt.Sprintf("--format='%s'", strings.Join(gitFormatParts, gitFormatSeparator)),
		"--date-order",
		"--branches",
		"--tags",
		"--remotes",
		"HEAD",
	)
	cmd.Dir = repo

	raw, err := cmd.Output()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	lines := strings.Split(string(raw), "\n")
	commits := make([]GitCommit, len(lines))

	for i, line := range lines {
		parts := strings.Split(line, gitFormatSeparator)

		if len(parts) != 4 {
			continue
		}

		commits[i] = GitCommit{
			Hash:    parts[0],
			Parents: strings.Split(parts[1], " "),
			Date:    parts[2],
			Subject: parts[3],
		}
	}

	return commits
}

func GetNextRow(commit GitCommit, previousRow CommitRow) (row CommitRow) {

	return
}

type GitCommit struct {
	Hash    string   `json:"hash"`
	Parents []string `json:"parents"`
	Date    string   `json:"date"`
	Subject string   `json:"subject"`
}

type CommitRow struct {
	elements []GraphElement
}

type Branch struct {
	name string
	line int
}

type OnBranch struct {
	branch *Branch
}

type BranchNode struct {
	OnBranch
	Commit GitCommit
}

type BranchEdge struct {
	OnBranch
	Older *BranchNode
	Newer *BranchNode
}

type HasEdge struct {
	edge *BranchEdge
}

type BranchMerge struct {
	HasEdge
	Into *BranchNode
}

type BranchStart struct {
	HasEdge
	From *BranchNode
}

type GraphElement interface {
	// ToRunes() []rune
	GetBranch() *Branch
}

func (self *OnBranch) GetBranch() *Branch {
	return self.branch
}

func (self *HasEdge) GetBranch() *Branch {
	return self.edge.GetBranch()
}
