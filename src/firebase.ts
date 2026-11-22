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
        experimentalAutoDetectLongPolling: true,
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
googleProvider.setCustomParameters({ prompt: 'select_account' });

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

export function getFriendlyAuthErrorMessage(error: unknown): string {
  const code = getFirestoreErrorCode(error);
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    case 'auth/invalid-email':
      return 'รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    case 'auth/email-already-in-use':
      return 'อีเมลนี้มีบัญชีผู้ใช้งานอยู่แล้ว กรุณาเข้าสู่ระบบหรือกดลืมรหัสผ่าน';
    case 'auth/weak-password':
      return 'รหัสผ่านสั้นเกินไป กรุณาตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร';
    case 'auth/too-many-requests':
      return 'มีการทำรายการหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
    case 'auth/operation-not-allowed':
      return 'ยังไม่ได้เปิดใช้งานระบบเข้าสู่ระบบด้วยอีเมลและรหัสผ่านใน Firebase Console (กรุณาให้ผู้ดูแลระบบเปิด Email/Password ใน Authentication → Sign-in method)';
    case 'auth/network-request-failed':
      return 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่';
    case 'auth/popup-closed-by-user':
      return 'ปิดหน้าต่างเข้าสู่ระบบ Google ก่อนดำเนินการเสร็จ';
    case 'auth/user-disabled':
      return 'บัญชีผู้ใช้งานนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ';
    default: {
      const raw = error instanceof Error ? error.message : String(error);
      return raw ? `เข้าสู่ระบบไม่สำเร็จ: ${raw}` : 'เกิดข้อผิดพลาดในการยืนยันตัวตน กรุณาลองใหม่อีกครั้ง';
    }
  }
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
