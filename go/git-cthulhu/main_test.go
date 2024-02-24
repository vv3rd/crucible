package main

import (
	"reflect"
	"testing"
)

func TestGetCommitsHistory(t *testing.T) {
	tests := []struct {
		name string
		want []GitCommit
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := GetCommitsHistory(); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("GetCommitsHistory() = %v, want %v", got, tt.want)
			}
		})
	}
}
