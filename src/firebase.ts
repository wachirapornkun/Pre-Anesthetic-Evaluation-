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
        // Force HTTPS long-polling so hospital firewalls, proxies, mobile networks, and iframes
        // never get stuck on blocked WebChannel/HTTP2 streaming connections.
        experimentalForceLongPolling: true,
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

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;

export interface InAppBrowserInfo {
  isInApp: boolean;
  appName: string | null;
}

export function detectInAppBrowser(): InAppBrowserInfo {
  if (typeof navigator === 'undefined') {
    return { isInApp: false, appName: null };
  }
  const ua = navigator.userAgent || '';
  if (/\bLine\//i.test(ua)) return { isInApp: true, appName: 'LINE' };
  if (/\bFBAN|FBAV|FB_IAB/i.test(ua)) return { isInApp: true, appName: 'Facebook' };
  if (/\bInstagram/i.test(ua)) return { isInApp: true, appName: 'Instagram' };
  if (/\bMessenger/i.test(ua)) return { isInApp: true, appName: 'Messenger' };
  if (/\bMicroMessenger/i.test(ua)) return { isInApp: true, appName: 'WeChat' };
  if (/\bwv\)/i.test(ua) && /Android/i.test(ua)) {
    return { isInApp: true, appName: 'เบราว์เซอร์ภายในแอป' };
  }
  return { isInApp: false, appName: null };
}

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
  if (msg.includes('unauthenticated') || msg.includes('UNAUTHENTICATED')) return 'unauthenticated';
  return 'unknown';
}

export function getFriendlyFirestoreErrorMessage(error: unknown): string {
  const code = getFirestoreErrorCode(error);
  if (code === 'permission-denied') {
    if (!auth.currentUser) {
      return 'ยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบด้วยบัญชี Google หรืออีเมล/รหัสผ่านก่อน';
    }
    if (auth.currentUser.emailVerified === false) {
      return 'บัญชีผู้ใช้ยังไม่ได้ยืนยันอีเมล จึงยังไม่สามารถเชื่อมต่อฐานข้อมูล Cloud ได้ (แนะนำให้เข้าสู่ระบบด้วยบัญชี Google หรือกดยืนยันลิงก์ในอีเมล)';
    }
    return 'สิทธิ์การเชื่อมต่อ Cloud ถูกปฏิเสธ (permission-denied) — ลองกดปุ่ม "รีเฟรชสิทธิ์ & เชื่อมต่อใหม่" หรือเข้าสู่ระบบด้วย Google อีกครั้ง';
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ฐานข้อมูล Cloud ได้ชั่วคราว (อาจเกิดจากอินเทอร์เน็ตขัดข้องหรือไฟร์วอลล์เครือข่ายโรงพยาบาล)';
  }
  if (code === 'unauthenticated') {
    return 'เซสชันเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  }
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('Quota exceeded')) {
    return 'โควตาการใช้งานฐานข้อมูลประจำวันเต็มแล้ว (จะรีเซ็ตในวันถัดไป)';
  }
  return raw ? `ข้อผิดพลาดฐานข้อมูล: ${raw}` : 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล';
}

