/** Minimal logging abstraction so services don't hard-depend on `console`. */
export interface Logger {
  info(message: string, ...meta: unknown[]): void;
  error(message: string, ...meta: unknown[]): void;
}

export const consoleLogger: Logger = {
  info: (message, ...meta) => console.log(message, ...meta),
  error: (message, ...meta) => console.error(message, ...meta),
};
