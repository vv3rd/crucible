const { fromEntries, entries } = Object;

// TODO: update types to allow custom value reducers with any message
export function createFormReducer<TValues extends Form.Values, TInitArg = void>(
    options: Form.Options<TValues, TInitArg>,
) {
    type ItsTaskControls = TaskAPI<TValues>;
    // type ItsTask = Task<TValues>;
    // type ItsFieldState = Form.FieldsState<TValues>;
    // type ItsFormMsg = Form.Msg<TValues>;
    type ItsFormState = Form.State<TValues>;
    // type ItsNamedMsg = Field.NamedMsg<TValues>;
    type ItsFormReducer = Form.OwnReducer<TValues, TInitArg>;

    const {
        init: initFields,
        check: checkForm,
        submit: submitForm,
        //
    } = options;

    const initialCommonState: Form.CommonState<TValues> = {
        notes: {},
        task: undefined,
        isValidating: false,
        isSubmitting: false,
        submitAttempt: 0,
    };

    const getInitialState = (input: TInitArg): ItsFormState => {
        const reduceFields = combineFields<TValues>(initFields(input));
        const initialFields = reduceFields(undefined, { type: Field.MsgType.Init });
        return {
            ...initialCommonState,
            reduceFields,
            initialFields,
            fields: initialFields,
        };
    };

    const formReducer: ItsFormReducer = (state, msg): ItsFormState => {
        switch (msg.type) {
            case Form.MsgType.Reset: {
                const { initialFields: fields, initialFields } = state;
                return { ...state, ...initialCommonState, fields, initialFields };
            }
            case Form.MsgType.Submit: {
                if (state.isSubmitting) {
                    return state;
                }
                let { notes, task } = wrapCheckResult(checkForm(collectValues(state.fields), msg));

                const submitTask = async (api: ItsTaskControls) => {
                    const values = collectValues(api.getState().fields);
                    const submitReturn = submitForm(values, api);
                    if (submitReturn instanceof Promise) {
                        try {
                            api.dispatch({ type: Form.MsgType.SubmitInit });
                            const payload = await submitReturn;
                            api.dispatch({ type: Form.MsgType.SubmitDone, payload });
                        } catch (error) {
                            api.dispatch({ type: Form.MsgType.SubmitFail });
                        }
                    } else if (submitReturn) {
                        const payload = submitReturn;
                        api.dispatch({ type: Form.MsgType.SubmitDone, payload });
                    }
                };

                if (task) {
                    const checkTask = task;
                    task = async (api) => {
                        await checkTask(api);
                        await submitTask(api);
                    };
                } else {
                    task = submitTask;
                }

                return { ...state, notes, task };
            }
            case Form.MsgType.SubmitInit:
                return {
                    ...state,
                    isSubmitting: true,
                    submitAttempt: state.submitAttempt + 1,
                };
            case Form.MsgType.SubmitFail:
                return { ...state, isSubmitting: false };
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
            case Form.MsgType.CheckInit:
                return { ...state, isValidating: true };
            case Form.MsgType.CheckFail:
            case Form.MsgType.CheckStop:
                return { ...state, isValidating: false };
            case Form.MsgType.CheckDone: {
                let notes = msg.payload;
                if (notes) notes = { ...state.notes, ...notes };
                else notes = state.notes;
                return { ...state, isValidating: false, notes };
            }
        }

        if (Field.Msg.match(msg)) {
            const msgWithForm = { ...msg, form: state };
            msg = msgWithForm;

            const fields = state.reduceFields(state.fields, msg);

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
            return async (api: ItsTaskControls) => {
                const output = task(api);
                if (!(output instanceof Promise) && output) {
                    api.dispatch({ type: Form.MsgType.CheckDone, payload: output });
                    return;
                }

                api.dispatch({ type: Form.MsgType.CheckInit });
                try {
                    const payload = await output;
                    api.dispatch({ type: Form.MsgType.CheckDone, payload });
                } catch (error) {
                    api.dispatch({ type: Form.MsgType.CheckFail });
                    throw error;
                }
            };
        }

        function collectValues(fields: Form.FieldsState<TValues>) {
            return fromEntries(
                entries(fields).map(([fieldName, fieldState]) => [fieldName, fieldState.value]),
            ) as TValues;
        }
    };

    formReducer.getInitialState = getInitialState;

    const actions = {
        changed: <N extends keyof TValues>(name: N, value: TValues[N]) =>
            ({
                type: Field.MsgType.Changed,
                name,
                payload: value,
            }) as const,
        focused: (name: keyof TValues) =>
            ({
                type: Field.MsgType.Focused,
                name,
            }) as const,
        blurred: (name: keyof TValues) =>
            ({
                type: Field.MsgType.Blurred,
                name,
            }) as const,
        submit: () =>
            ({
                type: Form.MsgType.Submit,
            }) as const,
        reset: () =>
            ({
                type: Form.MsgType.Reset,
            }) as const,
    };

    return { reducer: formReducer, actions };
}

