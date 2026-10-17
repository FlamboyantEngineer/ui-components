# Changesets

Every pull request that changes the published package adds a changeset:

```sh
npx changeset
```

Pick the bump from the semver rules in [CONTRIBUTING.md](../CONTRIBUTING.md#versioning). The release workflow turns pending changesets into a version pull request and publishes when that pull request merges.
