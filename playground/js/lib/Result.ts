export type Result<T, E> = Result.Ok<T, E> | Result.Fail<T, E>;

export namespace Result {
	const tag = Symbol();
	const ok = Symbol();
	const fail = Symbol();
	const result = Symbol();
	export type Ok<T, E> = {
		[result]: T;
		[tag]: typeof ok;
	} & (T extends object ? T : {});
	export type Fail<T, E> = {
		[result]: E;
		[tag]: typeof fail;
	} & (E extends object ? E : {});

	export const isOk = <T, E>(r: Result<T, E>): r is Ok<T, E> => r[tag] === ok;
	export const isFail = <T, E>(r: Result<T, E>): r is Fail<T, E> => r[tag] === fail;
	export const unwrap: {
		<T, E>(r: Ok<T, E>): T;
		<T, E>(r: Fail<T, E>): E;
	} = (r) => r[result];
}
