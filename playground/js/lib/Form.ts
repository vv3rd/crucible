import { combineReducers } from "redux";

const { fromEntries, entries } = Object;

export function createFormReducer<TValues extends Form.Values>(
	options: Form.Options<TValues>,
): Form.Reducer<TValues> {
	type ItsTaskApi = TaskAPI<TValues>;
	// type ItsTaskFn = TaskFn<TValues>;
	type ItsFieldState = Form.FieldsState<TValues>;
	type ItsFormMsg = Form.Msg<TValues>;
	type ItsFormState = Form.State<TValues>;
	// type ItsNamedMsg = Field.NamedMsg<TValues>;
	type ItsFormReducer = Form.Reducer<TValues>;

	const {
		init: fieldsConfig,
		check: checkForm,
		submit: submitForm,
		//
	} = options;

	// TODO: had an idea to allow custom reducers for values (not for fields)
	// and to make it so types include extra messages that can be
	// sent to value reducers
	const reduceFields = combineReducers(
		fromEntries(
			entries(
				fieldsConfig /* FIXME: there's an error here, fieldsConfig is a function */,
			).map(([name, factory]) => [name, factory(name)]),
		) satisfies {
			[key: string]: Field.Reducer<any>;
		},
	) as Reducer<ItsFieldState, ItsFormMsg | Field.Msg<unknown>>;

	const initialFormState: ItsFormState = {
		fields: reduceFields(undefined, { type: Field.MsgType.Init }),
		notes: {},
		task: undefined,
		isSubmitting: false,
		isValidating: false,
		submitAttemt: 0,
	};

	const formReducer: ItsFormReducer = (
		state = initialFormState,
		msg,
	): ItsFormState => {
		switch (msg.type) {
			case Form.MsgType.Reset:
				return initialFormState;
			case Form.MsgType.SubmitInit: {
				if (state.isSubmitting) {
					return state;
				}
				const { notes, task } = wrapCheckResult(
					checkForm(collectValues(state.fields), msg),
				);

				// TODO: must check if submit is allowed
				// and maybe setup submit task instead of

				return {
					...state,
					notes,
					task,
					isSubmitting: true,
					submitAttemt: state.submitAttemt + 1,
				};
			}
			case Form.MsgType.SubmitDone: {
				let notes = msg.payload;
				if (notes) notes = { ...state.notes, ...notes };
				else notes = state.notes;
				return {
					...state,
					notes,
					isSubmitting: false,
				};
			}
			case Form.MsgType.TaskInit:
				return { ...state, isValidating: true };
			case Form.MsgType.TaskFail:
				return { ...state, isValidating: false };
			case Form.MsgType.TaskDone: {
				let notes = msg.payload;
				if (notes) notes = { ...state.notes, ...notes };
				else notes = state.notes;
				return { ...state, isValidating: false, notes };
			}
		}

		if (Field.Msg.match(msg)) {
			const msgWithForm = { ...msg, form: state };
			msg = msgWithForm;

			const fields = reduceFields(state.fields, msg);

			const checkResult = checkForm(collectValues(fields), msg);

			if (!checkResult) {
				if (fields === state.fields) return state;
				else return { ...state, fields: fields };
			} else {
				const { task, notes } = wrapCheckResult(checkResult);
				return { ...state, task, notes, fields: fields };
			}
		}

		return state;

		function wrapCheckResult(checkResult: void | Form.CheckResult<TValues>) {
			let { notes, task } = checkResult ?? {};
			if (task) task = wrapCheckTask(task);
			if (!notes) notes = {};
			return { notes, task };
		}

		function wrapCheckTask(task: Form.CheckTask<TValues>) {
			return async (api: ItsTaskApi) => {
				const output = task(api);
				if (!(output instanceof Promise) && output) {
					api.dispatch({ type: Form.MsgType.TaskDone, payload: output });
					return;
				}

				api.dispatch({ type: Form.MsgType.TaskInit });
				try {
					const payload = await output;
					api.dispatch({ type: Form.MsgType.TaskDone, payload });
				} catch (error) {
					api.dispatch({ type: Form.MsgType.TaskFail });
					throw error;
				}
			};
		}

		function collectValues(fields: Form.FieldsState<TValues>) {
			return fromEntries(
				entries(fields).map(([fieldName, fieldState]) => [
					fieldName,
					fieldState.value,
				]),
			) as TValues;
		}
	};

	formReducer.initialize = (values: TValues) =>
		formReducer(undefined, {
			type: Form.MsgType.Init,
			payload: values,
		});

	return formReducer;
}

