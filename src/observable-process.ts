import * as childProcess from "child_process"
import mergeStream = require("merge-stream")
import * as util from "util"

import { Result } from "./result"
import { createSearchableStream, SearchableStream } from "./searchable-stream"
const delay = util.promisify(setTimeout)

/** a long-running process whose behavior can be observed at runtime */
export class ObservableProcess {
  /** the underlying ChildProcess instance */
  process: childProcess.ChildProcess

  /** populated when the process finishes */
  private result: Result | undefined

  /** the STDIN stream of the underlying ChildProcess */
  stdin: NodeJS.WritableStream

  /** searchable STDOUT stream of the underlying ChildProcess */
  stdout: SearchableStream

  /** searchable STDERR stream of the underlying ChildProcess */
  stderr: SearchableStream

  /** searchable combined STDOUT and STDERR stream */
  output: SearchableStream

  /** functions to call when this process ends  */
  private endedCallbacks: Array<(result: Result) => void>

  constructor(args: { cwd: string; env: NodeJS.ProcessEnv; params: string[]; runnable: string }) {
    this.endedCallbacks = []
    this.process = childProcess.spawn(args.runnable, args.params, {
      cwd: args.cwd,
      env: args.env,
    })
    this.process.on("close", this.onClose.bind(this))
    if (this.process.stdin == null) {
      throw new Error("process.stdin should not be null") // this exists only to make the typechecker shut up
    }
    this.stdin = this.process.stdin
    if (this.process.stdout == null) {
      throw new Error("process.stdout should not be null") // NOTE: this exists only to make the typechecker shut up
    }
    this.stdout = createSearchableStream(this.process.stdout)
    if (this.process.stderr == null) {
      throw new Error("process.stderr should not be null") // NOTE: this exists only to make the typechecker shut up
    }
    this.stderr = createSearchableStream(this.process.stderr)
    const outputStream = mergeStream(this.process.stdout, this.process.stderr)
    this.output = createSearchableStream(outputStream)
  }

  /** stops the currently running process */
  async kill(): Promise<Result> {
    this.result = {
      exitCode: -1,
      killed: true,
      stdText: this.stdout.fullText(),
      errText: this.stderr.fullText(),
      combinedText: this.output.fullText(),
    }
    this.process.kill()
    await delay(1)
    return this.result
  }

  /** returns the process ID of the underlying ChildProcess */
  pid(): number {
    return this.process.pid
  }

  /** returns a promise that resolves when the underlying ChildProcess terminates */
  async waitForEnd(): Promise<Result> {
    if (this.result) {
      return this.result
    }
    return new Promise((resolve) => {
      this.endedCallbacks.push(resolve)
    })
  }

  /** called when the underlying ChildProcess terminates */
  private onClose(exitCode: number) {
    this.result = {
      exitCode,
      killed: false,
      stdText: this.stdout.fullText(),
      errText: this.stderr.fullText(),
      combinedText: this.output.fullText(),
    }
    for (const endedCallback of this.endedCallbacks) {
      endedCallback(this.result)
    }
  }
}
