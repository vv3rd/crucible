import { expect, describe, test } from "bun:test";
import {render, screen} from '@testing-library/react'
import { App } from "./App";

describe("App", () => {
  test("render", () => {
    render(<App />)
    expect(screen.getByText(/Hello/)).toBeInTheDocument()
  });
});
