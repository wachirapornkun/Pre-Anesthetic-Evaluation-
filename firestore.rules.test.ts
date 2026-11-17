// Phase 0 Security Rules Verification Suite (Dirty Dozen Adversarial Tests)
// Run against Firebase Emulator Suite when testing locally with @firebase/rules-unit-testing.

export interface DirtyDozenCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  description: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated access',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Reject request when request.auth is null',
  },
  {
    id: 2,
    name: 'Unverified email',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Reject request when request.auth.token.email_verified != true',
  },
  {
    id: 3,
    name: 'Cross-tenant read',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    description: 'Reject get when existing().ownerId != request.auth.uid',
  },
  {
    id: 4,
    name: 'Identity spoofing on create',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Reject create when incoming().ownerId != request.auth.uid',
  },
  {
    id: 5,
    name: 'Owner hijack on update',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    description: 'Reject update when incoming().ownerId != existing().ownerId',
  },
  {
    id: 6,
    name: 'Shadow ghost field injection',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Reject create/update containing unexpected top-level or formData keys',
  },
  {
    id: 7,
    name: 'Client-forged createdAt timestamp',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Reject create when createdAt != request.time',
  },
  {
    id: 8,
    name: 'Immutable createdAt tampering',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    description: 'Reject update when incoming().createdAt != existing().createdAt',
  },
  {
    id: 9,
    name: 'Path ID poisoning',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Reject invalid evaluationId not matching ^[a-zA-Z0-9_\\-]+$',
  },
  {
    id: 10,
    name: 'String length exhaustion',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Reject patientName > 120 chars or diagnosis > 300 chars',
  },
  {
    id: 11,
    name: 'Unbounded array injection',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Reject formData arrays exceeding bounded size limits',
  },
  {
    id: 12,
    name: 'Terminal state mutation',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    description: 'Reject update when existing().status == "locked"',
  },
];
