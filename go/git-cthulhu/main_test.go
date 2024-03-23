package main

import (
	"encoding/json"
	"fmt"
	"gopkg.in/yaml.v3"
	"gotest.tools/v3/assert"
	"io"
	"os"
	"testing"
)

type TestCase struct {
	Case  string      `json:"name"`
	Given []GitCommit `json:"given"`
	Want  []string    `json:"want"`
}

func TestDrawGraph(t *testing.T) {
	tests := readTestCases("./tests/DrawGraph.yaml")

	for i := range tests {
		test := &tests[i]
		test.Given = append(test.Given, GitCommit{Parents: []string{}})
		for j := range test.Given {
			commit := &test.Given[j]
			commit.Hash = fmt.Sprintf("%d", len(test.Given)-j)
		}
	}

	debug(tests)

	for _, tc := range tests {
		t.Run(tc.Case, func(t *testing.T) {
			got := DrawGraph(tc.Given)
			assert.DeepEqual(t, got, tc.Want)
		})
	}
}

func debug[T any](tests T) {
	x, err := json.MarshalIndent(tests, "", "    ")
	check(err)
	fmt.Printf("%v\n", string(x))
}

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func readTestCases(filePath string) []TestCase {
	var cases []TestCase
	file, err := os.Open(filePath)
	check(err)
	textBytes, err := io.ReadAll(file)
	check(err)
	yaml.Unmarshal(textBytes, &cases)
	return cases
}
