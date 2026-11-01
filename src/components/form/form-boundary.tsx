'use client';

import type { ReactNode } from 'react';
import { FormContext, FormValidationContext } from '../../primitives/index.js';
import { FieldScopeContext, type FieldScope } from '../field/field-scope.js';
import { FormProblemContext } from './form-problems.js';
import { FormValidityContext } from './form-validity.js';

const noScope: FieldScope = {};
const noErrors = {};

/**
 * Where the forms around it end, such as an overlay's body: the fields inside belong to a form
 * inside it or to none, and take neither the validation, the errors nor the props of a form around.
 */
export function FormBoundary({ children }: { children: ReactNode }) {
  return (
    <FormContext value={null}>
      <FormValidationContext value={noErrors}>
        <FieldScopeContext value={noScope}>
          <FormProblemContext value={null}>
            <FormValidityContext value={null}>{children}</FormValidityContext>
          </FormProblemContext>
        </FieldScopeContext>
      </FormValidationContext>
    </FormContext>
  );
}
