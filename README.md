# ObservableProcess

[![CircleCI](https://circleci.com/gh/kevgo/observable-process/tree/master.svg?style=shield)](https://circleci.com/gh/kevgo/observable-process/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/kevgo/observable-process/badge.svg?branch=master)](https://coveralls.io/github/kevgo/observable-process?branch=master)

ObservableProcess decorates the low-level
[Node.JS ChildProcess](https://nodejs.org/api/child_process.html) model with
functionality to observe the behavior of long-running processes more
conveniently. In particular:

- easier access to the complete textual content of the
  [stdout](https://nodejs.org/api/child_process.html#child_process_subprocess_stdout)
  and
  [stderr](https://nodejs.org/api/child_process.html#child_process_subprocess_stderr)
  streams
- augments `stdout` and `stderr` with methods to search for textual content
- create a new `output` stream that combines `stdout` and `stderr`
- await the process end
- easier access to the process exit code
- signals whether the process ended naturally or was manually terminated

This is helpful in many situations, for example in testing.

## Setup

Add this library to your code base:

```shell
$ npm install observable-process
```

Load this library into your JavaScript code:

```js
const { createObservableProcess } = require("observable-process")
```

&ndash; or &ndash;

```ts
import { createObservableProcess } from "observable-process"
```

## Starting processes

The best (most idiot-proof) way to start a subprocess is by providing the argv
array:

```js
const observable = createObservableProcess(["node", "server.js"])
```

You can also provide the full command line to run as a string:

```js
const observable = createObservableProcess("node server.js")
```

By default, the process runs in the current directory. To set the different
working directory for the subprocess:

```js
const observable = createObservableProcess("node server.js", { cwd: "~/tmp" })
```

You can provide custom environment variables for the process:

```js
const observable = createObservableProcess("node server.js", {
  env: { foo: "bar", PATH: process.env.PATH }
})
```

Without a custom `env` parameter, ObservableProcess uses the environment
variables from the parent process.

## Reading output from the process

The `stdout` and `stderr` variables of an ObservableProcess behave like normal
[readable streams](https://nodejs.org/api/stream.html#stream_readable_streams)
but are decorated with extra functionality to access and search their content.

```js
// normal access to STDOUT
observable.stdout.on("data", function() {
  // do something here
})

// get all content from STDOUT as a string
const text = observable.stdout.fullText()

// wait for text to appear in STDOUT
await observable.stdout.waitForText("server is online")

// wait for a regex on STDOUT
const port = await observable.stdout.waitForRegex(/running at port \d+./)
// => "running at port 3000."
```

Comparable functionality is available for STDERR. In addition, ObservableProcess
creates a new `output` stream with the combined content of STDOUT and STDERR:

```js
observable.output.on("data", function(data) {
  // do something here
})
const text = observable.output.fullText()
await observable.output.waitForText("server is online")
const port = await observable.output.waitForRegex(/running at port \d+./)
```

## Sending input to the process

ObservableProcess exposes the
[stdin](https://nodejs.org/api/child_process.html#child_process_subprocess_stdin)
stream of its underlying
[ChildProcess](https://nodejs.org/api/child_process.html):

```js
observable.stdin.write("my input\n")
observable.stdin.end()
```

## Get the process id

```
observable.pid()
```

## Stop the process

You can manually stop a running process via:

```js
await observable.kill()
```

This sets the `killed` property on the ObservableProcess instance, which allows
to distinguish manually terminated processes from naturally ended ones. To let
ObservableProcess notify you when a process ended:

```js
const exitCode = await observable.waitForEnd()
```

or in the background:

```js
observable.waitForEnd().then(...)
```

The exit code is available at the process object:

```js
observable.exitCode
```

## Related libraries

- [nexpect](https://github.com/nodejitsu/nexpect): Allows to define expectations
  on command output, and send it input, but doesn't allow to add more listeners
  to existing long-running processes, which makes declarative testing hard.

## Development

- run all tests: `make test`
- run unit tests: `make unit`
- run linters: `make lint`
- run automated code repair: `make fix`
- see all make commands: `make help`

To deploy a new version:

- update the version in `package.json` and commit to `master`
- run `npm publish`
