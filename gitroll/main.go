package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

type GitCommit struct {
	Hash    string   `json:"hash"`
	Parents []string `json:"parents"`
	Date    string   `json:"date"`
	Subject string   `json:"subject"`
}

func main() {
	commits := ReadGitHistory(".")
	x, _ := json.Marshal(commits)
	fmt.Printf("%v\n", string(x))

}

func ReadGitHistory(repo string) []GitCommit {
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

func DrawGraph(gitHistory []GitCommit) (tuiGraph []string) {

	return []string{}
}