export function getFriendlyAuthErrorMessage(error: unknown): string {
  const code = getFirestoreErrorCode(error);
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    case 'auth/invalid-email':
      return 'รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    case 'auth/email-already-in-use':
      return 'อีเมลนี้มีบัญชีผู้ใช้งานอยู่แล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่าน หรือกดปุ่ม "เข้าสู่ระบบด้วยบัญชี Google" ด้านบน';
    case 'auth/account-exists-with-different-credential':
      return 'อีเมลนี้เคยลงทะเบียนด้วยวิธีอื่นแล้ว กรุณาเข้าสู่ระบบด้วยวิธีเดิม (Google หรืออีเมล/รหัสผ่าน)';
    case 'auth/weak-password':
      return 'รหัสผ่านสั้นเกินไป กรุณาตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร';
    case 'auth/too-many-requests':
      return 'มีการทำรายการหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
    case 'auth/operation-not-allowed':
      return 'ยังไม่ได้เปิดใช้งานระบบเข้าสู่ระบบด้วยอีเมล/รหัสผ่านใน Firebase Console — สามารถกดปุ่ม "เข้าสู่ระบบด้วยบัญชี Google" ด้านบนเพื่อเชื่อมต่อได้ทันที หรือให้ผู้ดูแลระบบเปิด Email/Password ใน Firebase Console → Authentication → Sign-in method';
    case 'auth/unauthorized-domain':
      return `โดเมนนี้ (${host || 'ไม่ทราบโดเมน'}) ยังไม่ได้รับอนุญาตให้เข้าสู่ระบบใน Firebase — กรุณาให้ผู้ดูแลระบบเพิ่มโดเมนนี้ใน Firebase Console → Authentication → Settings → Authorized domains`;
    case 'auth/popup-blocked':
      return 'เบราว์เซอร์บล็อกหน้าต่างป๊อปอัปเข้าสู่ระบบ Google — กรุณากดอนุญาต Pop-up ที่แถบด้านบนของเบราว์เซอร์แล้วกดเข้าสู่ระบบอีกครั้ง (หรือเปิดลิงก์ใน Chrome / Safari)';
    case 'auth/cancelled-popup-request':
      return 'มีหน้าต่างเข้าสู่ระบบเปิดค้างอยู่ กรุณาลองกดปุ่มเข้าสู่ระบบอีกครั้ง';
    case 'auth/popup-closed-by-user':
      return 'ปิดหน้าต่างเข้าสู่ระบบ Google ก่อนดำเนินการเสร็จ กรุณากดลองใหม่อีกครั้ง';
    case 'auth/network-request-failed':
      return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ยืนยันตัวตนได้ กรุณาตรวจสอบอินเทอร์เน็ต หรือลองเปลี่ยนจาก Wi-Fi โรงพยาบาลเป็นเน็ตมือถือ';
    case 'auth/internal-error':
      return 'เบราว์เซอร์ขัดขวางการเชื่อมต่อ Google ชั่วคราว (อาจเปิดผ่าน LINE / โหมดไม่ระบุตัวตน) — กรุณาเปิดลิงก์นี้ในเบราว์เซอร์ Chrome หรือ Safari';
    case 'auth/user-disabled':
      return 'บัญชีผู้ใช้งานนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ';
    default: {
      const raw = error instanceof Error ? error.message : String(error);
      return raw ? `เข้าสู่ระบบไม่สำเร็จ (${code !== 'unknown' ? code : 'error'}): ${raw}` : 'เกิดข้อผิดพลาดในการยืนยันตัวตน กรุณาลองใหม่อีกครั้ง';
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

export interface FirebaseDiagnosticResult {
  networkOnline: boolean;
  firestoreReachable: boolean;
  firestoreMessage: string;
  hostname: string;
  inAppBrowser: InAppBrowserInfo;
  signedInEmail: string | null;
  emailVerified: boolean | null;
  tokenEmailVerified: boolean | null;
}

export async function diagnoseFirebaseConnection(): Promise<FirebaseDiagnosticResult> {
  const networkOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const inAppBrowser = detectInAppBrowser();
  const currentUser = auth.currentUser;

  let tokenEmailVerified: boolean | null = null;
  if (currentUser) {
    try {
      const tokenResult = await currentUser.getIdTokenResult();
      tokenEmailVerified = Boolean(tokenResult.claims?.email_verified);
    } catch {
      tokenEmailVerified = null;
    }
  }

  let firestoreReachable = false;
  let firestoreMessage = '';
  if (!networkOnline) {
    firestoreMessage = 'อุปกรณ์อยู่ในสถานะออฟไลน์ (ไม่มีอินเทอร์เน็ต)';
  } else {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      firestoreReachable = true;
      firestoreMessage = 'เชื่อมต่อเซิร์ฟเวอร์ Firestore ได้ปกติ';
    } catch (error) {
      const code = getFirestoreErrorCode(error);
      const raw = error instanceof Error ? error.message : String(error);
      if (code === 'permission-denied') {
        // Reaching Firestore rules engine proves live network connectivity to the exact DB
        firestoreReachable = true;
        firestoreMessage = 'เชื่อมต่อเซิร์ฟเวอร์ Firestore ได้ปกติ';
      } else if (raw.includes('the client is offline') || code === 'unavailable') {
        firestoreReachable = false;
        firestoreMessage =
          'ติดต่อเซิร์ฟเวอร์ Firestore ไม่ได้ (เครือข่ายหรือไฟร์วอลล์อาจบล็อกการเชื่อมต่อ)';
      } else {
        firestoreReachable = false;
        firestoreMessage = `เชื่อมต่อไม่สำเร็จ (${code}): ${raw}`;
      }
    }
  }

  return {
    networkOnline,
    firestoreReachable,
    firestoreMessage,
    hostname,
    inAppBrowser,
    signedInEmail: currentUser?.email ?? null,
    emailVerified: currentUser ? Boolean(currentUser.emailVerified) : null,
    tokenEmailVerified,
  };
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
