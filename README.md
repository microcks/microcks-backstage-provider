# Microcks Backstage provider

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/microcks/microcks-backstage-provider/build-verify.yml?logo=github&style=for-the-badge)](https://github.com/microcks/microcks-backstage-provider/actions)
[![Version](https://img.shields.io/npm/v/@microcks/microcks-backstage-provider?color=blue&style=for-the-badge)]((https://search.maven.org/artifact/io.github.microcks/microcks))
[![License](https://img.shields.io/github/license/microcks/microcks?style=for-the-badge&logo=apache)](https://www.apache.org/licenses/LICENSE-2.0)
[![Project Chat](https://img.shields.io/badge/discord-microcks-pink.svg?color=7289da&style=for-the-badge&logo=discord)](https://microcks.io/discord-invite/)
[![Artifact HUB](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/microcks&style=for-the-badge)](https://artifacthub.io/packages/search?repo=microcks)
[![CNCF Landscape](https://img.shields.io/badge/CNCF%20Landscape-5699C6?style=for-the-badge&logo=cncf)](https://landscape.cncf.io/?item=app-definition-and-development--application-definition-image-build--microcks)

This is a plugin for synchronizing Microcks content into [Backstage.io](https://backstage.io/) catalog.

The `microcks-backstage-provider` has a special entity provider for discovering catalog [API entities](https://backstage.io/docs/features/software-catalog/system-model#api) defined in one or many Microcks instances. If you're using Microcks to discover APIs from your Git repositories, auto-publish smart mock endpoints and realize contract testing of your components, this provider can synchronize the API definitions from Microcks into your Backstage intance.

## Build Status

Latest released version is `0.0.7`.

Current development version is `0.0.8-SNAPSHOT`.

#### Fossa license and security scans

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fmicrocks%2Fmicrocks-backstage-provider.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fmicrocks%2Fmicrocks-backstage-provider?ref=badge_shield&issueType=license)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fmicrocks%2Fmicrocks-backstage-provider.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Fmicrocks%2Fmicrocks-backstage-provider?ref=badge_shield&issueType=security)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fmicrocks%2Fmicrocks-backstage-provider.svg?type=small)](https://app.fossa.com/projects/git%2Bgithub.com%2Fmicrocks%2Fmicrocks-backstage-provider?ref=badge_small)

#### OpenSSF best practices on Microcks core

[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/7513/badge)](https://bestpractices.coreinfrastructure.org/projects/7513)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/microcks/microcks/badge)](https://securityscorecards.dev/viewer/?uri=github.com/microcks/microcks)

## Community

* [Documentation](https://microcks.io/documentation/tutorials/getting-started/)
* [Microcks Community](https://github.com/microcks/community) and community meeting
* Join us on [Discord](https://microcks.io/discord-invite/), on [GitHub Discussions](https://github.com/orgs/microcks/discussions) or [CNCF Slack #microcks channel](https://cloud-native.slack.com/archives/C05BYHW1TNJ)

To get involved with our community, please make sure you are familiar with the project's [Code of Conduct](./CODE_OF_CONDUCT.md).

## Versions

| Basckstage Client | Microcks Backstage provider Version |
|-------------------|------------------|
| `>= 1.43`         | `0.0.7` and +    |
| `>= 1.31 && <1.43`| `0.0.6` and +    |
| `< 1.31`          | `0.0.5`          |

## Screenshots

Your Services and API from different Microcks instances can be discovered and imported into your Backstage catalog.

<a href="./assets/discovery-and-import.png">
  <img src="./assets/discovery-and-import.png" width="600"> 
</a>


Labels on your API in Microcks are be translated onto Backstage systems and owners. The plugin add links to access the API mock endpoints and conformance tests results. 

<a href="./assets/api-properties-mapping.png">
  <img src="./assets/api-properties-mapping.png" width="600"> 
</a>

## Install

After having created a new backstage app like described in Backstage.io' [Getting Started](https://backstage.io/docs/getting-started/#create-your-backstage-app), enter the app directory and run this command to add the Microcks Entity provider as a new backend plugin:

```sh
yarn --cwd packages/backend add @microcks/microcks-backstage-provider@^0.0.7
```

## Configure

Microcks Backstage provider allows configuration of one or many providers using the `app-config.yaml` configuration file of Backstage. Use a `microcksApiEntity` marker to start configuring them.

Each children key (here `dev` in the following sample) configures a provider for a specific `lifecyle` phase of your Entities so you may discover `API` entities from different Microcks instances.

At your configuration, you add a provider config per liefcycle:

```yaml
# app-config.yaml

catalog:
  providers:
    microcksApiEntity:
      dev:
        baseUrl: https://microcks.acme.com
        serviceAccount: microcks-serviceaccount
        serviceAccountCredentials: ab54d329-e435-41ae-a900-ec6b3fe15c54
        systemLabel: domain
        ownerLabel: team 
        addLabels: false # optional; copy any other labels from Microcks in Backstage catalog - default is true
        addOpenAPIServerUrl: true # optional; add a server in OpenAPI spec to point to Microcks sandbox URL - default is false
        schedule: # optional; same options as in TaskScheduleDefinition
          # supports cron, ISO duration, "human duration" as used in code
          frequency: { minutes: 2 }
          # supports ISO duration, "human duration" as used in code
          timeout: { minutes: 1 }  
```

Configuration is pretty straightforward but your may check Microcks documentation on [Service Accounts](https://microcks.io/documentation/automating/service-account/) for details.

Once you've done that, you'll also need to declare the Microcks as a backend module or an available entity provider. This operation differs depending on the version of Backstage you're using.

### For Backstage versions with the new Backend system

> Typically for application created via the CLI starting with Backstage `1.24`

You'll need to add the Microcks backend module in the `packages/backend/src/index.ts` file, before the `backend.start()` directive. Use this snippet below:

```ts
// microcks catalog provider
backend.add(import('@microcks/microcks-backstage-provider'));
```

### For Backstage versions with the old Backend plugin system

You need add the segment below to `packages/backend/src/plugins/catalog.ts`:

```ts
/* packages/backend/src/plugins/catalog.ts */

import { MicrocksApiEntityProvider } from '@microcks/microcks-backstage-provider';

[...]
  const builder = await CatalogBuilder.create(env);

  /** ... other processors and/or providers ... */
  builder.addEntityProvider(
    MicrocksApiEntityProvider.fromConfig(env.config, {
      logger: env.logger,
      scheduler: env.scheduler
    }),
  );

  const { processingEngine, router } = await builder.build();
[...]
``` 

## Troubleshoot

After having started your Backstage app, you should see some lines like those below in logs:

```log
[1] 2023-01-04T16:07:47.630Z catalog info Keycloak authentication is not enabled, using a fake token. type=plugin target=MicrocksApiEntityProvider:dev
[1] 2023-01-04T16:07:47.699Z catalog info Discovered ApiEntity API Pastry - 2.0 - 2.0.0 type=plugin target=MicrocksApiEntityProvider:dev
[1] 2023-01-04T16:07:47.708Z catalog info Discovered ApiEntity Account Service - 1.1.0 type=plugin target=MicrocksApiEntityProvider:dev
[1] 2023-01-04T16:07:47.712Z catalog info Discovered ApiEntity HelloService - v1 type=plugin target=MicrocksApiEntityProvider:dev
[1] 2023-01-04T16:07:47.728Z catalog info Discovered ApiEntity User signed-up API - 0.1.1 type=plugin target=MicrocksApiEntityProvider:dev
[1] 2023-01-04T16:07:47.734Z catalog info Discovered ApiEntity User signed-up API - 0.1.20 type=plugin target=MicrocksApiEntityProvider:dev
[1] 2023-01-04T16:07:47.740Z catalog info Discovered ApiEntity User signed-up API - 0.1.30 type=plugin target=MicrocksApiEntityProvider:dev
[1] 2023-01-04T16:07:47.745Z catalog info Discovered ApiEntity User signed-up Avro API - 0.1.2 type=plugin target=MicrocksApiEntityProvider:dev
[1] 2023-01-04T16:07:47.749Z catalog info Applying the mutation with 7 entities type=plugin target=MicrocksApiEntityProvider:dev
```

## Build and release

After a fresh `git clone`, you can install dependencies, compile typescript and build a new distribution with those commands:

```sh
$ yarn install && yarn tsc && yarn export-dynamic && yarn run build
```

When publishing a release withe the `release` GitHub Action, generating the SBOM from Yarn files fails because of unresolved transitive dependencies. So we included `package-lock.json` and generate the SBOM with the `--package-lock-only` flag.

> So, whenever you update a dependency in `package.json` and then `yarn.lock`, please ensure that you also update `package-lock.json` otherwise the next release will fail!

## Develop locally

After having created a new backstage app like described in Backstage.io' [Getting Started](https://backstage.io/docs/getting-started/#create-your-backstage-app), just edit the `packages/backend/src/plugins/catalog.ts` file and apply same configuration as above insdtallation directive but with relative path to your local clone of this repository:

```ts
/* packages/backend/src/plugins/catalog.ts */

import { MicrocksApiEntityProvider } from '../../../../../github/microcks-backstage-provider';
```

Just launch your local backstage app using `yarn dev` at the root folder level.