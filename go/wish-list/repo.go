package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/oklog/ulid/v2"
	"github.com/redis/go-redis/v9"
)

type User struct {
	Id string `json:"id"`
}

type Item struct {
	ListId string `json:"listId"`
	Name   string `json:"name"`
	Link   string `json:"link"`
}

type List struct {
	Id     string `json:"id"`
	UserId string `json:"userId"`
	Name   string `json:"name"`
	Items  []Item `json:"items"`
}

type Session struct {
	Id     string `json:"id"`
	UserId string `json:"userId"`
}

type Store struct {
	db       *redis.Client
	ctx      *context.Context
	Lists    []List    `json:"lists"`
	Users    []User    `json:"users"`
	Sessions []Session `json:"sessions"`
}

func NewStore(db *redis.Client, ctx *context.Context) Store {
	return Store{
		db:  db,
		ctx: ctx,
	}
}

func (s *Store) FindUser(userId string) (*User, error) {
	for _, user := range s.Users {
		if user.Id == userId {
			return &user, nil
		}
	}
	return nil, errors.New(fmt.Sprintf("No user found for id %s", userId))
}

func (s *Store) GetListsFor(userId string) (result []List, err error) {
	_, err = s.FindUser(userId)
	if err != nil {
		return nil, err
	}

	for _, list := range s.Lists {
		if list.UserId == userId {
			result = append(result, list)
		}
	}
	return
}

func (s *Store) InitNewUser() string {
	newUser := User{
		Id: ulid.Make().String(),
	}
	newList := List{
		Id:     ulid.Make().String(),
		UserId: newUser.Id,
		Name:   "my wishlist",
	}
	s.Users = append(s.Users, newUser)
	s.Lists = append(s.Lists, newList)

	return newUser.Id
}
