package main

import (
	"fmt"
	"io"
	"os"
	"reflect"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

type TestCaseJson struct {
	Name  string `json:"name"`
	Given []int  `json:"given"`
	Want  string `json:"want"`
}

type TestCase struct {
	Name  string
	Given []GitCommit
	Want  []string
}

func check(e error) {
	if e != nil {
		panic(e)
	}
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

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			if got := DrawGraph(tt.Given); !reflect.DeepEqual(got, tt.Want) {
				t.Errorf("DrawGraph() == %v, want %v", got, tt.Want)
			}
		})
	}
}

func readTestYaml() []TestCaseJson {
	var cases []TestCaseJson
	file, err := os.Open("./tests/DrawGraph.yaml")
	check(err)
	textBytes, err := io.ReadAll(file)
	check(err)
	yaml.Unmarshal(textBytes, &cases)
	return cases
}

func fakeGitHistory(commits ...int) []GitCommit {
	arr := make([]GitCommit, 0)

	var (
		count int
	)

	incHash := func() string {
		count++
		return strings.Repeat(fmt.Sprintf("%d", count), 6)
	}

	arr = append(arr, GitCommit{
		Hash:    incHash(),
		Parents: []string{},
	})

	for _, i := range commits {
		_ = i
		arr = append(arr, GitCommit{
			Hash:    incHash(),
			Parents: []string{arr[len(arr)-1].Hash},
		})

	}

	return arr
}
