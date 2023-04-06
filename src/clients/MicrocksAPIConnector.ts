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

import { Contract, KeycloakConfig, Service } from "./types";

export function getKeycloakConfig(baseUrl: string): Promise<KeycloakConfig> {
  var url: string = getApiUrl(baseUrl);
  // Fetching the Keycloak configuration.
  return fetch(url + '/keycloak/config')
    .then(response => {
      if (!response.ok) {
        throw new Error('Error while reading Keycloack config on Microcks, code: ' + response.status);
      }
      return response.json() as Promise<KeycloakConfig>;
    })
}

export function listServices(baseUrl: string, authorization: string, page: number, size: number): Promise<Service[]> {
  var url: string = getApiUrl(baseUrl);
  url = url + '/services?page=' + page + '&size=' + size;
  // Fetching the page of services.
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${authorization}`
      //'Authorization': `${authorization}`
    }
  })
  .then(response => {
    if (!response.ok) {
      console.log(JSON.stringify(response));
      throw new Error('Error while fetching services on Microcks, code: ' + response.status);
    }
    return response.json() as Promise<Service[]>
  });
}

export function getServiceResource(baseUrl: string, authorization: string, serviceId: string): Promise<Contract[]> {
  var url: string = getApiUrl(baseUrl);
  url = url + '/resources/service/' + serviceId;
  // Fetching the corresponding contract.
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${authorization}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error while fetching resources on Microcks, code: ' + response.status);
    }
    return response.json() as Promise<Contract[]>
  });
}

function getApiUrl(baseUrl: string): string {
  if (!baseUrl.endsWith('/api')) {
    return baseUrl + '/api';
  }
  return baseUrl;
}
