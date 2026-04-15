# Changelog

## [1.2.0](https://github.com/lgdd/d-scribe/compare/d-scribe-v1.1.0...d-scribe-v1.2.0) (2026-04-15)


### Features

* **catalog:** add delivery:feature-flags manifest entry ([554acf0](https://github.com/lgdd/d-scribe/commit/554acf06d37fd771813e796046b7c441ed4c1fc8))


### Bug Fixes

* **catalog:** fix nginx upstream, locust headless, log source labels, llmobs env, and trace propagation ([f3ef5bc](https://github.com/lgdd/d-scribe/commit/f3ef5bcf93b6d93d657619bf287cfd8c428ec2cf))

## [1.1.0](https://github.com/lgdd/d-scribe/compare/d-scribe-v1.0.0...d-scribe-v1.1.0) (2026-04-10)


### Features

* **cli:** add dd-lookup-docs to globally installable skills ([c056b38](https://github.com/lgdd/d-scribe/commit/c056b3892b2bceb206c2a637c32c0ad1c58572af))
* **cli:** add DJM config to spark and airflow DEP_SPECS ([af583fb](https://github.com/lgdd/d-scribe/commit/af583fbd4958df2c6e46c28327dec27b5d99d3c7))
* **cli:** add SAST config generation with language-specific rulesets ([50bd4da](https://github.com/lgdd/d-scribe/commit/50bd4da2792c93c96c8a585e844c9654ae54d449))
* **cli:** add service_env support, fix DD_APPSEC_ENABLED placement ([9a340ff](https://github.com/lgdd/d-scribe/commit/9a340ff820c7df3fb69594245bb2d24c3bb52ed4))
* **cli:** add workload protection caps and volumes to agent template ([aca1ff2](https://github.com/lgdd/d-scribe/commit/aca1ff2a3de11fcc47544a7dd3be8531c9b75489))
* expand feature catalog from 4 to 13 datadog features ([f053b42](https://github.com/lgdd/d-scribe/commit/f053b4281a231c7acf6b8c4c5565deced5cd6abb))


### Bug Fixes

* **cli:** scope package name to [@lgdd](https://github.com/lgdd) for npm publishing ([f78a5df](https://github.com/lgdd/d-scribe/commit/f78a5df616424f523c360b14ef6f70dc2c8f9b65))

## [1.0.0](https://github.com/lgdd/d-scribe/compare/d-scribe-v0.1.0...d-scribe-v1.0.0) (2026-04-08)


### ⚠ BREAKING CHANGES

* merge v2 rewrite into main

### Features

* **catalog:** register new backends and frontends in manifest and remove metrics:custom feature ([fd9f13b](https://github.com/lgdd/d-scribe/commit/fd9f13bb6ccc5e44f564ae2abfc43d16e9272ba3))
* **cli:** add --output json to list commands and rename init --output to --dest ([8ab09dc](https://github.com/lgdd/d-scribe/commit/8ab09dcfd5f45206a4827075b6e6be8532616033))
* **cli:** add 'list deploy' subcommand showing available deploy targets ([9085388](https://github.com/lgdd/d-scribe/commit/90853884abbbff431d912e732a8b0bd92017c4ce))
* **cli:** add AGENTS.md, CLAUDE.md, env, and README templates ([24f9c57](https://github.com/lgdd/d-scribe/commit/24f9c5701cf19e88d3fcb595d1a35e3075776cde))
* **cli:** add dependency resolver with round-robin distribution ([faa9738](https://github.com/lgdd/d-scribe/commit/faa973851f02d37bfbfb8b53b2e947476bcfd7c5))
* **cli:** add deploy target parser with defaults and validation ([143a8f1](https://github.com/lgdd/d-scribe/commit/143a8f1eee5e2a4d0a91dd0143e1e36543c0b03f))
* **cli:** add docker-compose template and composer ([89df5fd](https://github.com/lgdd/d-scribe/commit/89df5fd51497a5b64758b0d1f627f8034d57c17a))
* **cli:** add Handlebars renderer with join/eq/includes helpers ([1114fcf](https://github.com/lgdd/d-scribe/commit/1114fcffe28f19cada90c7478cc7fa725063b135))
* **cli:** add K8s and AWS conditional sections to AGENTS.md and README templates ([9162db9](https://github.com/lgdd/d-scribe/commit/9162db91dea5e0167ed718d7dd577106c97a0788))
* **cli:** add K8s Handlebars templates for manifests and Helm values ([ef98952](https://github.com/lgdd/d-scribe/commit/ef989529689bc0536dd679467c64996444ae7415))
* **cli:** add K8s manifest composer and route init by deploy stack ([28e47ad](https://github.com/lgdd/d-scribe/commit/28e47ad41ead4c17b339f4dab73421e2055711f8))
* **cli:** add list command and add stubs ([2f8ca06](https://github.com/lgdd/d-scribe/commit/2f8ca06ad514d85c93ec92ffad7a53347b1583ad))
* **cli:** add manifest types, loader, and catalog manifest.json ([78fd7c6](https://github.com/lgdd/d-scribe/commit/78fd7c63028ecb49a9904651c18606c2d0efc443))
* **cli:** add project manifest written at init time ([a6e17e6](https://github.com/lgdd/d-scribe/commit/a6e17e63b8956fac251375afc8a8bcf8baf13958))
* **cli:** add Terraform EC2 Handlebars templates for AWS deploy targets ([dd12f47](https://github.com/lgdd/d-scribe/commit/dd12f47b71cba6e6a7483ce3b5313bc65b9ab092))
* **cli:** add Terraform generation and build-only docker-compose for K8s ([3d8dd21](https://github.com/lgdd/d-scribe/commit/3d8dd216f14a5f6311e278208b9bbed884c2f8ef))
* **cli:** extract install skills into dedicated install command ([24a26e3](https://github.com/lgdd/d-scribe/commit/24a26e3e5ce9bac12190450b05d20fd91b9dd6c0))
* **cli:** implement --services flag, template-based scaffolding, and pattern copy ([457760c](https://github.com/lgdd/d-scribe/commit/457760c9ae6074207f38fefa2a3da5bec67eb086))
* **cli:** implement add feature command with YAML patching ([2903232](https://github.com/lgdd/d-scribe/commit/2903232b93c9dbe68f715a44c7c8019a5fd08150))
* **cli:** implement init demo command with full pipeline ([d3adebc](https://github.com/lgdd/d-scribe/commit/d3adebc5dcc60647b73c30ce6924a3b1d3d536d2))
* **cli:** implement init skills command for Cursor and Claude Code ([5ebbbf4](https://github.com/lgdd/d-scribe/commit/5ebbbf47a371c4416540970c0e31aa249765ee51))
* **cli:** scaffold monorepo with CLI entry point ([8e0a7b9](https://github.com/lgdd/d-scribe/commit/8e0a7b9690ab3140c4e4a6e52396fbea10416e91))
* **cli:** update composer and templates for generic service names and patterns ([aeeef09](https://github.com/lgdd/d-scribe/commit/aeeef09e6ab68ed0faf8bcc32880a92931b5aee7))
* **cli:** update resolver for dynamic service-1..N naming with --services flag ([5f37c43](https://github.com/lgdd/d-scribe/commit/5f37c432c7a5c12bf77d851dd99afe1eb681c657))
* merge v2 rewrite into main ([7ad8727](https://github.com/lgdd/d-scribe/commit/7ad87278d8369f6a3f79e9ecc8bac9245b310e01))


### Bug Fixes

* **cli:** correct template filename case for linux CI ([c975c9e](https://github.com/lgdd/d-scribe/commit/c975c9edd033c02aaaf2e6792bd32b21f0137cbb))
* **cli:** generate DD_ENV with date suffix per unified tagging convention ([5cb2614](https://github.com/lgdd/d-scribe/commit/5cb26144ca88bf96892fda135356544a7542fbaa))
