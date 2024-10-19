#!/bin/bash

# Simplified WebSocket server in pure Bash
PORT=3333

# Start the server
echo "WebSocket server listening on port $PORT"
while true; do
    coproc nc -l $PORT

    # Read HTTP headers (we're not processing them, just consuming)
    while IFS= read -r line; do
        line=$(echo "$line" | tr -d '\r\n')
        [[ -z "$line" ]] && break
    done <&"${COPROC[0]}"

    # Send WebSocket handshake response
    printf "HTTP/1.1 101 Switching Protocols\r\n" >&"${COPROC[1]}"
    printf "Upgrade: websocket\r\n" >&"${COPROC[1]}"
    printf "Connection: Upgrade\r\n" >&"${COPROC[1]}"
    printf "\r\n" >&"${COPROC[1]}"

    # Echo received messages (simple WebSocket frame handling)
    while IFS= read -r -n1 byte; do
        printf '%02X' "'$byte"
    done <&"${COPROC[0]}" | 
    while read -r -n2 hex; do
        [[ -z "$hex" ]] && break
        printf "\x${hex}"
    done >&"${COPROC[1]}"

    # Close the connection
    exec {COPROC[0]}>&- {COPROC[1]}>&-
done
