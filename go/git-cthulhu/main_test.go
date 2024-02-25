package main

import (
	"encoding/json"
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
	Case  string   `json:"case"`
	Given []string `json:"given"`
	Want  string   `json:"want"`
}

type TestCase struct {
	Name  string      `json:"name"`
	Given []GitCommit `json:"given"`
	Want  []string    `json:"want"`
}

func TestDrawGraph(t *testing.T) {

	cases := readTestYaml()
	tests := make([]TestCase, len(cases))

	for i, c := range cases {
		tests[i] = TestCase{
			Name:  c.Case,
			Given: fakeGitHistory(c.Given...),
			Want:  strings.Split(c.Want, "\n"),
		}
	}

	// if true {
	if false {
		x, _ := json.MarshalIndent(tests, "", "    ")
		fmt.Printf("%v\n", string(x))

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

func fakeGitHistory(commits ...string) []GitCommit {
	history := make([]GitCommit, 0)
	lastHashInBranch := make(map[string]string)

	count := 0
	trunkIdx := commits[0]

	history = append(history, GitCommit{
		Hash:    strings.Repeat(fmt.Sprintf("%d", count), 6),
		Parents: []string{},
	})
	lastHashInBranch[trunkIdx] = history[0].Hash

	for _, branchIdx := range commits {
		count += 1
		hash := strings.Repeat(fmt.Sprintf("%d", count), 6)
		if strings.Contains(branchIdx, "+") {

			parts := strings.Split(branchIdx, "+")
			branchA := parts[0]
			branchB := parts[1]

			parentA := lastHashInBranch[branchA]
			parentB := lastHashInBranch[branchB]

			lastHashInBranch[branchA] = hash
			lastHashInBranch[branchB] = hash

			history = append(history, GitCommit{
				Hash:    hash,
				Parents: []string{parentA, parentB},
			})

		} else {

			// FIXME: can be "" if it's a new branchIdx
			parent := lastHashInBranch[branchIdx]
			lastHashInBranch[branchIdx] = hash

			history = append(history, GitCommit{
				Hash:    hash,
				Parents: []string{parent},
			})
		}
	}

	slices.Reverse(history)

	return history
}
