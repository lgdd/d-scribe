# Changelog

## 1.0.0 (2026-03-16)


### Features

* **agents:** add DBM verification and expanded correlation checks ([6b6d756](https://github.com/lgdd/d-scribe/commit/6b6d7568741446164e5c16445903b693f8cc48a1))
* **agents:** add dd-review-templates agent and command ([bbd52e7](https://github.com/lgdd/d-scribe/commit/bbd52e71af12ae7dffb7445b2fa8a55a4482e166))
* **agents:** add demo narrator for generating presentation runbooks ([7691528](https://github.com/lgdd/d-scribe/commit/7691528c88582b977729944ccfa155100306ff08))
* **agents:** add preflight and validate-telemetry agents ([3333570](https://github.com/lgdd/d-scribe/commit/3333570535508aa2123ae0c401cf221f2821a619))
* **commands:** add user-facing commands ([e1c0363](https://github.com/lgdd/d-scribe/commit/e1c03634efbee06702c1d93197e7475d38da1506))
* **dbm:** document DD_DBM_TRACE_PREPARED_STATEMENTS for prepared-statement tracing ([713534a](https://github.com/lgdd/d-scribe/commit/713534aa84994aae90ffd1c0772783e9dd3ee31d))
* **dbm:** expand postgres setup and validation troubleshooting ([a6c60ca](https://github.com/lgdd/d-scribe/commit/a6c60ca22865081f92bc46753202b6e31908fd96))
* **rules:** add distributable cursor rules ([0a75039](https://github.com/lgdd/d-scribe/commit/0a75039b67f10f4b434dda7ced887863779af412))
* **rules:** add Keycloak SSO identity provider topology and rule ([2d06cac](https://github.com/lgdd/d-scribe/commit/2d06cac8eb16e1f850904d9dbb1af8dcaf09ca92))
* **rules:** add MySQL and MongoDB DBM sections to docker-compose rule ([0e9ef0b](https://github.com/lgdd/d-scribe/commit/0e9ef0b7b5757ac35ee371b5007dff4db01ee93e))
* **rules:** add telemetry correlation rule ([7e9993c](https://github.com/lgdd/d-scribe/commit/7e9993c38970287a7bbb2d7317704ecdfc061d9a))
* **rules:** enforce {project}-{YYMMDD} convention for DD_ENV ([9e5d01a](https://github.com/lgdd/d-scribe/commit/9e5d01a42d10484b273648de95bf83b532120ca6))
* **skills:** add 7-day cooldown to auto-update checks ([5f3b881](https://github.com/lgdd/d-scribe/commit/5f3b881c55d6baf6b87189d82fbba582efd1604e))
* **skills:** add custom instrumentation and README step to add-product ([bc27383](https://github.com/lgdd/d-scribe/commit/bc2738334e3111f2753e18cae350a5e9aea68d4c))
* **skills:** add product templates for profiler, code security, and more ([5cd4dd6](https://github.com/lgdd/d-scribe/commit/5cd4dd659d4598252389bc3e971a76df1a7a6fa4))
* **skills:** add scaffold, traffic, and add-product skills ([424c080](https://github.com/lgdd/d-scribe/commit/424c08032de96d40dc5d8f8665092b3eb018ec26))
* **skills:** add seamless auto-update check to all skills ([649e23c](https://github.com/lgdd/d-scribe/commit/649e23cad1ac29d5b5106813aeff2fc0fe820e66))
* **skills:** add shared procedures and product templates ([da80240](https://github.com/lgdd/d-scribe/commit/da80240a05e678607f2dac2658c70a48e027708a))
* **skills:** add terraform skill for Datadog dashboards, monitors, and SLOs ([3f86bf6](https://github.com/lgdd/d-scribe/commit/3f86bf661c3b818df2a533ce6db3009db6ce2407))
* **skills:** expand failure scenarios with new scenarios, Locust guidance, and quick reference ([4b5500c](https://github.com/lgdd/d-scribe/commit/4b5500c4e82190e6953c91c8f6071424b50b3249))
* **skills:** integrate Keycloak auth topology into scaffold and add-product workflows ([0265b49](https://github.com/lgdd/d-scribe/commit/0265b495611d125cd738a06f57a1d51ad3930c3d))
* **terraform:** upgrade skill and templates to provider v4 ([a9dec2d](https://github.com/lgdd/d-scribe/commit/a9dec2d910555906fdaed3b2803f88a0409dbfd9))


### Bug Fixes

* **agents:** correct collect_schemas format in telemetry troubleshooting ([2280274](https://github.com/lgdd/d-scribe/commit/22802746dc9103f80d1feb3c51d8b13e53954593))
* **docs:** replace MCP doc search assumptions with direct links and fallback ([1f11acf](https://github.com/lgdd/d-scribe/commit/1f11acf66e40d9dde23e3effa965917b573597fe))
* **rules:** remove redundant DD_DBM_ENABLED instructions from dbm sections ([c72e4ef](https://github.com/lgdd/d-scribe/commit/c72e4effc9ec1bc8ee12a47619e1842594642b79))
* **rules:** replace deprecated agent env var and note terraform provider v4 ([382c870](https://github.com/lgdd/d-scribe/commit/382c8708513986893c62c5d87be12366d70f3e96))
* **rules:** switch keycloak log collection from docker stdout to syslog ([dfb8307](https://github.com/lgdd/d-scribe/commit/dfb830773463608377e17c4f6711dce0a7143b1d))
* **rules:** update docker-compose env var and mysql dbm grants ([5f71199](https://github.com/lgdd/d-scribe/commit/5f71199b1276851b8e3892b8de00112f272432e5))
* **skills:** update dd-add-product supported products list ([9dbc34d](https://github.com/lgdd/d-scribe/commit/9dbc34db7130d9629a5dd3dc4d256d61be704a4a))
* **templates:** add percentile metrics note to slo template ([af59e5d](https://github.com/lgdd/d-scribe/commit/af59e5d85c8c6706cc1f414fe19af4535a3a9be9))
* **templates:** correct llm observability doc URLs and siem audit log guidance ([a571d74](https://github.com/lgdd/d-scribe/commit/a571d74cf8f2aea6e8a01db0483d83f78de880e1))
