import { defineActionKind } from "./defineActions";
import { TaskFn } from "./reduxTypes";
import { nanoid } from "@reduxjs/toolkit";
import { sortStringify } from "./utils";
import { defineState } from "./defineState";

const messageAtResource = (key: string, taskId: string) => ({
	payload: {
		key,
		taskId,
	},
});

const dataAtResource = <T>(key: string, data: T) => ({
	payload: {
		...data,
		key: key,
	},
});

const resourceAct = defineActionKind("cache", {
	initiated: messageAtResource,
	resolved: dataAtResource<{ output: unknown }>,
	rejected: dataAtResource<{ error: unknown }>,
	aborted: messageAtResource,
	updated: messageAtResource,
});

const {} = defineState(() => ({
	current: {
		status: "idle",
	},
}));

type Dict<T> = Record<string, T>;

function requireResource<T, R>(
	inputs: T,
	runner: (inputs: T) => Promise<R>,
): TaskFn<{ cache: Dict<any> }> {
	return async function runnerTask({ dispatch, getState, nextAction }) {
		const taskId = nanoid(9);
		const key = sortStringify(inputs);
		const state = getState().cache[key];
		switch (state.fg.status) {
			case "idle": {
				{
					dispatch(resourceAct.initiated(key, taskId));
				}
				try {
					const output = await runner(inputs);
					dispatch(resourceAct.resolved(key, { output }));
				} catch (error) {
					dispatch(resourceAct.rejected(key, { error }));
				}
				break;
			}
			case "pending": {
				let currentState = state;
				while (currentState.fg.status === "pending") {
					const dispatched = await nextAction();
					currentState = getState();
					if (
						!resourceAct.match(dispatched) ||
						dispatched.payload.key !== key
					) {
						continue;
					}
					// TODO: figure out what this task must return
					// biome-ignore format: just ignore
					switch (dispatched.type) {
                            case resourceAct.resolved.type: {}
                            case resourceAct.rejected.type: {}
                            case resourceAct.aborted.type: {}
                            case resourceAct.updated.type: {}
						}
				}
				break;
			}
			case "connected": {
				break;
			}
			case "failed": {
				break;
			}
			case "done": {
				break;
			}
		}
	};
}
