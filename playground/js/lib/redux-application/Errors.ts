// TODO: make errors helpful
export const ERR_LOCKED_DISPATCH = (() => {
	let message = "Store is locked on dispatch";
	return message;
})();
export const ERR_LOCKED_GETSTATE = (() => {
	let message = "Store is locked on dispatch";
	return message;
})();
export const ERR_LOCKED_SUBSCRIBE = (() => {
	let message = "Store is locked on dispatch";
	return message;
})();
export const ERR_LOCKED_UNSUBSCRIBE = (() => {
	let message = "Store is locked on dispatch";
	return message;
})();
export const ERR_FINAL_USED_BEFORE_CREATED = (() => {
	let message = "Can't use final store before it is created";
	return message;
})();
export const ERR_SCHEDULER_USED_OUTSIDE_REDUCER = (() => {
	let message = "Scheduling tasks is only allowed within reducer execution";
	return message;
})();
