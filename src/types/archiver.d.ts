declare module 'archiver' {
  import { Stream } from 'node:stream';
  interface Archiver extends Stream {
    pipe(dest: NodeJS.WritableStream): void;
    file(path: string, opts: { name: string }): void;
    finalize(): void;
  }
  function archiver(format: string, options?: Record<string, unknown>): Archiver;
  export default archiver;
}
