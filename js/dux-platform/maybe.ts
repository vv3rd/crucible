export type Maybe<T extends {}> = Nothing | Something<T>;

export namespace Maybe {
  export const map =
    <T extends {}, U>(mapper: (value: T) => U) =>
    (maybe: Maybe<T>) => {
      return maybe.andThen(mapper);
    };

  export const from = <T,>(
    thing: T | Maybe<NonNullable<T>>,
  ): Maybe<NonNullable<T>> => {
    if (isMaybe(thing)) {
      return thing;
    } else if (typeof thing != undefined) {
      return new Something(thing!);
    } else {
      return new Nothing();
    }
  };

  export const isMaybe = (thing: unknown): thing is Maybe<{}> => {
    return thing instanceof Something || thing instanceof Nothing;
  };

  export const isSomething = <T extends {}>(
    thing: Maybe<T>,
  ): thing is Something<T> => thing instanceof Something;

  export const isNothing = <T extends {}>(thing: Maybe<T>): thing is Nothing =>
    thing instanceof Nothing;
}

class Something<T> {
  constructor(private __value: T) {}
  toValue() {
    return this.__value;
  }
  andThen<U>(
    executor: (value: T) => U | Maybe<NonNullable<U>>,
  ): Maybe<NonNullable<U>> {
    return Maybe.from(executor(this.toValue()));
  }
}

class Nothing {
  static #instance: Nothing | undefined;
  constructor() {
    if (new.target.#instance) {
      return new.target.#instance;
    } else {
      return (new.target.#instance = new Nothing());
    }
  }
  toValue() {
    return undefined;
  }
  andThen() {
    return this;
  }
}
