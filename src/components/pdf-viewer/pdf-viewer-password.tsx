import { useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { TextField } from '../text-field/text-field.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import type { PdfPasswordRequest } from './use-pdf-document.js';

export interface PdfViewerPasswordProps {
  request: PdfPasswordRequest;
}

/**
 * Asks for the password of a protected document. A password the engine turns down stays in the
 * field, marked incorrect until it is changed.
 */
export function PdfViewerPassword({ request }: PdfViewerPasswordProps) {
  const strings = useUiStrings();
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const isRejected = request.failures > 0 && !request.isChecking;
  return (
    <form
      {...hooks.slot('password')}
      onSubmit={(event) => {
        event.preventDefault();
        if (request.isChecking) return;
        setSubmitted(password);
        request.submit(password);
      }}
    >
      <TextField
        type="password"
        label={strings.password}
        description={strings.passwordRequired}
        value={password}
        // A password has no saved value to restore: whatever is typed counts as committed.
        committedValue={password}
        onChange={setPassword}
        validationMode="immediate"
        validate={(value) =>
          isRejected && value === submitted
            ? { severity: 'error', message: strings.passwordIncorrect }
            : null
        }
      />
      <Button type="submit" isPending={request.isChecking}>
        {strings.openDocument}
      </Button>
    </form>
  );
}
