// eslint-disable-next-line no-promise-executor-return
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
