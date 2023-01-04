/*
 * Copyright 2022 Laurent Broudoux
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
import { readTaskScheduleDefinitionFromConfig } from '@backstage/backend-tasks';
import { Config } from '@backstage/config';
import { MicrocksConfig } from './types';

export function readMicrocksApiEntityConfigs(config: Config): MicrocksConfig[] {
  const configs: MicrocksConfig[] = [];

  const providerConfigs = config.getOptionalConfig(
    'catalog.providers.microcksApiEntity',
  );

  if (!providerConfigs) {
    return configs;
  }

  for (const id of providerConfigs.keys()) {
    configs.push(readMicrocksApiEntityConfig(id, providerConfigs.getConfig(id)));
  }

  return configs;
}

function readMicrocksApiEntityConfig(id: string, config: Config): MicrocksConfig {

  const baseUrl = config.getString('baseUrl');
  const serviceAccount = config.getString('serviceAccount');
  const serviceAccountCredentials = config.getString('serviceAccountCredentials');
  const systemLabel = config.getOptionalString('systemLabel');
  const ownerLabel = config.getOptionalString('ownerLabel');
  const addLabels = config.getOptionalBoolean('addLabels') || true;

  const schedule = config.has('schedule')
    ? readTaskScheduleDefinitionFromConfig(config.getConfig('schedule'))
    : undefined;

  return {
    id,
    baseUrl,
    serviceAccount,
    serviceAccountCredentials,
    systemLabel,
    ownerLabel,
    addLabels,
    schedule,
  };
}