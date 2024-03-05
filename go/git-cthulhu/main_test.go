package main

import (
	"encoding/json"
	"fmt"
	"gopkg.in/yaml.v3"
	"gotest.tools/v3/assert"
	"io"
	"os"
	"strings"
	"testing"
)

type TestCase struct {
	Case  string      `json:"name"`
	Given []GitCommit `json:"given"`
	Want  string      `json:"want"`
}

func TestDrawGraph(t *testing.T) {

	tests := readTestYaml()

	// if true {
	if false {
		x, err := json.MarshalIndent(tests, "", "    ")
		check(err)
		fmt.Printf("%v\n", string(x))

	}

	for _, tc := range tests {
		t.Run(tc.Case, func(t *testing.T) {
			got := DrawGraph(tc.Given)
			want := listFrom(tc.Want)
			assert.DeepEqual(t, got, want)
		})
	}
}

func listFrom(want string) []string {
	return strings.Split(strings.TrimSpace(want), "\n")
}

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func readTestYaml() []TestCase {
	var cases []TestCase
	file, err := os.Open("./tests/DrawGraph.yaml")
	check(err)
	textBytes, err := io.ReadAll(file)
	check(err)
	yaml.Unmarshal(textBytes, &cases)
	return cases
}
