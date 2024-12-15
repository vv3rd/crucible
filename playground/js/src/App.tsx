import { Suspense, use } from "react";

const timeout = new Promise<string>((resolve) =>
  setTimeout(() => resolve("foo"), 3000),
);

export function App() {
  return (
    <main>
      <h1>Hello from App</h1>
      <Suspense fallback={"Loading..."}>
        <Async />
      </Suspense>
    </main>
  );
}

function Async() {
  const string = use(timeout);

  return <div>{string}</div>;
}
