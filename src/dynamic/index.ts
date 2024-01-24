import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { MicrocksApiEntityProvider } from '../providers';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
    kind: 'legacy',
    async catalog(builder, env) {
      builder.addEntityProvider(
        MicrocksApiEntityProvider.fromConfig(env.config, {
          logger: env.logger,
          scheduler: env.scheduler,
          schedule: env.scheduler.createScheduledTaskRunner({
            frequency: { minutes: 2 },
            timeout: { minutes: 1 },
          }),
        }),
      );
    },
  };