import { describe } from 'vitest';
import { ruleTester } from './ruleTester';
import requireUseCallback from '../../src/rules/require-usecallback';
import { createRequireUseCallbackTestCases } from '../testcases/require-usecallback';
const { validUseCallbackCases, invalidUseCallbackCases } =
  createRequireUseCallbackTestCases();

describe('require-use-callback-in-hooks', () => {
  ruleTester.run('require-use-callback-in-hooks', requireUseCallback, {
    valid: validUseCallbackCases,
    invalid: invalidUseCallbackCases,
  });
});
