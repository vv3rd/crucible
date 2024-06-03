import { memoLast } from "./memoLast";
import { doNothing, runOnce } from "./utils";

export function createFormReducer<TFields extends Fields>(
	options: FormOptions<TFields>,
): FormReducer<InferValues<TFields>> {
	const { fields: topFields, validate = () => ({}) } = options;

	const memoValidate = memoLast(validate);

	// TODO: deeply combine fields reducers
	throw new Error("not implemented");

	function createReducerObject() {
		Object.fromEntries(Object.entries(topFields).map(([name, factory]) => {
			factory(name, value => memoValidate)
			return []
		}))
	}
}

export function createFieldReducer<TValue>(
	fieldName: string,
	defaultValue: TValue,
	validate: ValidationFn<TValue> = doNothing,
) {
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
}

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
): TaskFn<TValue> {
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

type TaskFn<V> = (taskApi: TaskAPI<V>) => void | Promise<void>;
type TaskAPI<V> = {
	dispatch: (msg: FormMsg | FieldMsg<V>) => void;
};

interface FieldInternals<TValue> {
	task: TaskFn<TValue>;
}
interface FieldFlags {
	wasModifiedOnce: boolean;
	wasFocusedOnce: boolean;
	wasBlurredOnce: boolean;
	isValidating: boolean;
	isActive: boolean;
}
interface FieldState<TValue> extends FieldInternals<TValue>, FieldFlags {
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
type ValidationFn<TValue> = (value: TValue) => ValidationMessage | Promise<ValidationMessage>;

interface FormFlags {
	canSubmit: ValidationMessage;
	submitting: boolean;
	submissionAttempts: number;
}

interface FormState<TFields> extends FormFlags {
	fields: {
		[K in keyof TFields]: FieldState<TFields[K]>;
	};
}

interface FormAPI<_TFields> {
	reset: () => void;
	submit: () => void;
}

type FormReducer<TValues> = (state: FormState<TValues>, msg: FormMsg) => FormState<TValues>;

type FieldReducer<TValue> = (
	state: FieldState<TValue> | undefined,
	msg: FieldMsg<TValue> | FormMsg,
) => FieldState<TValue>;

type FieldReducerFactory<TValue> = (
	fieldName: string,
	validate: ValidationFn<TValue> | undefined,
) => FieldReducer<TValue>;

type Fields = {
	readonly [key: string]: FieldReducerFactory<unknown>;
};

type InferValues<F> = F extends FieldReducerFactory<infer T>
	? T
	: F extends Fields
		? { readonly [K in keyof F]: InferValues<F[K]> }
		: F;

interface FormOptions<TFields extends Fields, TValues = InferValues<TFields>> {
	fields: TFields;
	onSubmit: (values: TValues, formApi: FormAPI<TValues>) => any | Promise<any>;
	onSubmitInvalid?: (values: TValues, formApi: FormAPI<TValues>) => void;
	validate?: ValidationFn<TValues>;
}

export {};

namespace util {
	export const isArray = Array.isArray;

	export const isFunction = <T>(value: T): value is T & Function => typeof value === "function";
}
