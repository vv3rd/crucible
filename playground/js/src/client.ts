import readline from "node:readline";

const ws = new WebSocket("http://localhost:3333");

ws.onmessage = (ev) => {
	console.log("\nGot data", ev.data);
};

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

while (true) {
	const userInput = await new Promise<string>((resolve) => {
		rl.question(`Input message to send:`, (text) => {
			resolve(text);
		});
	});
	if (userInput === "done") {
		rl.close();
		break;
	}
	console.log(`Sending ${userInput}!`);
	ws.send(userInput);
}

process.exit(0);
