import { expect, describe, test } from "bun:test";
import { render, screen, act } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  test("render", async () => {
    await act(() => render(<App />));
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });
});
