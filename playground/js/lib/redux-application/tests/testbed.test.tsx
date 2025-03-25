import { describe, test, expect } from "bun:test";
import { render, screen, act, waitFor } from "@testing-library/react";
import {
  Boundry,
  sleep,
  Await,
  SusFallbackEl,
  ErrFallbackEl,
  silenceExpectedConsoleError,
} from "./test-utils";

silenceExpectedConsoleError();

test("render", async () => {
  await act(() => render(<Boundry children={<div data-testid="content" />} />));
  expect(screen.getByTestId("content")).toBeInTheDocument();
});

test("suspends and resumes", async () => {
  const time = sleep(50).then(() => <div data-testid="content" />);
  await act(() => render(<Boundry children={<Await the={time} />} />));
  const fallback = screen.getByTestId(SusFallbackEl);
  expect(fallback).toBeInTheDocument();
  const content = await waitFor(() => screen.findByTestId("content"));
  expect(content).toBeInTheDocument();
});

test("catches", async () => {
  const error = Promise.reject(new Error("Expected"));
  await act(() => render(<Boundry children={<Await the={error} />} />));
  expect(screen.getByTestId(ErrFallbackEl)).toBeInTheDocument();
});
