import { memoLast } from "./memoLast";
import { doNothing, runOnce } from "./utils";
import { combineReducers, Reducer } from "redux";

const INIT_ACTION = { type: "__init__" };

export function createFormReducer<TFields extends FieldsConfig>(
	options: FormOptions<TFields>,
): FormReducer<InferValues<TFields>> {
	type TValues = InferValues<TFields>;
	const {
		fields: fieldsConfig,
		validate: givenValidateFn = doNothing,
		//
	} = options;
	const validate = memoLast(givenValidateFn);
	const validateField = (fieldName: keyof TValues) => {
		const validatedForm = validate.getLastResult();
		if (validatedForm instanceof Promise) {
			const result = validatedForm.then((validatedForm) => validatedForm?.[fieldName]);
			return result;
		} else {
			const result = validatedForm?.[fieldName];
			return result;
		}
	};

	const reduceFields = combineReducers(
		Object.fromEntries(
			Object.entries(fieldsConfig).map((entry) => {
				const [fieldName, reducerFactory] = entry;
				const reducer = reducerFactory(() => validateField(fieldName))(fieldName);
				return [fieldName, reducer];
			}),
		),
	) as Reducer<FormFieldsState<TValues>, any>;

	const initialFormState: FormState<TValues> = {
		fields: reduceFields(undefined, INIT_ACTION),
		task: doNothing,
		canSubmit: undefined,
		submitting: false,
		submissionAttempts: 0,
	};

	const formReducer: FormReducer<TValues> = (state = initialFormState, msg) => {
		switch (msg.type) {
			case FormMsgT.Reset:
				return initialFormState;
			case FormMsgT.SubmissionInit:
				return { ...state, submitting: true, submissionAttempts: state.submissionAttempts + 1 };
			case FormMsgT.SubmissionDone:
				return { ...state, submitting: false };
		}

		ReducingFields: if (FieldMsg.match(msg)) {
			const values = Object.fromEntries(
				Object.values(state.fields).map((state) => {
					return (state as FieldState<any>).value;
				}),
			) as TValues;

			validate(values);

			const newFields = reduceFields(state.fields, msg);
			if (newFields === state.fields) {
				break ReducingFields;
			}

			const task: TaskFn = runOnce((taskApi) => {
				const results = Object.values(newFields).map((field) => field.task(taskApi));
				if (results.some((result) => result instanceof Promise)) {
					return Promise.allSettled(results).then(() => void 0);
				} else {
					return;
				}
			});

			return { ...state, task, fields: newFields };
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
					case FormMsgT.Reset:
						return defaultState;
				}
				return field;
			}
			const Msg = FieldMsgT;
			if (msg.name === field.name) {
				switch (msg.type) {
					case Msg.Changed:
						return reduceChange(field, msg);
					case Msg.Focused:
						return { ...field, wasFocusedOnce: true, isActive: true };
					case Msg.Blurred:
						return { ...field, wasBlurredOnce: true, isActive: false };
					case Msg.SetState:
						return msg.payload;
					case Msg.AsyncValidationInit:
						return { ...field, isValidating: true };
					case Msg.AsyncValidationDone:
						return { ...field, isValidating: false, message: msg.payload };
					case Msg.AsyncValidationFail:
						return { ...field, isValidating: false };
				}
			} else {
				switch (msg.type) {
					case Msg.Focused:
					case Msg.Changed:
						return { ...field, isActive: false };
				}
			}

			return field;
		};

		return fieldReducer;
	};

function createChangeReducer<TValue>(validate: ValidationFn<TValue> | undefined) {
	type S = FieldState<TValue>;
	type E = FieldMsg<TValue> | FormMsg;
	type EChanged = Extract<E, { type: FieldMsgT.Changed }>;

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
	const Ev = FieldMsgT;
	return runOnce(async (api) => {
		api.dispatch({ type: Ev.AsyncValidationInit, name });
		try {
			api.dispatch({ type: Ev.AsyncValidationDone, name, payload: await result });
		} catch (error) {
			api.dispatch({ type: Ev.AsyncValidationFail, name });
			throw error;
		}
	});
}

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

enum FormMsgT {
	Reset = "form/reset",
	SubmissionInit = "form/submission/init",
	SubmissionDone = "form/submission/done",
}
namespace FormMsg {
	export const match = (msg: { type: string }): msg is FormMsg => msg.type in FormMsgT;
}
type FormMsg<_T = any> = {} & (
	| Msg<FormMsgT.Reset>
	| Msg<FormMsgT.SubmissionInit>
	| Msg<FormMsgT.SubmissionDone>
);

enum FieldMsgT {
	AsyncValidationInit = "field/validation/init",
	AsyncValidationDone = "field/validation/done",
	AsyncValidationFail = "field/validation/fail",
	Changed = "field/changed",
	Blurred = "field/blurred",
	Focused = "field/focused",
	SetState = "field/setState",
}

namespace FieldMsg {
	export const match = (msg: { type: string }): msg is FieldMsg<any> => msg.type in FieldMsgT;
}
type FieldMsg<TValue> = { name: string } & (
	| Msg<FieldMsgT.AsyncValidationInit>
	| Msg<FieldMsgT.AsyncValidationDone, MsgPayload<ValidationMessage>>
	| Msg<FieldMsgT.AsyncValidationFail>
	| Msg<FieldMsgT.Changed, MsgPayload<TValue>>
	| Msg<FieldMsgT.Blurred>
	| Msg<FieldMsgT.Focused>
	| Msg<FieldMsgT.SetState, MsgPayload<FieldState<TValue>>>
);

type ValidationMessage = undefined | void | string;
type ValidationFn<TValue> = (value: TValue) => util.MaybePromise<ValidationMessage>;
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

type FieldReducerFactory<TValue> = (
	validate: ValidationFn<TValue>,
) => (fieldName: string) => FieldReducer<TValue>;

type FieldsConfig = {
	readonly [key: string]: FieldReducerFactory<unknown>;
};

type InferValues<F> = F extends FieldReducerFactory<infer T>
	? T
	: F extends FieldsConfig
		? { readonly [K in keyof F]: InferValues<F[K]> }
		: F;

interface FormOptions<TFields extends FieldsConfig, TValues = InferValues<TFields>> {
	fields: TFields;
	validate?: FormValidationFn<TValues>;
}

export {};

namespace util {
	export const isArray = Array.isArray;

	export const isFunction = <T>(value: T): value is T & Function => typeof value === "function";

	export type MaybePromise<T> = Promise<T> | T;
}
