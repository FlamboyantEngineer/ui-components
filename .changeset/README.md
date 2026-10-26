# Changesets

Every pull request that changes the published package adds a changeset:

```sh
npx changeset
```

Until `1.0.0`, APIs and styling hooks are experimental: use minor changesets for API additions, removals and reorganizations, and patches for fixes that preserve the API. Describe current capabilities without migration notices or deprecation periods. The initial development history is consolidated into `initial-release.md`, a minor changeset targeting `0.1.0`.

Starting at `1.0.0`, use the compatibility rules in [CONTRIBUTING.md](../CONTRIBUTING.md#versioning). `npx changeset version` turns pending changesets into the next version and changelog entry; [CONTRIBUTING.md](../CONTRIBUTING.md#releasing) has the release steps.
