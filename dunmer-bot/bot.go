package dunmerbot

import (
	"context"
	"fmt"
	"os"

	tg "github.com/mymmrac/telego"
	redis "github.com/redis/go-redis/v9"
)

var ctx = context.Background()

func main() {

	rdb := redis.NewClient(&redis.Options{
		Addr:     os.Getenv("DB_ADDR"),
		Password: "",
		DB:       0,
	})
	_ = rdb
}

func NewRepo(rdb *redis.Client) RedisRepo {
	return RedisRepo{
		db: rdb,
	}
}

type Repo interface {
	getUserCollections(userId string)
}

type RedisRepo struct {
	db *redis.Client
}

func (r *RedisRepo) getUserCollections(userId string) {
	thing, err := r.db.Get(ctx, fmt.Sprintf("user-%s", userId)).Result()

	_ = thing
	_ = err
}

//
//
// Bot
//
//

func createBot() {
	botToken := os.Getenv("TOKEN")

	bot, err := tg.NewBot(botToken, tg.WithDefaultDebugLogger())
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	// (more on configuration in examples/updates_long_polling/main.go)
	updates, _ := bot.UpdatesViaLongPolling(nil)
	defer bot.StopLongPolling()

	botUser, err := bot.GetMe()
	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Printf("Bot user: %+v\n", botUser)

	}

	for update := range updates {
		if update.Message != nil {
			handleMessage(update.Message)
			continue
		}
		if update.InlineQuery != nil {
			handleInlineQuery(update.InlineQuery)
			continue
		}
	}
}

func handleMessage(msg *tg.Message) {

}

func handleInlineQuery(query *tg.InlineQuery) {

}
