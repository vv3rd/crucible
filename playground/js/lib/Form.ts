import { doNothing, runOnce } from "./utils";
import { combineReducers, Reducer } from "redux";

const { fromEntries, entries } = Object;

export function createFormReducer<TFields extends FieldsConfig>(
	options: FormOptions<TFields>,
): Form.Reducer<InferValues<TFields>> {
	type TValues = InferValues<TFields>;
	const {
		fields: fieldsConfig,
		validate: validateForm = doNothing,
		//
	} = options;

	const reduceFields = combineReducers(
		fromEntries(
			entries(fieldsConfig).map(([name, factory]) => [name, factory(name)]),
		) satisfies {
			[key: string]: Field.Reducer<any>;
		},
	) as Reducer<Form.FieldsState<TValues>>;

	const initialFormState: Form.State<TValues> = {
		fields: reduceFields(undefined, InitAction),
		notes: {},
		task: doNothing,
		isSubmitting: false,
		isValidating: false,
		submissionAttempts: 0,
	};

	const formReducer: Form.Reducer<TValues> = (
		state = initialFormState,
		msg,
	): Form.State<TValues> => {
		switch (msg.type) {
			case Form.MsgType.Reset:
				return initialFormState;
			case Form.MsgType.SubmitInit:
				return {
					...state,
					isSubmitting: true,
					submissionAttempts: state.submissionAttempts + 1,
				};
			case Form.MsgType.SubmitDone:
				return {
					...state,
					isSubmitting: false,
				};
			case Form.MsgType.AsyncCheckInit:
				return { ...state, isValidating: true };
			case Form.MsgType.AsyncCheckFail:
				return { ...state, isValidating: false };
			case Form.MsgType.AsyncCheckDone:
				return { ...state, isValidating: false, notes: msg.payload ?? {} };
		}

		if (Field.Msg.match(msg)) {
			const newFields = reduceFields(state.fields, msg);

			// TODO: might want to provide information on what changed to be able to skip validation

			let formNotes = validateForm(
				fromEntries(
					entries(newFields).map(([fieldName, fieldState]) => [
						fieldName,
						fieldState.value,
					]),
				) as TValues,
			);

			if (!formNotes && newFields === state.fields) {
				return state;
			}

			let formTask: TaskFn | undefined;
			if (formNotes instanceof Promise) {
				formTask = async ({ dispatch }) => {
					dispatch({ type: Form.MsgType.AsyncCheckInit });
					try {
						const payload = await formNotes;
						dispatch({ type: Form.MsgType.AsyncCheckDone, payload });
					} catch (error) {
						dispatch({ type: Form.MsgType.AsyncCheckFail });
						throw error;
					}
				};
			}

			const task: TaskFn = runOnce((taskApi) => {
				const results = Object.values(newFields)
					.map((field) => field.task(taskApi))
					.concat(formTask?.(taskApi));

				if (results.some((result) => result instanceof Promise)) {
					const voidPromise = Promise.allSettled(results).then(doNothing);
					return voidPromise;
				} else {
					return;
				}
			});

			return {
				...state,
				notes: formNotes instanceof Promise ? state.notes : formNotes ?? {},
				task,
				fields: newFields,
			};
		}

		return state;
	};

	return formReducer;
}

