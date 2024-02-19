interface ParseMode {
  consume(char: string): ParseMode;
}

let chars = {
  "!": {},
  "[": {},
  "`": {},
  "*": {},
};

let inSpanMode: ParseMode = (() => {
  return {
    consume(char) {
      return inSpanMode
    },
  };
})();

let normalMode: ParseMode = (() => {
  return {
    consume(char) {
      return normalMode
    },
  };
})();

let parse = (text: string) => {
  let mode: ParseMode = normalMode

  for (const char of text) {
    mode = mode.consume(char)
  }
};

console.log("Hello world!");
