interface Context<N> {
    idx: number;
    readonly builder: Builder<N>;
}

// interface Parser<N> {
//   parse: (text: string, context: Context<N>) => Parser<N>;
// }

interface Builder<N> {
    createNode: (type: string, children: Nodes<N>) => N;
}

type Nodes<N> = Array<N | string>;

const { keys } = Object;

function createParser<N>(builder: Builder<N>) {
    /**
     * @returns {N}
     */
    return (text: string) => {};
}

function normal<N>(text: string, ctx: Context<N>) {
    if (text.length - ctx.idx <= 3) {
        return ctx.builder.createNode("normal", [text]);
    }

    let nodes: Nodes<N> = [];

    for (; ctx.idx < text.length; ctx.idx++) {
        let char = text[ctx.idx];
        let parser: Parser<N> | undefined;
        switch (char) {
            case "*": {
                parser = emphasis;
                break;
            }
            case "[": {
                parser = link;
                break;
            }
        }
        if (!parser) {
            continue;
        }
        let node = parser(text, ctx);
        if (node) {
            nodes.push(node);
        }
    }

    return ctx.builder.createNode("normal", nodes);
}

type Parser<N> = (text: string, ctx: Context<N>) => N | null;

function emphasis<N>(text: string, ctx: Context<N>): N | null {
    for (; ctx.idx < text.length; ctx.idx++) {}

    return ctx.builder.createNode("bold", []);
}

function italic<N>(text: string, ctx: Context<N>): N {
    for (; ctx.idx < text.length; ctx.idx++) {}

    return ctx.builder.createNode("italic", []);
}

function bold<N>(text: string, ctx: Context<N>): N {
    for (; ctx.idx < text.length; ctx.idx++) {}

    return ctx.builder.createNode("bold", []);
}

function link<N>(text: string, ctx: Context<N>): N {
    for (; ctx.idx < text.length; ctx.idx++) {}

    return ctx.builder.createNode("link", []);
}

export {};
