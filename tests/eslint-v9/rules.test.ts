import { describe } from 'vitest';
import { ruleTester } from './ruleTester';
import requireUseCallback from '../../src/rules/require-usecallback';
import requireUseMemo from '../../src/rules/require-usememo';
import { createRequireUseCallbackTestCases } from '../testcases/require-usecallback';
import { createRequireUseMemoTestCases } from '../testcases/require-usememo';

const { validUseCallbackCases, invalidUseCallbackCases } =
  createRequireUseCallbackTestCases();
const { validUseMemoTestCases, invalidUseMemoTestCases } =
  createRequireUseMemoTestCases();

describe('require-use-callback-in-hooks', () => {
  ruleTester.run('require-use-callback-in-hooks', requireUseCallback, {
    valid: validUseCallbackCases,
    invalid: invalidUseCallbackCases,
  });
});

describe('require-use-memo', () => {
  ruleTester.run('require-use-memo', requireUseMemo, {
    valid: validUseMemoTestCases,
    invalid: invalidUseMemoTestCases,
  });
});
