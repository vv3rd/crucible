declare global {
  const noop: () => void

  const neutral: <T>(thing: T) => T
}

Object.assign(globalThis, {
  noop: () => { },
  neutral: (_: any) => _
})

export { }