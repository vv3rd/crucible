import { doNothing, runOnce } from "./utils";
import { combineReducers, Reducer } from "redux";

export function createFormReducer<TFields extends FieldsConfig>(
	options: FormOptions<TFields>,
): FormReducer<InferValues<TFields>> {
	type TValues = InferValues<TFields>;
	const {
		fields: fieldsConfig,
		validate: validateForm = doNothing,
		//
	} = options;

	const uncombinedFieldReducers = Object.fromEntries(
		Object.entries(fieldsConfig).map(([fieldName, reducerFactory]) => [
			fieldName,
			reducerFactory(fieldName),
		]),
	) satisfies {
		[key: string]: FieldReducer<any>;
	};

	const reduceFields: Reducer<FormFieldsState<TValues>, any> = combineReducers(
		uncombinedFieldReducers,
	) as any;

	const initialFormState: FormState<TValues> = {
		fields: reduceFields(undefined, InitAction),
		task: doNothing,
		messages: {},
		canSubmit: undefined,
		submitting: false,
		submissionAttempts: 0,
	};

	const formReducer: FormReducer<TValues> = (state = initialFormState, msg) => {
		switch (msg.type) {
			case FormMsgType.Reset:
				return initialFormState;
			case FormMsgType.SubmissionInit:
				return {
					...state,
					submitting: true,
					submissionAttempts: state.submissionAttempts + 1,
				};
			case FormMsgType.SubmissionDone:
				return {
					...state,
					submitting: false,
				};
		}

		if (FieldMsg.match(msg)) {
			const newFields = reduceFields(state.fields, msg);

			const values = Object.fromEntries(
				Object.entries(newFields).map(([fieldName, fieldState]) => [
					fieldName,
					fieldState.value,
				]),
				// TODO: is it really TValues?
			) as TValues;
			let messages = validateForm(values);

			if (!messages && newFields === state.fields) {
				return state;
			}

			let formTask: TaskFn | undefined;
			if (messages instanceof Promise) {
				formTask = async ({ dispatch }) => {
					try {
						const payload = await messages;
						dispatch; // TODO: add form async validationn msgs
					} catch (error) {
						dispatch;
						throw error;
					}
				};
			}

			const task: TaskFn = runOnce((taskApi) => {
				const results = Object.values(newFields)
					.map((field) => field.task(taskApi))
					.concat(formTask?.(taskApi));

				if (results.some((result) => result instanceof Promise)) {
					return Promise.allSettled(results).then(() => void 0);
				} else {
					return;
				}
			});

			return {
				...state,
				messages: messages instanceof Promise ? state.messages : messages ?? {},
				task,
				fields: newFields,
			};
		}

		return state;
	};

	return formReducer;
}

