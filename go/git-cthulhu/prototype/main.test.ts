import { test, expect, describe } from "bun:test";
import * as yaml from "yaml";
import { DrawGraph, Git } from "./main";

const specFile = "../spec/DrawGraph.yaml";

type TestCase = {
  case: string;
  want: string[];
  given: Pick<Git.Commit, "parents">[];
};

describe("DrawGraph()", async () => {
  const specs: TestCase[] = yaml.parse(await Bun.file(specFile).text());

  for (const spec of specs) {
    test(spec.case, () => {
      expect(DrawGraph({ commits: []})).toEqual(spec.want);
    });
  }

  expect(true);
});
