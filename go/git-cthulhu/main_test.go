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

	for i := range cases {
		cases[i].Given = append(cases[i].Given, GitCommit{Hash: "1", Parents: []string{}})
	}

	return cases
}
