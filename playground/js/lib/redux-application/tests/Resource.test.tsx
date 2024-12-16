import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { render, screen, act, waitFor } from "@testing-library/react";
import { Component, PropsWithChildren, ReactNode, Suspense, use } from "react";
import { Await, Catch, sleep } from "./test-utils";

test("Resource", () => {
  expect(true).toBe(true);
});