export function createFieldReducer<TValue>(
	fieldName: string,
	defaultValue: TValue,
) {
	const defaultState: Field.State<TValue> = {
		name: fieldName,
		value: defaultValue,
		notes: [],
		isActive: false,
		isValidating: false,
		modifiedAt: -1,
		focusedAt: -1,
		blurredAt: -1,
	};

	const fieldReducer: Field.Reducer<TValue> = (
		field = defaultState,
		msg,
	): Field.State<TValue> => {
		if (msg.type === Field.MsgType.Init) {
			return field;
		}
		if (msg.name === field.name) {
			const attempt = msg.form?.submitAttemt ?? 0;
			switch (msg.type) {
				case Field.MsgType.Changed: {
					const value = msg.payload;
					return { ...field, modifiedAt: attempt, isActive: true, value };
				}
				case Field.MsgType.Focused:
					return { ...field, focusedAt: attempt, isActive: true };
				case Field.MsgType.Blurred:
					return { ...field, blurredAt: attempt, isActive: false };
				case Field.MsgType.SetState:
					const next = msg.payload;
					return {
						name: field.name,
						value: next.value,
						notes: next.notes,
						modifiedAt: next.modifiedAt,
						focusedAt: next.focusedAt,
						blurredAt: next.blurredAt,
						isValidating: next.isValidating,
						isActive: next.isActive,
					};
			}
		} else {
			switch (msg.type) {
				case Field.MsgType.Focused:
				case Field.MsgType.Changed:
					if (field.isActive) return { ...field, isActive: false };
			}
		}

		return field;
	};

	return fieldReducer;
}

interface Message<T> {
	type: T;
}

interface MessageWithPayload<T, P> {
	type: T;
	payload: P;
}

interface Reducer<S, A> {
	(state: S | undefined, msg: A): S;
}

interface Note {
	level: number;
	text: string;
}

type TaskFn<TValues extends Form.Values> = (
	taskApi: TaskAPI<TValues>,
) => util.MaybePromise<unknown>;
type TaskAPI<TValues extends Form.Values> = {
	signal: AbortSignal;
	dispatch: (msg: Form.Msg | Field.NamedMsg<TValues>) => void;
	getState: () => Form.State<TValues>;
};

export namespace FieldGroup {
	// TODO: conceive of array fields
	// interface State {}
}

export namespace Field {
	export interface Flags {
		modifiedAt: Form.SubmitAttempt;
		focusedAt: Form.SubmitAttempt;
		blurredAt: Form.SubmitAttempt;
		isValidating: boolean;
		isActive: boolean;
	}
	export interface State<TValue> extends Flags {
		name: string;
		value: TValue;
		notes: Note[];
	}

	export type CheckResult = undefined | void | string | Note;

	export enum MsgType {
		Init = "fielD/init",
		Changed = "fielD/changed",
		Blurred = "fielD/blurred",
		Focused = "fielD/focused",
		SetState = "fielD/setState",
	}
	export namespace Msg {
		export const match = (msg: { type: string }): msg is Msg<any> =>
			msg.type in MsgType;
	}

