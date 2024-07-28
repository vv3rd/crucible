import { Application, Router, Logger, oakCors } from "./deps.ts";

const port = Number(Deno.env.get("PORT") ?? 80);

const server = new Application();
const router = new Router();
const logger = new Logger();

router.get("/", (ctx) => {
	ctx.response.body = "Hello world!";
});
router.post("/api/solve", oakCors(), async (ctx, next) => {
	const params = await ctx.request.body().value;
	if (!(params instanceof URLSearchParams)) {
		return next();
	}
	const nums = (params.get("nums")?.match(/\d+/g) ?? []).map(Number);

	logger.info("Solving for", nums);
	const answer = solve(nums);
	logger.info("Solved: ", answer);

	const text = await Deno.readTextFile("./template.html");
	ctx.response.headers.set("Content-Type", "text/html");
	ctx.response.body = text.replace("{{ANSWER}}", answer.toString());
});

server.use((ctx, next) => {
	logger.info(ctx.request.method, ctx.request.url.href);
	return next();
});
server.use(router.routes());
server.use(router.allowedMethods());

logger.info(`Running on port ${port}`);

{
	await server.listen({ port });
}

function solve(theNums: number[]) {
	const n = theNums.length;
	const theANDs: number[] = [];
	let maxAND = -Infinity;

	if (n == 1) {
		return 1;
	}

	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j <= n; j++) {
			const and = theNums.slice(i, j).reduce((a, b) => a & b);

			if (and > maxAND) {
				maxAND = and;
			}

			theANDs.push(and);
		}
	}

	let answer = 0;

	for (const and of theANDs) {
		if (and == maxAND) {
			answer++;
		}
	}

	return answer;
}