export const createFieldReducer =
	<TValue>(defaultValue: TValue) =>
	(validate: ValidationFn<TValue> = doNothing) =>
	(fieldName: string) => {
		const defaultState: FieldState<TValue> = {
			name: fieldName,
			value: defaultValue,
			task: doNothing,
			message: undefined,
			isActive: false,
			isValidating: false,
			wasModifiedOnce: false,
			wasFocusedOnce: false,
			wasBlurredOnce: false,
		};

		const reduceChange = createChangeReducer(validate);

		const fieldReducer: FieldReducer<TValue> = (field = defaultState, msg) => {
			if (FormMsg.match(msg)) {
				switch (msg.type) {
					case FormMsgType.Reset:
						return defaultState;
				}
				return field;
			}
			const mt = FieldMsgType;
			if (msg.name === field.name) {
				switch (msg.type) {
					case mt.Changed:
						return reduceChange(field, msg);
					case mt.Focused:
						return { ...field, wasFocusedOnce: true, isActive: true };
					case mt.Blurred:
						return { ...field, wasBlurredOnce: true, isActive: false };
					case mt.SetState:
						return msg.payload;
					case mt.AsyncValidationInit:
						return { ...field, isValidating: true };
					case mt.AsyncValidationDone:
						return { ...field, isValidating: false, message: msg.payload };
					case mt.AsyncValidationFail:
						return { ...field, isValidating: false };
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
	};

function createChangeReducer<TValue>(
	validate: ValidationFn<TValue> | undefined,
) {
	type S = FieldState<TValue>;
	type E = FieldMsg<TValue> | FormMsg;
	type EChanged = Extract<E, { type: FieldMsgType.Changed }>;

	let reducer = (field: S, msg: EChanged): S => {
		field = { ...field };
		field.wasFocusedOnce = field.wasModifiedOnce = field.isActive = true;
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

function createValidationReducer<TValue>(validate: ValidationFn<TValue>) {
	return function reduceValidation(field: FieldState<TValue>) {
		const result = validate(field.value);
		if (result instanceof Promise) {
			field.task = createAsyncValidationTask(field, result);
		} else {
			field.message = result;
		}
		return field;
	};
}

function createAsyncValidationTask<TValue>(
	field: FieldState<TValue>,
	result: Promise<ValidationMessage>,
): TaskFn {
	const name = field.name;
	const mt = FieldMsgType;
	return runOnce(async ({ dispatch }) => {
		dispatch({ type: mt.AsyncValidationInit, name });
		try {
			const payload = await result;
			dispatch({ type: mt.AsyncValidationDone, name, payload });
		} catch (error) {
			dispatch({ type: mt.AsyncValidationFail, name });
			throw error;
		}
	});
}

type InitAction = typeof InitAction;
const InitAction = {
	type: "@init" + Math.random().toString(36).slice(2),
};

type Msg<T, P = {}> = { type: T } & P;
type MsgPayload<P> = { payload: P };

type TaskFn = (taskApi: TaskAPI) => void | Promise<void>;
type TaskAPI = {
	dispatch: (msg: FormMsg | FieldMsg<any>) => void;
};
interface WithTask {
	task: TaskFn;
}

interface FieldFlags {
	wasModifiedOnce: boolean;
	wasFocusedOnce: boolean;
	wasBlurredOnce: boolean;
	isValidating: boolean;
	isActive: boolean;
}
interface FieldState<TValue> extends WithTask, FieldFlags {
	name: string;
	value: TValue;
	message: ValidationMessage;
}

enum FormMsgType {
	Reset = "form/reset",
	SubmissionInit = "form/submission/init",
	SubmissionDone = "form/submission/done",
}
namespace FormMsg {
	export const match = (msg: { type: string }): msg is FormMsg =>
		msg.type in FormMsgType;
}
type FormMsg<_T = any> = {} & (
	| Msg<FormMsgType.Reset>
	| Msg<FormMsgType.SubmissionInit>
	| Msg<FormMsgType.SubmissionDone>
);

enum FieldMsgType {
	AsyncValidationInit = "field/validation/init",
	AsyncValidationDone = "field/validation/done",
	AsyncValidationFail = "field/validation/fail",
	Changed = "field/changed",
	Blurred = "field/blurred",
	Focused = "field/focused",
	SetState = "field/setState",
}

namespace FieldMsg {
	export const match = (msg: { type: string }): msg is FieldMsg<any> =>
		msg.type in FieldMsgType;
}
type FieldMsg<TValue> = { name: string } & (
	| Msg<FieldMsgType.AsyncValidationInit>
	| Msg<FieldMsgType.AsyncValidationDone, MsgPayload<ValidationMessage>>
	| Msg<FieldMsgType.AsyncValidationFail>
	| Msg<FieldMsgType.Changed, MsgPayload<TValue>>
	| Msg<FieldMsgType.Blurred>
	| Msg<FieldMsgType.Focused>
	| Msg<FieldMsgType.SetState, MsgPayload<FieldState<TValue>>>
);

type ValidationMessage = undefined | void | string[];
type ValidationFn<TValue> = (
	value: TValue,
) => util.MaybePromise<ValidationMessage>;
type FormValidationFn<TValues> = (
	values: TValues,
) => util.MaybePromise<void | { [K in keyof TValues]?: ValidationMessage }>;

interface FormFlags {
	canSubmit: ValidationMessage;
	submitting: boolean;
	submissionAttempts: number;
}
interface FormState<TFields> extends FormFlags, WithTask {
	fields: FormFieldsState<TFields>;
	messages: {
		[K in keyof TFields]?: ValidationMessage;
	};
}
type FormFieldsState<TFields> = {
	[K in keyof TFields]: FieldState<TFields[K]>;
};

interface FormAPI<_TFields> {
	reset: () => void;
	submit: () => void;
}

type FormReducer<TValues> = (
	state: FormState<TValues>,
	msg: FormMsg | FieldMsg<TValues[keyof TValues]>,
) => FormState<TValues>;

type FieldReducer<TValue> = (
	state: FieldState<TValue> | undefined,
	msg: FieldMsg<TValue> | FormMsg,
) => FieldState<TValue>;

type FieldReducerFactory<TValue> = (fieldName: string) => FieldReducer<TValue>;

type FieldsConfig = {
	readonly [key: string]: FieldReducerFactory<any>;
};

type InferValues<F> = F extends FieldReducerFactory<infer T>
	? T
	: F extends FieldsConfig
		? { readonly [K in keyof F]: InferValues<F[K]> }
		: F;

interface FormOptions<
	TFields extends FieldsConfig,
	TValues = InferValues<TFields>,
> {
	fields: TFields;
	validate?: FormValidationFn<TValues>;
}

namespace util {
	export const isArray = Array.isArray;

	export const isFunction = <T>(value: T): value is T & Function =>
		typeof value === "function";

	export type MaybePromise<T> = Promise<T> | T;
}

const usernameField = createFieldReducer("")((username) => {
	if (username.startsWith("+")) return;
	else return ["Must start with +"];
});

const formReducer = createFormReducer({
	fields: {
		username: usernameField,
	},
});
