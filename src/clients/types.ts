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

export type KeycloakConfig = {
  realm: string;
  "auth-server-url": string;
  "ssl-required": string;
  resource: string;
  enabled: boolean;
};

export type Service = {
  id: string;
  name: string;
  version: string;
  xmlNS: string;
  type: ServiceType;
  metadata: Metadata;
  sourceArtifact: string;
};

export type Metadata = {
  createdOn: number;
  lastUpdate: number;
  annotations: any;
  labels: any;
};

export enum ServiceType {
  SOAP_HTTP = "SOAP_HTTP",
  REST = "REST",
  EVENT = "EVENT",
  GRPC = "GRPC",
  GENERIC_REST = "GENERIC_REST",
  GENERIC_EVENT= "GENERIC_EVENT",
  GRAPHQL = "GRAPHQL"
};

export type Contract = {
  id: string;
  name: string;
  content: string;
  type: ContractType;
  serviceId: string;
  sourceArtifact: string;
}
export enum ContractType {
  WSDL = "WSDL",
  XSD = "XSD",
  JSON_SCHEMA = "JSON_SCHEMA",
  SWAGGER = "SWAGGER",
  RAML = "RAML",
  OPEN_API_SPEC = "OPEN_API_SPEC",
  OPEN_API_SCHEMA = "OPEN_API_SCHEMA",
  ASYNC_API_SPEC = "ASYNC_API_SPEC",
  ASYNC_API_SCHEMA = "ASYNC_API_SCHEMA",
  AVRO_SCHEMA = "AVRO_SCHEMA",
  PROTOBUF_SCHEMA = "PROTOBUF_SCHEMA",
  PROTOBUF_DESCRIPTOR = "PROTOBUF_DESCRIPTOR",
  GRAPHQL_SCHEMA = "GRAPHQL_SCHEMA"
}

