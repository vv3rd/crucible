import { test, expect } from "bun:test";
import { render, screen, act } from "@testing-library/react";
import { Boundry } from "./test-utils";
import { Fragment } from "react/jsx-runtime";

test("render", async () => {
  await act(() => render(<TestBed children={<TestComponent />} />));
  expect(screen.getByTestId("content")).toBeInTheDocument();
});

function TestBed({ children }: { children: React.ReactNode }) {
  return <Boundry>{children}</Boundry>;
}

function TestComponent() {
  return (
    <Fragment>
      {/*
       */}
    </Fragment>
  );
}
