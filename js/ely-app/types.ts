import { TokenType, TokenValue } from "brandi";
import { Action } from "redux";

type HtmlNode =
  | JSX.Element
  | JSX.Element[]
  | number
  | boolean
  | undefined
  | null;

export type WithChildren<T = {}> = { children?: HtmlNode } & T;

export type HasResolver = { resolve: Resolver };
export type HasDispatcher = { dispatch: Dispatcher };
export type Resolver = <T extends TokenValue<unknown>>(
  token: T
) => TokenType<T>;
export type Dispatcher = (action: Action) => void;
