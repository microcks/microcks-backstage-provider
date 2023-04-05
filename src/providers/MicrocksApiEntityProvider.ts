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

import { PluginTaskScheduler, TaskRunner } from '@backstage/backend-tasks';
import {
  Entity,
  ApiEntity,
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION
} from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import {
  EntityProvider,
  EntityProviderConnection
} from '@backstage/plugin-catalog-backend';
import { Logger } from 'winston';
import YAML from 'yaml'
import { connectAndGetOAuthToken } from '../clients/KeycloakConnector';
import { getKeycloakConfig, getServiceResource, listServices } from '../clients/MicrocksAPIConnector';
import { Contract, ContractType, KeycloakConfig, Service, ServiceType } from '../clients/types';

import { readMicrocksApiEntityConfigs } from './config';
import { MicrocksConfig } from './types';

/**
 * @author laurent
 */
export class MicrocksApiEntityProvider implements EntityProvider {

  private static SERVICES_FETCH_SIZE: number = 30;

  private readonly env: string;

  private readonly baseUrl: string;
  private readonly serviceAccount: string;
  private readonly serviceAccountCredentials: string;
  private readonly systemLabel?: string;
  private readonly ownerLabel?: string;
  private readonly addLabels?: boolean = true;

  private readonly logger: Logger;

  private connection?: EntityProviderConnection;
  private readonly scheduleFn: () => Promise<void>;

  /*
  constructor(env: string, reader: UrlReader) {
    this.env = env;
    this.reader = reader;
  }
  */

  static fromConfig(
      configRoot: Config, 
      options: {
        logger: Logger;
        schedule?: TaskRunner;
        scheduler?: PluginTaskScheduler;
      }) : MicrocksApiEntityProvider[] {

    const providerConfigs = readMicrocksApiEntityConfigs(configRoot);
    
    if (!options.schedule && !options.scheduler) {
      throw new Error('Either schedule or scheduler must be provided.');
    }

    return providerConfigs.map(providerConfig => {

      if (!options.schedule && !providerConfig.schedule) {
        throw new Error(
          `No schedule provided neither via code nor config for MicrocksApiEntityProvider:${providerConfig.id}.`,
        );
      }

      const taskRunner = options.schedule ??
        options.scheduler!.createScheduledTaskRunner(providerConfig.schedule!);
    
      return new MicrocksApiEntityProvider(
        providerConfig,
        options.logger,
        taskRunner,
      );
    });
  }

  private constructor(config: MicrocksConfig, logger: Logger, taskRunner: TaskRunner) {
    this.env = config.id;
    this.baseUrl = config.baseUrl;
    this.serviceAccount = config.serviceAccount;
    this.serviceAccountCredentials = config.serviceAccountCredentials;
    this.systemLabel = config.systemLabel;
    this.ownerLabel = config.ownerLabel;
    this.addLabels = config.addLabels;

    this.logger = logger.child({
      target: this.getProviderName(),
    });

    this.scheduleFn = this.createScheduleFn(taskRunner);
  }

  private createScheduleFn(taskRunner: TaskRunner): () => Promise<void> {
    return async () => {
      const taskId = `${this.getProviderName()}:run`;
      return taskRunner.run({
        id: taskId,
        fn: async () => {
          try {
            await this.run();
          } catch (error) {
            this.logger.error(error);
          }
        },
      });
    };
  }

  /** {@inheritdoc @backstage/plugin-catalog-backend#EntityProvider.getProviderName} */
  getProviderName(): string {
    return `MicrocksApiEntityProvider:${this.env}`;
  }

  /** {@inheritdoc @backstage/plugin-catalog-backend#EntityProvider.connect} */
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn();
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    this.logger.info(`Discovering ApiEntities from Microcks ${this.baseUrl}`);

    const entities: Entity[] = [];
    var keycloakConfig: KeycloakConfig = await getKeycloakConfig(this.baseUrl);

    var oauthToken: string;
    if (keycloakConfig.enabled) {
      const authServerUrl = keycloakConfig['auth-server-url'] + '/realms/' + keycloakConfig.realm + '/protocol/openid-connect/token';
      this.logger.info(`Keycloak authentication is enabled, retrieving a OAuth token on ${authServerUrl}`);
      
      oauthToken = await connectAndGetOAuthToken(authServerUrl, this.serviceAccount, this.serviceAccountCredentials);
      oauthToken = JSON.parse(oauthToken)['access_token'];
    } else {
      oauthToken = '<anonymous-admin-token>';
      this.logger.info('Keycloak authentication is not enabled, using a fake token.')
    }

