import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';

import { MicrocksApiEntityProvider } from '../providers';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',

  install: createBackendModule({
    moduleId: 'catalog-backend-module-microcks',
    pluginId: 'catalog',
    register(env) {
      env.registerInit({
        deps: {
          catalog: catalogProcessingExtensionPoint,
          config: coreServices.rootConfig,
          logger: coreServices.logger,
          scheduler: coreServices.scheduler,
        },
        async init({ catalog, config, logger, scheduler }) {
          catalog.addEntityProvider(
            MicrocksApiEntityProvider.fromConfig(config, {
              logger: loggerToWinstonLogger(logger),
              scheduler: scheduler,
              schedule: scheduler.createScheduledTaskRunner({
                frequency: { minutes: 2 },
                timeout: { minutes: 1 },
              }),
            }),
          );
        },
      });
    },
  }),
};