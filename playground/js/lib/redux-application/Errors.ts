// TODO: make errors helpful
export const FUCK_STORE_LOCKED = "Store is locked on dispatch";

export const FUCK_FINAL_INACCESSABLE = "Can't get final store until it's created";

export const FUCK_TASK_POOL_CLOSED = "Can't schedule task once reducer returned";

export const FUCK_TASK_NOT_REAL = "Task api on wire probe message is a stub";

export const FUCK_TASK_EXITED = "Task function completed, nextMessage rejects."