export function createFieldReducer<TValue>(fieldName: string, defaultValue: TValue) {
    const getInitialState = (): Field.State<TValue> => ({
        name: fieldName,
        value: defaultValue,
        notes: [],
        isActive: false,
        isValidating: false,
        modifiedAt: -1,
        focusedAt: -1,
        blurredAt: -1,
    });

    const fieldReducer: Field.OwnReducer<TValue> = (
        field = getInitialState(),
        msg,
    ): Field.State<TValue> => {
        if (msg.type === Field.MsgType.Init) {
            return field;
        }
        if (msg.name === field.name) {
            const attempt = msg.form?.submitAttempt ?? 0;
            switch (msg.type) {
                case Field.MsgType.Changed: {
                    const value = msg.payload;
                    return { ...field, modifiedAt: attempt, isActive: true, value };
                }
                case Field.MsgType.Focused:
                    return { ...field, focusedAt: attempt, isActive: true };
                case Field.MsgType.Blurred:
                    return { ...field, blurredAt: attempt, isActive: false };
                case Field.MsgType.HardSet:
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

type Reducer<S, A> = {
    (state: S | undefined, msg: A): S;
};

interface Note {
    level: number;
    text: string;
}

type Task<TValues extends Form.Values> = (taskApi: TaskAPI<TValues>) => util.MaybePromise<unknown>;
type TaskAPI<TValues extends Form.Values> = {
    signal: AbortSignal;
    dispatch: (msg: Form.Msg<TValues> | Field.NamedMsg<TValues>) => void;
    getState: () => Form.State<TValues>;
};

export namespace Field {
    export interface Statuses {
        modifiedAt: Form.SubmitAttempt;
        focusedAt: Form.SubmitAttempt;
        blurredAt: Form.SubmitAttempt;
        isValidating: boolean;
        isActive: boolean;
    }
    export type State<TValue> = Statuses & {
        name: string;
        value: TValue;
        notes: Note[];
    };

    export type CheckResult = undefined | void | string | Note;

    export enum MsgType {
        Init = "field/init",
        Changed = "field/changed",
        Blurred = "field/blurred",
        Focused = "field/focused",
        HardSet = "field/hardSet",
    }
    export namespace Msg {
        export const match = (msg: { type: string }): msg is Msg<any> => msg.type in MsgType;
    }

    export type Msg<TValue> =
        | ({
              name: string;
              form?: Form.Statuses;
          } & (
              | MessageWithPayload<MsgType.Changed, TValue>
              | Message<MsgType.Blurred>
              | Message<MsgType.Focused>
              | MessageWithPayload<MsgType.HardSet, Field.State<TValue>>
          ))
        | Message<MsgType.Init>;

    export type NamedMsg<TValues extends Form.Values> = {
        [K in keyof TValues]: Field.Msg<TValues[K]> & { name: K };
    }[keyof TValues];

    export type OwnReducer<TValue> = (
        state: State<TValue> | undefined,
        msg: Msg<TValue>,
    ) => State<TValue>;

    export type ReducerFactory<TValue> = (fieldName: string) => OwnReducer<TValue>;
}

export namespace Form {
    export type SubmitAttempt = number;

    export interface Statuses {
        isValidating: boolean;
        isSubmitting: boolean;
        submitAttempt: SubmitAttempt;
    }
    export type CommonState<TValues extends Values> = Statuses & {
        notes: NonNullable<CheckNotes<TValues>>;
        task: undefined | Task<TValues>;
    };
    export type Fields<TValues extends Values> = {
        reduceFields: Reducer<FieldsState<TValues>, Field.NamedMsg<TValues>>;
        initialFields: FieldsState<TValues>;
        fields: FieldsState<TValues>;
    };
    export type State<TValues extends Values> = Fields<TValues> & CommonState<TValues>;

    export type FieldsState<TFields> = {
        [K in keyof TFields]: Field.State<TFields[K]>;
    };

    type SubmitMsg<TValues extends Values> = Extract<Msg<TValues>, Message<MsgType.Submit>>;

    export type CheckerFn<TValues extends Values> = (
        values: TValues,
        msg: Field.NamedMsg<TValues> | SubmitMsg<TValues>,
    ) => void | CheckResult<TValues>;

    export type CheckNotes<TValues> = {
        [K in keyof TValues]?: Field.CheckResult;
    };

    export type CheckTask<TValues extends Values> = (
        taskApi: TaskAPI<TValues>,
    ) => util.MaybePromise<void | CheckNotes<TValues>>;

    export type CheckResult<TValues extends Values> = {
        notes?: CheckNotes<TValues>;
        task?: CheckTask<TValues>;
    };

    export enum MsgType {
        Reset = "form/reset",
        Submit = "form/submit",
        SubmitInit = "form/submit/init",
        SubmitDone = "form/submit/done",
        SubmitFail = "form/submit/fail",
        CheckInit = "form/check/init",
        CheckDone = "form/check/done",
        CheckFail = "form/check/fail",
        CheckStop = "form/check/stop",
    }
    export namespace Msg {
        export const match = (msg: { type: string }): msg is Msg<any> => msg.type in MsgType;
    }
    export type Msg<T> = {} & (
        | Message<MsgType.Reset>
        | Message<MsgType.Submit>
        | Message<MsgType.SubmitInit>
        | Message<MsgType.SubmitFail>
        | MessageWithPayload<MsgType.SubmitDone, void | CheckNotes<T>>
        | Message<MsgType.CheckInit>
        | Message<MsgType.CheckFail>
        | Message<MsgType.CheckStop>
        | MessageWithPayload<MsgType.CheckDone, void | CheckNotes<T>>
    );

    export interface OwnReducer<TValues extends Values, TInitArg> {
        (state: State<TValues>, msg: Msg<TValues> | Field.NamedMsg<TValues>): State<TValues>;
        getInitialState: (defaultValues: TInitArg) => State<TValues>;
        // TODO: provide action creators
    }

    export type Values = {
        readonly [key: string]: any;
    };

    export type FieldsConfig<TValues extends Values> = {
        readonly [K in keyof TValues]: Field.ReducerFactory<TValues[K]>;
    };

    export type SubmitFn<TValues extends Values> = (
        values: TValues,
        api: TaskAPI<TValues>,
    ) => util.MaybePromise<void | CheckNotes<TValues>>;

    export type Options<TValues extends Values, TInitArg> = {
        init: (arg: TInitArg) => FieldsConfig<TValues>;
        check: Form.CheckerFn<TValues>;
        submit: SubmitFn<TValues>;
    };
}

namespace util {
    export type MaybePromise<T> = Promise<T> | T;

    export const isArray = Array.isArray;

    export const isString = (value: unknown): value is string => typeof value === "string";

    export const isReal = (value: unknown): value is {} => value != null;
}

// TODO: had an idea to allow custom reducers for values (not for fields)
// and to make it so types include extra messages that can be
// sent to value reducers
function combineFields<TValues extends Form.Values>(fields: Form.FieldsConfig<any>) {
    type State = Form.FieldsState<TValues>;
    type Msg = Field.Msg<TValues>;

    let mapper = ([key, factory]: [string, Field.ReducerFactory<unknown>]) =>
        [key, factory(key)] as const;

    if (import.meta.env.DEV) {
        mapper = ([key, factory]) => {
            console.assert(typeof key === "string", "Found non string key in init object");
            console.assert(factory instanceof Function, "Found non function value in init object");
            const reducer = factory(key);
            console.assert(reducer instanceof Function, "Reducer factory didn't return a function");
            return [key, reducer];
        };
    }

    const reducers = entries(fields).map(mapper);

    return function reduceFields(current: State | undefined, msg: Msg): State {
        let next: any = current;
        for (let [key, reducer] of reducers) {
            const fieldWas = current?.[key];
            const fieldNow = reducer(fieldWas, msg);
            if (fieldWas !== fieldNow) {
                if (next === current) {
                    next = { ...current };
                }
                next[key] = fieldNow;
            }
        }
        return next;
    };
}
