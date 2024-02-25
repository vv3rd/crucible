package main

import (
	"fmt"
	"io"
	"os"
	"reflect"
	"slices"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

type YamlTestCase struct {
	Name  string `json:"case"`
	Given []int  `json:"given"`
	Want  string `json:"want"`
}

type TestCase struct {
	Name  string
	Given []GitCommit
	Want  []string
}

func TestDrawGraph(t *testing.T) {

	cases := readTestYaml()
	tests := make([]TestCase, len(cases))

	for i, c := range cases {
		tests[i] = TestCase{
			Name:  c.Name,
			Given: fakeGitHistory(c.Given...),
			Want:  strings.Split(c.Want, "\n"),
		}
	}

	for _, tc := range tests {
		t.Run(tc.Name, func(t *testing.T) {
			if got := DrawGraph(tc.Given); !reflect.DeepEqual(got, tc.Want) {
				want := fmt.Sprintf("\n%s", strings.Join(tc.Want, "\n"))
				t.Errorf("DrawGraph() == %v, want %v", got, want)
			}
		})
	}
}

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func readTestYaml() []YamlTestCase {
	var cases []YamlTestCase
	file, err := os.Open("./tests/DrawGraph.yaml")
	check(err)
	textBytes, err := io.ReadAll(file)
	check(err)
	yaml.Unmarshal(textBytes, &cases)
	return cases
}

func fakeGitHistory(commits ...int) []GitCommit {
	history := make([]GitCommit, 0)
	lastHashInBranch := make(map[int]string)

	count := 0

	history = append(history, GitCommit{
		Hash:    strings.Repeat(fmt.Sprintf("%d", count), 6),
		Parents: []string{},
	})
	lastHashInBranch[0] = history[0].Hash

	for _, commitBranchIdx := range commits {
		count += 1
		hash := strings.Repeat(fmt.Sprintf("%d", count), 6)
		last := lastHashInBranch[commitBranchIdx]
		lastHashInBranch[commitBranchIdx] = hash
		history = append(history, GitCommit{
			Hash:    hash,
			Parents: []string{last},
		})
	}

	slices.Reverse(history)

	return history
}
