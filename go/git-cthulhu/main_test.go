package main

import (
	"fmt"
	"reflect"
	"strings"
	"testing"
)

func TestGetCommitsHistory(t *testing.T) {
	tests := []struct {
		name  string
		given []GitCommit
		want  []string
	}{
		// TODO: define output for 0 commits and 1 commit
		{
			name:  "Can draw single branch",
			given: fakeGitCommits(3),
			want: []string{
				"@",
				"|",
				"@",
				"|",
				"@",
			},
		},
		{
			name:  "Can draw two branches",
			given: fakeGitCommits(3),
			want: []string{
				"@",
				"|",
				"| @",
				"| |",
				"@ |",
				"| |",
				"@─╯",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := DrawGraph(tt.given); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("DrawGraph() == %v, want %v", got, tt.want)
			}
		})
	}
}

func fakeGitCommits(total int) []GitCommit {
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

	for i := 0; i < total; i++ {
		arr = append(arr, GitCommit{
			Hash:    incHash(),
			Parents: []string{arr[len(arr)-1].Hash},
		})

	}

	return arr
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

	for _, commitBranchNumber := range commits {
		arr = append(arr, GitCommit{
			Hash:    incHash(),
			Parents: []string{arr[len(arr)-1].Hash},
		})

	}

	return arr
}
