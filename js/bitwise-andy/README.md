# Bitwise Andy

## What is this?

A friend of mine gave me a coding challange

> You are given a zero-indexed array `nums` of length `n`, where `n >= 1`, that contains positive integers. Consider all possible sub-arrays `nums[i: j]` where `0 <= i < j <= n`, and consider taking a bitwise `AND` of their elements. For example, a sub-array `[15, 7, 14]` has a bitwise `AND` equal to 6. We will call `m` the maximum possible bitwise `AND` of any sub-array of nums.
> Find how many sub-arrays of nums have the the bitwise AND exactly equal to m.
> Some examples:
> ```
> [1] -> 1
> [1, 1] -> 2
> [16, 8, 4] -> 1
> ```
> Solve in any language you want.

And that is how I solved it.

## Self hosting

1. install [Docker](https://docs.docker.com/get-docker/)
2. clone this repo and cd into it
3. run `APP_DOMAIN=http://localhost docker compose up`