export function createFieldReducer<TValue>(
	fieldName: string,
	defaultValue: TValue,
	validate: Field.Checker<TValue> = doNothing,
) {
	const defaultState: Field.State<TValue> = {
		name: fieldName,
		value: defaultValue,
		task: doNothing,
		notes: [],
		isActive: false,
		isValidating: false,
		wasModified: false,
		wasFocused: false,
		wasBlurred: false,
	};

	const reduceChange = createChangeReducer(validate);

	const fieldReducer: Field.Reducer<TValue> = (
		field = defaultState,
		msg,
	): Field.State<TValue> => {
		if (!Field.Msg.match(msg)) {
			switch (msg.type) {
				case Form.MsgType.Reset:
					return defaultState;
			}
			return field;
		}
		const mt = Field.MsgType;
		if (msg.name === field.name) {
			switch (msg.type) {
				case mt.Changed:
					return reduceChange(field, msg);
				case mt.Focused:
					return { ...field, wasFocused: true, isActive: true };
				case mt.Blurred:
					return { ...field, wasBlurred: true, isActive: false };
				case mt.SetState:
					return msg.payload;
				case mt.AsyncCheckInit:
					return { ...field, isValidating: true };
				case mt.AsyncCheckFail:
					return { ...field, isValidating: false };
				case mt.AsyncCheckDone:
					return {
						...field,
						isValidating: false,
						notes: Field.CheckResult.toNotes(msg.payload),
					};
			}
		} else {
			switch (msg.type) {
				case mt.Focused:
				case mt.Changed:
					return { ...field, isActive: false };
			}
		}

		return field;
	};

	return fieldReducer;

	function createChangeReducer<TValue>(
		validate: Field.Checker<TValue> | undefined,
	) {
		type S = Field.State<TValue>;
		type E = Field.Msg<TValue> | Form.Msg;
		type EChanged = Extract<E, { type: Field.MsgType.Changed }>;

		let reducer = (field: S, msg: EChanged): S => {
			field = { ...field };
			field.wasModified = field.isActive = true;
			field.value = msg.payload;
			return field;
		};

		if (validate) {
			const previous = reducer;
			const reduceValidation = createValidationReducer(validate);
			reducer = (field, msg) => reduceValidation(previous(field, msg));
		}

		return reducer;
	}

	function createValidationReducer<TValue>(validate: Field.Checker<TValue>) {
		return function reduceValidation(field: Field.State<TValue>) {
			const result = validate(field.value);
			if (result instanceof Promise) {
				field.task = createAsyncValidationTask(field, result);
			} else {
				field.notes = Field.CheckResult.toNotes(result);
			}
			return field;
		};
	}

	function createAsyncValidationTask<TValue>(
		field: Field.State<TValue>,
		result: Promise<Field.CheckResult>,
	): TaskFn {
		const name = field.name;
		const mt = Field.MsgType;
		return runOnce(async ({ dispatch }) => {
			dispatch({ type: mt.AsyncCheckInit, name });
			try {
				const payload = await result;
				dispatch({ type: mt.AsyncCheckDone, name, payload });
			} catch (error) {
				dispatch({ type: mt.AsyncCheckFail, name });
				throw error;
			}
		});
	}
}

type InitAction = typeof InitAction;
const InitAction = {
	type: "@init" + Math.random().toString(36).slice(2),
};

type _Msg<T, P = {}> = { type: T } & P;
type _MsgPayload<P> = { payload: P };

type TaskFn = (taskApi: TaskAPI) => void | Promise<void>;
type TaskAPI = {
	dispatch: (msg: Form.Msg | Field.Msg<any>) => void;
};
interface WithTask {
	task: TaskFn;
}

interface Note {
	level: number;
	text: string;
}

namespace Field {
	export interface Flags {
		wasModified: boolean;
		wasFocused: boolean;
		wasBlurred: boolean;
		isValidating: boolean;
		isActive: boolean;
	}
	export interface State<TValue> extends WithTask, Flags {
		name: string;
		value: TValue;
		notes: Note[];
	}

	export type Checker<TValue> = (
		value: TValue,
	) => util.MaybePromise<CheckResult>;

	export type CheckResult = undefined | void | string | Note;
	export namespace CheckResult {
		export const toNotes = (result: CheckResult) => {
			if (util.isString(result)) {
				return [{ level: 1, text: result }];
			} else if (util.isReal(result)) {
				return [result];
			} else {
				return [];
			}
		};
	}

