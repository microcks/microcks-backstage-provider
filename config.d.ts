/*
 * Copyright The Microcks Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { TaskScheduleDefinitionConfig } from '@backstage/backend-tasks';

export interface Config {
  catalog?: {
    /**
     * List of provider-specific options and attributes
     */
    providers?: {
      /**
       * MicrocksApiEntityProvider configuration
       */
      microcksApiEntity?: {
        [name: string]: {
          /**
           * Location of the Microcks instance
           */
          baseUrl: string;
          /**
           * Service Account used to query data from Microcks
           */
          serviceAccount: string;
          /**
           * Service Account Credentials used to query data from Microcks
           */
          serviceAccountCredentials: string;
          /**
           * Label to be used as system on Backstage Catalog
           */
          systemLabel?: string;
          /**
           * Label to be used as owner on Backstage Catalog
           */
          ownerLabel?: string;
          /**
           * Should other Microcks labels be reported on Backstage Catalog?
           */
          addLabels?: boolean;
          /**
           * Should we had the Microcks instance mock URL to servers in OpenAPI specifications?
           * (so that it allows Swagger-UI Try-It-Out to use it)
           */
          addOpenAPIServerUrl?: boolean;

          schedule?: TaskScheduleDefinitionConfig;
        };
      };
    };
  };
}