/*
 * Copyright Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { startTracing, stopTracing } from '../src/tracing';
import { TestLogStream, assertInjection } from './utils';

describe('winston log injection', () => {
  let logStream: TestLogStream;

  beforeEach(() => {
    logStream = new TestLogStream();
  });

  it('injects context to winston records', () => {
    startTracing({ serviceName: 'test-service' });
    const winston = require('winston');
    const logger = winston.createLogger({
      transports: [new winston.transports.Stream({ stream: logStream.stream })],
    });
    assertInjection(logStream, logger);
    stopTracing();
  });
});
