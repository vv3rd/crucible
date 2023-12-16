import { WithChildren } from "../HtmlNode";
import { AtRoot } from "./AtRoot";

export function AtMain({ children }: WithChildren) {
  return (
    <AtRoot>
      <header class={"h-20"}></header>
      <main class={"container mx-auto"}>{children}</main>
      <footer></footer>
    </AtRoot>
  );
}