	export enum MsgType {
		AsyncCheckInit = "fielD/check/init",
		AsyncCheckDone = "fielD/check/done",
		AsyncCheckFail = "fielD/check/fail",
		Changed = "fielD/changed",
		Blurred = "fielD/blurred",
		Focused = "fielD/focused",
		SetState = "fielD/setState",
	}
	export namespace Msg {
		export const match = (msg: { type: string }): msg is Msg<any> =>
			msg.type in MsgType;
	}
	export type Msg<TValue> = { name: string } & (
		| _Msg<MsgType.AsyncCheckInit>
		| _Msg<MsgType.AsyncCheckDone, _MsgPayload<CheckResult>>
		| _Msg<MsgType.AsyncCheckFail>
		| _Msg<MsgType.Changed, _MsgPayload<TValue>>
		| _Msg<MsgType.Blurred>
		| _Msg<MsgType.Focused>
		| _Msg<MsgType.SetState, _MsgPayload<Field.State<TValue>>>
	);

	export type Reducer<TValue> = (
		state: State<TValue> | undefined,
		msg: Msg<TValue> | Form.Msg | InitAction,
	) => State<TValue>;

	export type ReducerFactory<TValue> = (fieldName: string) => Reducer<TValue>;
}

namespace Form {
	interface Flags {
		isValidating: boolean;
		isSubmitting: boolean;
		submissionAttempts: number;
	}
	export interface State<TFields> extends Flags, WithTask {
		fields: FieldsState<TFields>;
		notes: NonNullable<CheckResult<TFields>>;
	}
	export type FieldsState<TFields> = {
		[K in keyof TFields]: Field.State<TFields[K]>;
	};

	export type ValidationFn<TValues> = (
		values: TValues,
	) => util.MaybePromise<CheckResult<TValues>>;

	export type CheckResult<TValues> =
		| void
		| { [K in keyof TValues]?: Field.CheckResult };

	export enum MsgType {
		Reset = "forM/reset",
		SubmitInit = "forM/submit/init",
		SubmitDone = "forM/submit/done",
		AsyncCheckInit = "forM/check/init",
		AsyncCheckDone = "forM/check/done",
		AsyncCheckFail = "forM/check/fail",
	}
	export namespace Msg {
		export const match = (msg: { type: string }): msg is Msg =>
			msg.type in MsgType;
	}
	export type Msg<T = any> = {} & (
		| _Msg<MsgType.Reset>
		| _Msg<MsgType.SubmitInit>
		| _Msg<MsgType.SubmitDone>
		| _Msg<MsgType.AsyncCheckInit>
		| _Msg<MsgType.AsyncCheckDone, _MsgPayload<CheckResult<T>>>
		| _Msg<MsgType.AsyncCheckFail>
	);

	export type Reducer<TValues> = (
		state: State<TValues> | undefined,
		msg: Msg | Field.Msg<TValues[keyof TValues]>,
	) => State<TValues>;
}

type FieldsConfig = {
	readonly [key: string]: Field.ReducerFactory<any>;
};

type InferValues<F> = F extends Field.ReducerFactory<infer T>
	? T
	: F extends FieldsConfig
		? { readonly [K in keyof F]: InferValues<F[K]> }
		: F;

interface FormOptions<
	TFields extends FieldsConfig,
	TValues = InferValues<TFields>,
> {
	fields: TFields;
	validate?: Form.ValidationFn<TValues>;
}

namespace util {
	export type MaybePromise<T> = Promise<T> | T;

	export const isArray = Array.isArray;

	export const isFunction = <T>(value: T): value is T & Function =>
		typeof value === "function";

	export const isString = (value: unknown): value is string =>
		typeof value === "string";

	export const isReal = (value: unknown): value is {} => value != null;
}

// {
// 	const usernameField = createFieldReducer("")((username) => {
// 		if (username.startsWith("+")) return;
// 		else return "Must start with +";
// 	});

// 	const consentField = createFieldReducer(false)((consent) => {
// 		if (consent) return;
// 		else return "Must consent";
// 	});

// 	const preferencesField = createFieldReducer(Array<string>())((pref) => {
// 		if (pref.length > 2) return;
// 		else return "must pick at least 3 preference";
// 	});

// 	const formReducer = createFormReducer({
// 		fields: {
// 			username: usernameField,
// 			consent: consentField,
// 			preference: preferencesField,
// 		},
// 	});
// 	formReducer;
// }