	export type Msg<TValue> =
		| ({
				name: string;
				form?: Form.Flags;
		  } & (
				| MessageWithPayload<MsgType.Changed, TValue>
				| Message<MsgType.Blurred>
				| Message<MsgType.Focused>
				| MessageWithPayload<MsgType.SetState, Field.State<TValue>>
		  ))
		| Message<MsgType.Init>;

	export type NamedMsg<TValues extends Form.Values> = {
		[K in keyof TValues]: Field.Msg<TValues[K]> & { name: K };
	}[keyof TValues];

	export type Reducer<TValue> = (
		state: State<TValue> | undefined,
		msg: Msg<TValue>,
	) => State<TValue>;

	export type ReducerFactory<TValue> = (fieldName: string) => Reducer<TValue>;
}

export namespace Form {
	export type SubmitAttempt = number;

	export interface Flags {
		isValidating: boolean;
		isSubmitting: boolean;
		submitAttemt: SubmitAttempt;
	}
	export interface State<TValues extends Values> extends Flags {
		fields: FieldsState<TValues>;
		notes: NonNullable<CheckNotes<TValues>>;
		task: undefined | TaskFn<TValues>;
	}
	export type FieldsState<TFields> = {
		[K in keyof TFields]: Field.State<TFields[K]>;
	};

	type SubmitMsg<TValues extends Values> = Extract<
		Msg<TValues>,
		Message<MsgType.SubmitInit>
	>;

	export type CheckerFn<TValues extends Values> = (
		values: TValues,
		msg: Field.NamedMsg<TValues> | SubmitMsg<TValues>,
	) => void | CheckResult<TValues>;

	export type CheckTask<TValues extends Values> = (
		taskApi: TaskAPI<TValues>,
	) => util.MaybePromise<void | CheckNotes<TValues>>;

	export type CheckResult<TValues extends Values> = {
		notes?: CheckNotes<TValues>;
		task?: CheckTask<TValues>;
	};

	export type CheckNotes<TValues> = {
		[K in keyof TValues]?: Field.CheckResult;
	};

	export enum MsgType {
		Init = "forM/init",
		Reset = "forM/reset",
		SubmitInit = "forM/submit/init",
		SubmitDone = "forM/submit/done",
		TaskInit = "forM/task/init",
		TaskDone = "forM/task/done",
		TaskFail = "forM/task/fail",
		TaskStop = "forM/task/stop",
	}
	export namespace Msg {
		export const match = (msg: { type: string }): msg is Msg =>
			msg.type in MsgType;
	}
	export type Msg<T = any> = {} & (
		| MessageWithPayload<MsgType.Init, T>
		| Message<MsgType.Reset>
		| Message<MsgType.SubmitInit>
		| MessageWithPayload<MsgType.SubmitDone, void | CheckNotes<T>>
		| Message<MsgType.TaskInit>
		| MessageWithPayload<MsgType.TaskDone, void | CheckNotes<T>>
		| Message<MsgType.TaskFail>
	);

	export interface Reducer<TValues extends Values> {
		(
			state: State<TValues> | undefined,
			msg: Msg<TValues> | Field.NamedMsg<TValues>,
		): State<TValues>;
		initialize: (defaultValues: TValues) => State<TValues>;
	}

	export type Values = {
		readonly [key: string]: any;
	};

	type FieldsConfig<TValues extends Values> = {
		readonly [K in keyof TValues]: Field.ReducerFactory<TValues[K]>;
	};

	export type SubmitFn<TValues extends Values> = (
		values: TValues,
		api: TaskAPI<TValues>,
	) => util.MaybePromise<void | CheckNotes<TValues>>;

	export interface Options<TValues extends Values> {
		init: () => FieldsConfig<TValues>;
		check: Form.CheckerFn<TValues>;
		submit: SubmitFn<TValues>;
	}
}

namespace util {
	export type MaybePromise<T> = Promise<T> | T;

	export const isArray = Array.isArray;

	export const isString = (value: unknown): value is string =>
		typeof value === "string";

	export const isReal = (value: unknown): value is {} => value != null;
}
