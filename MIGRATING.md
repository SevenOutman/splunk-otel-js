# Migrate from the SignalFx Tracing Library for NodeJS

The Splunk Distribution of OpenTelemetry for NodeJS replaces the SignalFx Tracing
Library for NodeJS. If you’re using the SignalFx Tracing Library, migrate to
the Splunk Distribution of OpenTelemetry for NodeJS to use OpenTelemetry
instrumentation to send traces to Splunk APM. The Splunk Distribution of
OpenTelemetry for NodeJS uses OpenTelemetry to instrument applications, which is
an open-source API to gather telemetry data, and has a smaller footprint.

Because the SignalFx Tracing Library for NodeJS uses OpenTracing and the Splunk Distribution of OpenTelemetry for NodeJS
uses OpenTelemetry, the semantic conventions for span names and attributes change when you migrate. For more
information, see
[Migrate from OpenTracing to OpenTelemetry](https://docs.signalfx.com/en/latest/apm/apm-getting-started/apm-opentelemetry-collector.html#apm-opentelemetry-migration).

## Getting help

If you experience any issues following the guide below, or something is unclear, or missing, please don't hesitate to
open an issue in Github. Any and all ideas for improvements are also welcome.

<a name="known-limitations"></a>
## Known limitations as compared to SignalFx Tracing Library

- Different subset of supported Node.js versions, see [Requirements section](#requirements) for more information.
- No auto-instrumentation for:
  - `AdonisJS`,
  - `amqp10`,
  - `mongodb-core` ([because it's deprecated](https://github.com/mongodb-js/mongodb-core)), but note that there is
    [an instrumentation for MongoDB driver](https://opentelemetry.io/registry/?s=mongodb&component=&language=js#),
  - `sails`.
- Limited instrumentation for:
  - `nest` - only manual instrumentation helpers, provided by community.
- Other notes on instrumentation:
  - `express`, `koa` and `hapi` instrumentations require active `http`/`https` instrumentation to produce spans,
  - `bluebird`, `q`, `when` - supported out-of-the-box via `AsyncLocalStorageContextManager` (or `AsyncHooksContextManager` in Node.js below `14.8`),
  - `socket.io` - provided by community and improved by Splunk (<https://github.com/aspecto-io/opentelemetry-ext-js/tree/master/packages/instrumentation-socket.io>).

## Changes to defaults

- Default flush interval, which defines how frequently captured telemetry data is sent to the backend, is now 30s instead of 2s

## Requirements

This Splunk Distribution of OpenTelemetry requires Node.js 8.5 or later,
[see more information here](https://github.com/open-telemetry/opentelemetry-js#node-support)
If you're still using an earlier version of Node.js, continue using the SignalFx Tracing Library for Node.js.

Current effective required Node.js version is: ![node-current](https://img.shields.io/node/v/@splunk/otel?style=flat-square)

## Migration steps

### Instrumented libraries

With the exception of [explicitly listed limitations](#known-limitations) we aim to support all libraries supported by
signalfx-nodejs-tracing. To find an equivalent auto-instrumentation open <https://opentelemetry.io/registry/> and for
each instrumentation
[from `signalfx-nodejs-tracing`'s README](https://github.com/signalfx/signalfx-nodejs-tracing/#requirements-and-supported-software)
search by the name of the library in the registry.

For example, if you'd like to migrate instrumentation for `mysql`, go to
[https://opentelemetry.io/registry/?s=**mysql**&component=&language=**js**#](https://opentelemetry.io/registry/?s=mysql&component=&language=js#).

Once you have identified an instrumentation package, **install it** using npm or Yarn.

- If the package is [on this list](./README.md#default-instrumentation-packages-), it
  will be enabled automatically (**but it won't be installed automatically**).
- if it's not on the list, follow the steps for
  [installing other instrumentation packages](./README.md#custom-instrumentation-packages).

### Environment variables

Rename environment variables:

| OpenTracing environment variable   | OpenTelemetry environment variable   | notes |
| ---------------------------------- | ------------------------------------ | ----- |
| SIGNALFX_ACCESS_TOKEN              | SPLUNK_ACCESS_TOKEN                  |       |
| SIGNALFX_SERVICE_NAME              | OTEL_SERVICE_NAME                    |       |
| SIGNALFX_ENDPOINT_URL              | OTEL_EXPORTER_JAEGER_ENDPOINT        | if Jaeger is used |
| SIGNALFX_ENDPOINT_URL              | n/a                                  | OTLP is not implemented yet |
| SIGNALFX_RECORDED_VALUE_MAX_LENGTH | SPLUNK_MAX_ATTR_LENGTH               |       |
| SIGNALFX_TRACING_DEBUG             | no direct equivalent                 | see [instrumentation logs](#instrumentation-logs) |
| SIGNALFX_SPAN_TAGS                 | OTEL_RESOURCE_ATTRIBUTES             | format needs to be changed to `key1=val1,key2=val2` |
| SIGNALFX_LOGS_INJECTION            | SPLUNK_LOGS_INJECTION                | |
| SIGNALFX_LOGS_INJECTION_TAGS       | OTEL_RESOURCE_ATTRIBUTES             | there's no direct equivalent, but values specified in `OTEL_RESOURCE_ATTRIBUTES` will also be used for logs injection |
| SIGNALFX_ENABLED_PLUGINS           | n/a                                  | see [the README section about instrumentations](./README.md#custom-instrumentation-packages) |
| SIGNALFX_SERVER_TIMING_CONTEXT     | SPLUNK_TRACE_RESPONSE_HEADER_ENABLED | |
| SIGNALFX_TRACING_ENABLED           | OTEL_TRACE_ENABLED                   | |

### Programmatic configuration

Update these programmatic configuration options:

| OpenTracing property     | OpenTelemetry property  | Notes |
| ------------------------ | ----------------------- | ----- |
| `service`                | `serviceName`           |       |
| `url`                    | `endpoint`              |       |
| `accessToken`            | `accessToken`           |       |
| `enabled`                | -                       | no equivalent, but Environment Variable can be used |
| `debug`                  | -                       | no direct equivalent, see [instrumentation logs](#instrumentation-logs) |
| `tags`                   | `tracerConfig.resource` | |
| `logInjection`           | `logInjectionEnabled`   | |
| `logInjectionTags`       | -                       | no direct equivalent, but `tracerConfig.resource` can be used |
| `flushInterval`          | -                       | no direct equivalent, contact us if you had customized this value |
| `plugins`                | -                       | see [the README section about instrumentations](./README.md#custom-instrumentation-packages) |
| `recordedValueMaxLength` | `maxAttrLength`         | |
| `enableServerTiming`     | `serverTimingEnabled`   | |

### Instrumentation entry point

```javascript
const tracer = require('signalfx-tracing').init({
  // your options here
})
```

becomes

```javascript
const { startTracing } = require('@splunk/otel');

startTracing({
  // your new options here
});
```

and requires installing `@splunk/otel` first, using either npm or Yarn. Same as in `signalfx-nodejs-tracing`, this code
is to be run before your `import` or `require` statements.

Alternatively, you can append the flag `-r @splunk/otel/instrument` instead when launching `node` (it runs
`startTracing` under the hood). In that case you cannot use programmatic configuration and must rely on environment
variables only.

### Instrumentation logs

There isn't a one-to-one mapping for `SIGNALFX_TRACING_DEBUG`. The closest equivalent is `OTEL_LOG_LEVEL`, however the
logged information will be different.

> Note that this section is about the logs produced by instrumentation, and not
about the logs produced by the application.

Logging level is controlled by the `OTEL_LOG_LEVEL` environment variable. The two most common values are:
- `INFO`: the default value
- `VERBOSE`: highest value likely to be needed

For all possible log levels see
[this source file](https://github.com/open-telemetry/opentelemetry-js-api/blob/main/src/diag/types.ts).

There is no default output for logs. Even if you set `OTEL_LOG_LEVEL=VERBOSE`, nothing is output to the console. You
need to set an output first, for example to `stdout`, by adding `DiagConsoleLogger`:

```js
const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
```