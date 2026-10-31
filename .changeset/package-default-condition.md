---
'@flamboyantengineer/ui-components': patch
---

Each conditional package export ends with a `default` condition pointing at its ES module, so resolvers that do not assert `import` (Node's `require(esm)`, Jest's defaults, custom bundler condition sets) resolve the entry points instead of failing with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
