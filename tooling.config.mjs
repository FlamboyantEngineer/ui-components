// This repository's settings for the shared checks in tooling/ (specs/TOOLING.md).

import { checkComponentStructure } from './scripts/structure-rules.mjs';

export default {
  specs: { prefix: 'UIC', hookPrefix: 'ui' },
  structure: {
    names: ['src', 'tooling'],
    // S8: only a cycle that spans two component directories breaks the rule.
    cyclesAcross: 'src/components',
    rules: checkComponentStructure,
  },
  references: {
    // Upstream PDF vocabulary overlaps the denylist, so only exact dependency copies are accepted.
    verbatim: {
      'labs/build/vendor/pdf.min.mjs': 'pdfjs-dist/build/pdf.min.mjs',
      'labs/build/vendor/pdf.worker.min.mjs': 'pdfjs-dist/build/pdf.worker.min.mjs',
    },
  },
};
