import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  getFirestore,
  initializeFirestore,
  limit,
  query,
  where,
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
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Fallback safely in browsers/webviews that restrict local storage persistence
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;
export const PUBLISHED_APP_URL = 'https://bangplee-pre-anesthetic-evaluation.ai.studio';

export function isRunningInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function isGoogleProviderUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.providerData?.some((provider) => provider.providerId === 'google.com'));
}

export function isCloudAuthorizedUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.emailVerified || isGoogleProviderUser(user));
}

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
    if (!isCloudAuthorizedUser(auth.currentUser)) {
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
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('access_denied') || raw.includes('org_internal')) {
    return 'บัญชี Google นี้ถูกจำกัดสิทธิ์จากหน้าจอ OAuth Consent Screen — กรุณาให้ผู้ดูแลระบบตั้งค่า OAuth Consent Screen ใน Google Cloud Console เป็นสถานะ Published (In production) หรือลองเข้าสู่ระบบด้วยอีเมล/รหัสผ่านแทน';
  }
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
      return 'ยังไม่ได้เปิดใช้งานระบบเข้าสู่ระบบวิธีนี้ใน Firebase Console — สามารถกดปุ่ม "เข้าสู่ระบบด้วยบัญชี Google" ด้านบนเพื่อเชื่อมต่อได้ทันที';
    case 'auth/unauthorized-domain':
      return `โดเมนนี้ (${host || 'ไม่ทราบโดเมน'}) ยังไม่ได้รับอนุญาตให้เข้าสู่ระบบใน Firebase — กรุณาเปิดผ่านลิงก์หลัก ${PUBLISHED_APP_URL} หรือเพิ่มโดเมนนี้ใน Firebase Console → Authentication → Settings → Authorized domains`;
    case 'auth/popup-blocked':
      return 'เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป Google — กรุณากดปุ่ม "เข้าสู่ระบบ Google แบบเต็มหน้า (สำหรับมือถือ / Safari)" ด้านล่าง หรืออนุญาต Pop-up ในเบราว์เซอร์';
    case 'auth/operation-not-supported-in-this-environment':
    case 'auth/missing-initial-state':
      return 'เบราว์เซอร์หรือโหมดส่วนตัว (Private/Incognito) ปิดกั้นพื้นที่เก็บข้อมูลชั่วคราว — กรุณาเปิดลิงก์ใน Chrome หรือ Safari โหมดปกติ แล้วลองเข้าสู่ระบบอีกครั้ง';
    case 'auth/cancelled-popup-request':
      return 'มีหน้าต่างเข้าสู่ระบบเปิดค้างอยู่ กรุณาลองกดปุ่มเข้าสู่ระบบอีกครั้ง';
    case 'auth/popup-closed-by-user':
      return 'หน้าต่างเข้าสู่ระบบ Google ถูกปิดก่อนเสร็จสิ้น — หากใช้ iPhone/มือถือ แนะนำกดปุ่ม "เข้าสู่ระบบ Google แบบเต็มหน้า" ด้านล่างแทน';
    case 'auth/network-request-failed':
      return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ยืนยันตัวตนได้ กรุณาตรวจสอบอินเทอร์เน็ต หรือลองเปลี่ยนจาก Wi-Fi โรงพยาบาลเป็นเน็ตมือถือ';
    case 'auth/internal-error':
      return 'เบราว์เซอร์ขัดขวางการเชื่อมต่อ Google ชั่วคราว (อาจเปิดผ่าน LINE / โหมดไม่ระบุตัวตน) — กรุณาเปิดลิงก์ใน Chrome หรือ Safari แล้วลองเข้าสู่ระบบแบบเต็มหน้า';
    case 'auth/user-disabled':
      return 'บัญชีผู้ใช้งานนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ';
    default: {
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
  evaluationsReadable: boolean | null;
  evaluationsMessage: string | null;
  hostname: string;
  isPrivateDevUrl: boolean;
  domainAuthorized: boolean | null;
  inAppBrowser: InAppBrowserInfo;
  signedInEmail: string | null;
  signInProvider: string | null;
  emailVerified: boolean | null;
  tokenEmailVerified: boolean | null;
  cloudAuthorized: boolean | null;
}

export async function diagnoseFirebaseConnection(): Promise<FirebaseDiagnosticResult> {
  const networkOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isPrivateDevUrl = /^ais-dev-/.test(hostname);
  const inAppBrowser = detectInAppBrowser();
  const currentUser = auth.currentUser;

  let tokenEmailVerified: boolean | null = null;
  let signInProvider: string | null = null;
  if (currentUser) {
    try {
      const tokenResult = await currentUser.getIdTokenResult();
      tokenEmailVerified = Boolean(tokenResult.claims?.email_verified);
      signInProvider =
        typeof tokenResult.signInProvider === 'string'
          ? tokenResult.signInProvider
          : currentUser.providerData?.[0]?.providerId ?? null;
    } catch {
      tokenEmailVerified = null;
      signInProvider = currentUser.providerData?.[0]?.providerId ?? null;
    }
  }

  // Live check whether current hostname is in Firebase Auth Authorized Domains
  let domainAuthorized: boolean | null = null;
  if (networkOnline && hostname) {
    try {
      const resp = await fetch(
        `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      );
      if (resp.ok) {
        const cfg = (await resp.json()) as { authorizedDomains?: string[] };
        if (Array.isArray(cfg.authorizedDomains)) {
          domainAuthorized =
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            cfg.authorizedDomains.includes(hostname);
        }
      }
    } catch {
      domainAuthorized = null;
    }
  }

  let firestoreReachable = false;
  let firestoreMessage = '';
  let evaluationsReadable: boolean | null = null;
  let evaluationsMessage: string | null = null;

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

    // If signed in, verify actual read permission on /evaluations
    if (currentUser && firestoreReachable) {
      try {
        const evalQuery = query(
          collection(db, 'evaluations'),
          where('status', 'in', ['draft', 'evaluated', 'post_op_completed', 'locked']),
          limit(1),
        );
        await getDocsFromServer(evalQuery);
        evaluationsReadable = true;
        evaluationsMessage = 'สิทธิ์อ่านข้อมูลใบประเมิน Cloud ผ่านปกติ';
      } catch (error) {
        evaluationsReadable = false;
        evaluationsMessage = getFriendlyFirestoreErrorMessage(error);
      }
    }
  }

  return {
    networkOnline,
    firestoreReachable,
    firestoreMessage,
    evaluationsReadable,
    evaluationsMessage,
    hostname,
    isPrivateDevUrl,
    domainAuthorized,
    inAppBrowser,
    signedInEmail: currentUser?.email ?? null,
    signInProvider,
    emailVerified: currentUser ? Boolean(currentUser.emailVerified) : null,
    tokenEmailVerified,
    cloudAuthorized: currentUser ? isCloudAuthorizedUser(currentUser) : null,
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
