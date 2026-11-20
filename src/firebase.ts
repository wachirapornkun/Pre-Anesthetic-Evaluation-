import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

function createFirestoreClient() {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        experimentalLongPollingOptions: {
          timeoutSeconds: 20,
        },
      },
      firebaseConfig.firestoreDatabaseId,
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreClient();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
}

export function logFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): FirestoreErrorInfo {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export function getFirestoreErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) return 'permission-denied';
  if (msg.includes('not-found') || msg.includes('NOT_FOUND')) return 'not-found';
  if (msg.includes('unavailable') || msg.includes('offline')) return 'unavailable';
  return 'unknown';
}

export function getFriendlyFirestoreErrorMessage(error: unknown): string {
  const code = getFirestoreErrorCode(error);
  if (code === 'permission-denied') {
    if (auth.currentUser && auth.currentUser.emailVerified === false) {
      return 'บัญชีผู้ใช้ยังไม่ได้ยืนยันอีเมล จึงยังบันทึกขึ้น Cloud ไม่ได้';
    }
    return 'สิทธิ์การบันทึกขึ้น Cloud ถูกปฏิเสธ (permission-denied)';
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'ไม่สามารถเชื่อมต่อฐานข้อมูล Cloud ได้ชั่วคราว (ออฟไลน์หรืออินเทอร์เน็ตขัดข้อง)';
  }
  if (code === 'unauthenticated') {
    return 'เซสชันเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  }
  const raw = error instanceof Error ? error.message : String(error);
  return raw ? `ข้อผิดพลาดฐานข้อมูล: ${raw}` : 'เกิดข้อผิดพลาดในการบันทึกข้อมูลขึ้นฐานข้อมูล';
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo = logFirestoreError(error, operationType, path);
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
