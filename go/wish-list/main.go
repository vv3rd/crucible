package main

import (
	"context"
	"fmt"
	"html/template"
	"log"
	"net/http"

	"github.com/redis/go-redis/v9"
)

const HOST = "localhost"
const PORT = 4004
const DB_HOST = "localhost"
const DB_PORT = 6379
const SESSION_COOKIE = "sessionToken"

func main() {
	db := redis.NewClient(&redis.Options{
		Addr:     ToAddress(DB_HOST, DB_PORT),
		Password: "",
		DB:       0,
	})
	ctx := context.Background()
	store := NewStore(db, &ctx)

	mux := http.NewServeMux()

	mux.Handle("/public/", http.StripPrefix("/public/", http.FileServer(http.Dir("public"))))
	mux.HandleFunc("/", Index(&store))
	mux.HandleFunc("/start", Start(&store))

	addr := ToAddress(HOST, PORT)
	log.Println(fmt.Sprintf("Running on %s", addr))
	log.Fatalln(http.ListenAndServe(addr, mux))
}

func Index(store *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var (
			err    error
			page   *template.Template
			userId *http.Cookie
			lists  []List
		)
		page = template.Must(template.ParseFiles("./templates/root.html"))

		userId, err = r.Cookie(SESSION_COOKIE)
		if err != nil {
			goto no_session
		}
		lists, err = store.GetListsFor(userId.Value)
		if err != nil {
			goto no_session
		}
		page = template.Must(page.ParseFiles("./templates/list.html"))
		page.ExecuteTemplate(w, "root", lists)
		return

	no_session:
		page = template.Must(page.ParseFiles("./templates/home.html"))
		page.ExecuteTemplate(w, "root", nil)
		return
	}
}

func Start(store *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var (
			err    error
			userId string
			lists  []List
			page   *template.Template
		)
		userId = store.InitNewUser()
		lists, err = store.GetListsFor(userId)
		if err != nil {
			goto internal_error
		}

		http.SetCookie(w, &http.Cookie{
			Name:  SESSION_COOKIE,
			Value: userId,
		})

		page = template.Must(template.ParseFiles("./templates/list.html"))
		page.ExecuteTemplate(w, "main", lists)
		return

	internal_error:
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
}