    var page: number = 0;
    var services: Service[];
    var fetchServices: boolean = true;
    while (fetchServices) {
      this.logger.debug(`Fetching API from Microck on ${this.baseUrl}, page ${page}`);
      services = await listServices(this.baseUrl, oauthToken, page, MicrocksApiEntityProvider.SERVICES_FETCH_SIZE);

      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        this.logger.debug("Find API " + service.name + " - " + service.version);

        if (this.isServiceCandidate(service)) {
          // Fetch the service contracts.
          var contracts: Contract[] = await getServiceResource(this.baseUrl, oauthToken, service.id);

          var contract = this.findSuitableContract(contracts);
          if (contract != null) {
            const apiEntity: ApiEntity = this.buildApiEntityFromService(service, contract);
            entities.push(apiEntity);

            this.logger.info("Discovered ApiEntity " + service.name + " - " + service.version);
          }
        }
      };
    
      if (services.length < MicrocksApiEntityProvider.SERVICES_FETCH_SIZE) {
        fetchServices = false
      }
      page++;
    }

    this.logger.info(`Applying the mutation with ${entities.length} entities`);

    await this.connection.applyMutation({
      type: 'full',
      entities: entities.map(entity => ({
        entity,
        locationKey: 'MicrocksApiEntityProvider',
      })),
    });
  }

  private isServiceCandidate(service: Service): boolean {
    if (service.type === ServiceType.REST || service.type === ServiceType.GENERIC_REST
        || service.type === ServiceType.EVENT || service.type === ServiceType.GENERIC_EVENT
        || service.type === ServiceType.GRPC) {
      return true;
    }
    return false;
  }

  private findSuitableContract(contracts: Contract[]): Contract | null {
    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i];
      if (contract.type === ContractType.OPEN_API_SPEC || contract.type === ContractType.ASYNC_API_SPEC 
          || contract.type === ContractType.PROTOBUF_SCHEMA) {
        return contract;
      }
    }
    return null;
  }

  private buildApiEntityFromService(service: Service, contract: Contract): ApiEntity {
    const location = `url:${this.baseUrl}/#/services/${service.id}`;

    var description: string | undefined;
    if (contract.type === ContractType.OPEN_API_SPEC || contract.type == ContractType.ASYNC_API_SPEC) {
      var spec;
      if (contract.content.startsWith('{')) {
        spec = JSON.parse(contract.content);
      } else {
        spec = YAML.parse(contract.content);
      }
      description = spec.info.description;
    }
    if (!description) {
      description = 'Version: ' + service.version;
    }

    return {
      kind: "API",
      apiVersion: "backstage.io/v1alpha1",
      metadata: {
        annotations: {
          [ANNOTATION_LOCATION]: location,
          [ANNOTATION_ORIGIN_LOCATION]: location
        },
        name: `${service.name}_${service.version}`.replaceAll(' ', '-'),
        description: description,
        labels: this.getApiEntityLabels(service),
        links: [
          {
            url: `${this.baseUrl}/#/services/${service.id}`,
            title: 'Microcks mock'
          },
          {
            url: `${this.baseUrl}/#/test/service/${service.id}`,
            title: 'Microcks tests'
          }
        ]
      },
      spec: {
        type: this.getApiEntityType(service.type),
        lifecycle: this.env,
        system: this.getApiEntitySystem(service),
        owner: this.getApiEntityOwner(service),
        definition: contract.content
      }
    }
  }

  private getApiEntityLabels(service: Service): Record<string, string> | undefined {
    var labels: Record<string, string> = {};
    labels['version'] = service.version;
    if (this.addLabels && service.metadata.labels) {
      for (const label in service.metadata.labels) {
        if (label != this.systemLabel && label != this.ownerLabel) {
          labels[label] = service.metadata.labels[label];
        }
      }
      return labels;
    }
    return undefined;
  }

  private getApiEntityType(type: ServiceType): string {
    switch (type) {
      case ServiceType.REST:
      case ServiceType.GENERIC_REST:
        return 'openapi';
        break;
      case ServiceType.EVENT:
      case ServiceType.GENERIC_EVENT:
        return 'asyncapi';
        break;
      case ServiceType.GRPC:
        return 'grpc';
        break;
    }
    return 'openapi';
  }

  private getApiEntitySystem(service: Service): string {
    if (this.systemLabel && service.metadata.labels && service.metadata.labels[this.systemLabel]) {
      return service.metadata.labels[this.systemLabel];
    }
    return '';
  }

  private getApiEntityOwner(service: Service): string {
    if (this.ownerLabel && service.metadata.labels && service.metadata.labels[this.ownerLabel]) {
      return service.metadata.labels[this.ownerLabel];
    }
    return '';
  }
}