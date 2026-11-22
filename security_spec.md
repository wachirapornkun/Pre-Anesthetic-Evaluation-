# Security Specification — Bangplee Pre-Anesthetic Evaluation System

## 1. Data Invariants
1. **Shared Department Clinical Workspace**: Every `/evaluations/{evaluationId}` document requires verified sign-in (`email_verified == true`) and a valid lifecycle `status` (`draft`, `evaluated`, `post_op_completed`, `locked`). All verified clinicians may read, list (via status query), create, and collaboratively update unlocked records, while deletion is restricted to the original creator (`ownerId == request.auth.uid`) or verified admin.
2. **Verified Identity**: All reads and writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Immutable Provenance**: `ownerId` and `createdAt` are set at creation (`ownerId == request.auth.uid`, `createdAt == request.time`) and cannot be modified on update by any user.
4. **Server-Authoritative Timestamps**: `createdAt` (on create) and `updatedAt` (on create and update) MUST equal `request.time`.
5. **Terminal State Lock**: If `existing().status == 'locked'`, non-admin clinicians cannot update the document.
6. **Strict Schema & Volumetric Bounds**: All top-level keys (`hasAll` + `hasOnly`), nested `formData` section keys (`hasOnly`), string lengths, and array sizes are strictly enforced to prevent shadow fields and resource exhaustion.
7. **Path Variable Hardening**: `evaluationId` MUST match `^[a-zA-Z0-9_\-]+$` and be `<= 128` chars on single-document operations (`get`, `create`, `update`, `delete`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read/Write**: `auth = null` attempting `get`/`list`/`create` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: `auth.token.email_verified = false` attempting `create`/`read`/`update` -> `PERMISSION_DENIED`.
3. **Unauthorized Delete by Non-Owner**: Non-admin User B (`uid = 'user-b'`) attempting `delete` on User A's document -> `PERMISSION_DENIED`.
4. **Identity Spoofing on Create**: User B attempting `create` with `ownerId: 'user-a'` -> `PERMISSION_DENIED`.
5. **Owner Hijack on Update**: User A attempting `update` changing `ownerId` to `'user-b'` -> `PERMISSION_DENIED`.
6. **Shadow / Ghost Field Injection**: User A attempting `create` or `update` with extra field `isAdmin: true` or `formData.evilKey: 'x'` -> `PERMISSION_DENIED`.
7. **Client-Forged Timestamps**: User A attempting `create` with `createdAt: new Date(0)` instead of `serverTimestamp()` -> `PERMISSION_DENIED`.
8. **Immutable `createdAt` Tampering**: User A attempting `update` modifying `createdAt` -> `PERMISSION_DENIED`.
9. **Path ID Poisoning**: User A attempting `create` with 200-char or invalid ID `'../../etc/passwd'` -> `PERMISSION_DENIED`.
10. **String Size Exhaustion**: User A attempting `create` with `patientName` > 120 chars or `diagnosis` > 300 chars -> `PERMISSION_DENIED`.
11. **Unbounded Array Injection**: User A attempting `create` with `formData.problemList` containing 25 items (> 12 limit) -> `PERMISSION_DENIED`.
12. **Terminal State Bypass**: User A attempting `update` on a document whose `existing().status == 'locked'` -> `PERMISSION_DENIED`.
