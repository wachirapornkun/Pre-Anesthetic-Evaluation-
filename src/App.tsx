import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, reload, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Download,
  FileCode2,
  FilePlus2,
  FolderOpen,
  LogIn,
  LogOut,
  Printer,
  QrCode,
  RefreshCw,
  Save,
  Search,
  UploadCloud,
  X,
} from 'lucide-react';
import { A4PrintSheet } from './components/A4PrintSheet';
import { AuthModal } from './components/AuthModal';
import { CaseFolderSidebar } from './components/CaseFolderSidebar';
import { ClinicalSummaryBar } from './components/ClinicalSummaryBar';
import { DashboardView } from './components/DashboardView';
import { PostOpA4PrintSheet } from './components/PostOpA4PrintSheet';
import { PostOpEvaluationForm } from './components/PostOpEvaluationForm';
import { PreAnestheticForm } from './components/PreAnestheticForm';
import { RegistryView } from './components/RegistryView';
import { ShareQrModal } from './components/ShareQrModal';
import { ThaiDateInput } from './components/ThaiDateInput';
import {
  auth,
  db,
  getFirestoreErrorCode,
  getFriendlyAuthErrorMessage,
  getFriendlyFirestoreErrorMessage,
  googleProvider,
  handleFirestoreError,
  logFirestoreError,
  OperationType,
} from './firebase';
import {
  addDaysToIsoDate,
  compareByDateAndSurgeon,
  createEmptyEvaluation,
  DEFAULT_HT_ITEMS,
  DEFAULT_MEDICATION_GROUPS,
  DEFAULT_OXYGEN_OTHER_PRESETS,
  DEFAULT_SPECIALTY_LIST,
  DEFAULT_SUMMARIZER_LIST,
  DEFAULT_SURGEON_LIST,
  DEFAULT_THYROID_ITEMS,
  DEFAULT_WARD_LIST,
  formatThaiDateBE,
  formatThaiScheduleDate,
  generateEvaluationId,
  getTodayIsoDate,
  hydrateEvaluationRecord,
  inferPatientGender,
  isSampleEvaluationRecord,
  MedicationGroup,
  OR_ROOM_OPTIONS,
  PreAnestheticEvaluation,
  sanitizeEvaluationForFirestore,
  sanitizeMedicationGroups,
  sanitizeOxygenPresets,
  sanitizeSpecialtyList,
  sanitizeSummarizerList,
  sanitizeSurgeonList,
  sanitizeWardList,
  ScheduleType,
} from './types/evaluation';
import { exportEvaluationJson, exportEvaluationsCsv, exportSingleHtmlReport } from './utils/exportReports';
import { handleFormTabNavigation } from './utils/formTabNavigation';

type ActiveTab = 'form' | 'post_op' | 'dashboard' | 'registry' | 'print_preview';
type PrintSheetMode = 'pre_op' | 'post_op' | 'both';

interface NewFormScheduleDraft {
  hn: string;
  patientName: string;
  dateOfOperation: string;
  surgeon: string;
  scheduleType: ScheduleType;
  orRoom: string;
  caseOrder: string;
  operationTime: string;
}

const LOCAL_RECORDS_STORAGE_KEY = 'bph_local_evaluations_v1';
const ACTIVE_DRAFT_STORAGE_KEY = 'bph_active_draft_v1';
const SYNCED_CLOUD_IDS_STORAGE_KEY = 'bph_synced_cloud_ids_v1';
const SHARED_EVALUATION_STATUSES = ['draft', 'evaluated', 'post_op_completed', 'locked'] as const;

function loadSyncedCloudIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SYNCED_CLOUD_IDS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0));
  } catch {
    return new Set();
  }
}

function persistSyncedCloudIds(ids: Set<string>) {
  try {
    localStorage.setItem(SYNCED_CLOUD_IDS_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-2000)));
  } catch {
    // ignore storage quota errors
  }
}

function loadSavedLocalRecords(): PreAnestheticEvaluation[] {
  try {
    const raw = localStorage.getItem(LOCAL_RECORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const hydratedList: PreAnestheticEvaluation[] = [];
    for (const item of parsed) {
      try {
        const hydrated = hydrateEvaluationRecord(item, undefined, 'local');
        if (!hydrated || isSampleEvaluationRecord(hydrated)) continue;
        hydratedList.push(hydrated);
      } catch {
        // Skip only an unparseable item so all other saved records remain intact
      }
    }
    return hydratedList.sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
  } catch {
    return [];
  }
}

function loadActiveDraftOrEmpty(): PreAnestheticEvaluation {
  try {
    const raw = localStorage.getItem(ACTIVE_DRAFT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const hydrated = hydrateEvaluationRecord(parsed, undefined, 'local');
      if (hydrated && !isSampleEvaluationRecord(hydrated)) {
        return hydrated;
      }
    }
  } catch {
    // ignore storage error
  }
  return createEmptyEvaluation('local');
}

function buildRecordFingerprint(rec: PreAnestheticEvaluation): string {
  const sanitized = sanitizeEvaluationForFirestore(rec, 'fp');
  return JSON.stringify(sanitized);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('form');
  const [printSheetMode, setPrintSheetMode] = useState<PrintSheetMode>('both');
  const [user, setUser] = useState<User | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShareQrOpen, setIsShareQrOpen] = useState(false);
  const [allowOfflineBypass, setAllowOfflineBypass] = useState(false);
  const isVerifiedCloudUser = Boolean(user && isEmailVerified);
  const [cloudRecords, setCloudRecords] = useState<PreAnestheticEvaluation[]>([]);
  const [localRecords, setLocalRecords] = useState<PreAnestheticEvaluation[]>(() =>
    loadSavedLocalRecords(),
  );
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isPullingCloud, setIsPullingCloud] = useState(false);
  const [showFolderSidebar, setShowFolderSidebar] = useState(true);
  const [registryFocusNonce, setRegistryFocusNonce] = useState(0);
  const [currentForm, setCurrentForm] = useState<PreAnestheticEvaluation>(() =>
    loadActiveDraftOrEmpty(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudRetryNonce, setCloudRetryNonce] = useState(0);
  const [remoteUpdateCandidate, setRemoteUpdateCandidate] =
    useState<PreAnestheticEvaluation | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const purgedSampleIdsRef = useRef<Set<string>>(new Set());
  const knownCloudIdsRef = useRef<Set<string>>(loadSyncedCloudIds());
  const inFlightWritesRef = useRef<Map<string, Promise<void>>>(new Map());
  const deletedIdsRef = useRef<Set<string>>(new Set());
  const autoSyncedUidRef = useRef<string | null>(null);
  const lastLocalFpRef = useRef<Map<string, string>>(new Map());
  const lastCloudFpRef = useRef<Map<string, string>>(new Map());
  const lastUserEditAtRef = useRef<number>(0);
  const dirtyFormIdRef = useRef<string | null>(null);
  const firstDirtyAtRef = useRef<number>(0);
  const pendingCloudSaveRef = useRef<{ record: PreAnestheticEvaluation; fp: string } | null>(null);
  const cloudRetryAttemptsRef = useRef<number>(0);
  const lastHiddenAtRef = useRef<number>(0);
  const lastForegroundPullAtRef = useRef<number>(0);
  const currentFormRef = useRef<PreAnestheticEvaluation>(currentForm);
  currentFormRef.current = currentForm;
  const userRef = useRef<User | null>(user);
  userRef.current = user;
  const cloudRecordsRef = useRef<PreAnestheticEvaluation[]>(cloudRecords);
  cloudRecordsRef.current = cloudRecords;
  const [isNewFormModalOpen, setIsNewFormModalOpen] = useState(false);
  const [newFormDraft, setNewFormDraft] = useState<NewFormScheduleDraft>(() => ({
    hn: '',
    patientName: '',
    dateOfOperation: getTodayIsoDate(),
    surgeon: '',
    scheduleType: 'elective',
    orRoom: '',
    caseOrder: '',
    operationTime: '',
  }));
  const [hasCloudCatalog, setHasCloudCatalog] = useState(false);
  const [hasCloudWardCatalog, setHasCloudWardCatalog] = useState(false);
  const [hasCloudSurgeonCatalog, setHasCloudSurgeonCatalog] = useState(false);
  const [hasCloudOxygenCatalog, setHasCloudOxygenCatalog] = useState(false);
  const [hasCloudSummarizerCatalog, setHasCloudSummarizerCatalog] = useState(false);
  const [hasCloudVisitorCatalog, setHasCloudVisitorCatalog] = useState(false);
  const [hasCloudSpecialtyCatalog, setHasCloudSpecialtyCatalog] = useState(false);
  const [wardOptions, setWardOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bph_ward_list_v1');
      if (saved) return sanitizeWardList(JSON.parse(saved));
    } catch {
      // ignore storage error
    }
    return [...DEFAULT_WARD_LIST];
  });
  const [specialtyOptions, setSpecialtyOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bph_specialty_list_v1');
      if (saved) return sanitizeSpecialtyList(JSON.parse(saved));
    } catch {
      // ignore storage error
    }
    return [...DEFAULT_SPECIALTY_LIST];
  });
  const [surgeonOptions, setSurgeonOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bph_surgeon_list_v1');
      if (saved) return sanitizeSurgeonList(JSON.parse(saved));
    } catch {
      // ignore storage error
    }
    return [...DEFAULT_SURGEON_LIST];
  });
  const [oxygenPresets, setOxygenPresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bph_oxygen_presets_v1');
      if (saved) return sanitizeOxygenPresets(JSON.parse(saved));
    } catch {
      // ignore storage error
    }
    return [...DEFAULT_OXYGEN_OTHER_PRESETS];
  });
  const [summarizerOptions, setSummarizerOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bph_summarizer_list_v1');
      if (saved) return sanitizeSummarizerList(JSON.parse(saved));
    } catch {
      // ignore storage error
    }
    return [...DEFAULT_SUMMARIZER_LIST];
  });
  const [visitorOptions, setVisitorOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bph_visitor_list_v1');
      if (saved) return sanitizeSummarizerList(JSON.parse(saved));
    } catch {
      // ignore storage error
    }
    return [...DEFAULT_SUMMARIZER_LIST];
  });
  const ensureOtherGroupOnce = (groups: MedicationGroup[]): MedicationGroup[] => {
    try {
      const migrated = localStorage.getItem('bph_med_other_added_v1');
      if (!migrated && !groups.some((g) => g.id === 'other')) {
        localStorage.setItem('bph_med_other_added_v1', '1');
        return [...groups, { id: 'other', label: '11. ยาอื่นๆ', items: [] }];
      }
      if (!migrated) {
        localStorage.setItem('bph_med_other_added_v1', '1');
      }
    } catch {
      // ignore storage error
    }
    return groups;
  };
  const applyMedicationCatalogUpdatesOnce = (
    groups: MedicationGroup[],
    storageKey: string,
  ): { groups: MedicationGroup[]; changed: boolean } => {
    try {
      if (localStorage.getItem(storageKey)) {
        return { groups, changed: false };
      }
      localStorage.setItem(storageKey, '1');
    } catch {
      // ignore storage error
    }

    let changed = false;
    let next = groups.map((g) => ({ ...g, items: [...g.items] }));

    const htGroup = next.find((g) => g.id === 'ht');
    if (htGroup) {
      const existingLower = new Set(htGroup.items.map((it) => it.trim().toLowerCase()));
      for (const item of DEFAULT_HT_ITEMS) {
        if (!existingLower.has(item.trim().toLowerCase()) && htGroup.items.length < 30) {
          htGroup.items.push(item);
          existingLower.add(item.trim().toLowerCase());
          changed = true;
        }
      }
    }

    if (!next.some((g) => g.id === 'thyroid')) {
      const thyroidGroup: MedicationGroup = {
        id: 'thyroid',
        label: '10. ยาไทรอยด์ (Thyroid)',
        items: [...DEFAULT_THYROID_ITEMS],
      };
      const otherIdx = next.findIndex((g) => g.id === 'other');
      if (otherIdx !== -1) {
        if (next[otherIdx].label === '10. ยาอื่นๆ') {
          next[otherIdx] = { ...next[otherIdx], label: '11. ยาอื่นๆ' };
        }
        next = [...next.slice(0, otherIdx), thyroidGroup, ...next.slice(otherIdx)];
      } else {
        next = [...next, thyroidGroup];
      }
      changed = true;
    }

    return { groups: next.slice(0, 20), changed };
  };
  const [medicationGroups, setMedicationGroups] = useState<MedicationGroup[]>(() => {
    try {
      const saved = localStorage.getItem('bph_med_groups_v1');
      if (saved) {
        const base = ensureOtherGroupOnce(sanitizeMedicationGroups(JSON.parse(saved)));
        const upgraded = applyMedicationCatalogUpdatesOnce(base, 'bph_med_thyroid_ht_v1');
        if (upgraded.changed) {
          localStorage.setItem('bph_med_groups_v1', JSON.stringify(upgraded.groups));
        }
        return upgraded.groups;
      }
    } catch {
      // ignore storage error
    }
    return sanitizeMedicationGroups(DEFAULT_MEDICATION_GROUPS);
  });

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
  };

  useEffect(() => {
    if (!notice) return;
    const duration = notice.type === 'error' ? 7000 : 3800;
    const timer = setTimeout(() => setNotice(null), duration);
    return () => clearTimeout(timer);
  }, [notice]);

  // Seed initial local fingerprints once on mount so viewing saved records doesn't trigger redundant writes
  useEffect(() => {
    localRecords.forEach((rec) => {
      lastLocalFpRef.current.set(rec.id, buildRecordFingerprint(rec));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist local evaluations to browser localStorage so saved pre-visit drafts survive refresh
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_RECORDS_STORAGE_KEY, JSON.stringify(localRecords));
    } catch {
      // ignore storage quota errors
    }
  }, [localRecords]);

  // Auto-save active form draft so unsaved work is never lost on refresh
  useEffect(() => {
    try {
      const hasDraftInput = Boolean(
        currentForm.patientName.trim() ||
          currentForm.hn.trim() ||
          currentForm.an.trim() ||
          currentForm.diagnosis.trim() ||
          currentForm.operation.trim(),
      );
      if (hasDraftInput) {
        localStorage.setItem(ACTIVE_DRAFT_STORAGE_KEY, JSON.stringify(currentForm));
      } else {
        localStorage.removeItem(ACTIVE_DRAFT_STORAGE_KEY);
      }
    } catch {
      // ignore storage quota errors
    }
  }, [currentForm]);

  // Listen to Firebase Auth state and ensure ID token claims (email_verified) stay fresh
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!active) return;
      if (!nextUser) {
        setUser(null);
        setIsEmailVerified(false);
        setAuthReady(true);
        setCloudRecords([]);
        setCloudError(null);
        setRemoteUpdateCandidate(null);
        setIsLoadingRecords(false);
        return;
      }

      const syncVerifiedState = async () => {
        let verified = Boolean(nextUser.emailVerified);
        if (!verified) {
          try {
            await reload(nextUser);
            verified = Boolean(auth.currentUser?.emailVerified);
          } catch {
            // Keep existing state when offline
          }
        }
        if (verified) {
          try {
            const tokenResult = await nextUser.getIdTokenResult();
            if (tokenResult.claims?.email_verified !== true) {
              await nextUser.getIdToken(true);
            }
          } catch {
            // Keep existing token when offline
          }
        }
        if (!active) return;
        const latestUser = auth.currentUser ?? nextUser;
        setUser(latestUser);
        setIsEmailVerified(verified);
        setAuthReady(true);
        if (verified) {
          setAllowOfflineBypass(false);
          setIsAuthModalOpen(false);
        } else {
          setCloudRecords([]);
          setCloudError(null);
          setRemoteUpdateCandidate(null);
          setIsLoadingRecords(false);
        }
      };

      void syncVerifiedState();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const applyCloudSnapshot = (
    items: PreAnestheticEvaluation[],
    options: { fromServer: boolean; hasPendingWrites: boolean },
  ) => {
    items.sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
    const nextCloudIds = new Set(items.map((item) => item.id));
    const prevKnownCloudIds = new Set(knownCloudIdsRef.current);
    const prevCloudFpSnapshot = new Map(lastCloudFpRef.current);

    nextCloudIds.forEach((id) => knownCloudIdsRef.current.add(id));
    deletedIdsRef.current.forEach((id) => knownCloudIdsRef.current.delete(id));

    // When authoritative server snapshot arrives, detect records deleted remotely by colleagues
    const remotelyDeletedIds = new Set<string>();
    if (options.fromServer) {
      prevKnownCloudIds.forEach((id) => {
        if (!nextCloudIds.has(id) && !inFlightWritesRef.current.has(id)) {
          remotelyDeletedIds.add(id);
          knownCloudIdsRef.current.delete(id);
          lastCloudFpRef.current.delete(id);
        }
      });
      persistSyncedCloudIds(knownCloudIdsRef.current);
    }

    items.forEach((item) => {
      const fp = buildRecordFingerprint(item);
      lastCloudFpRef.current.set(item.id, fp);
      if (dirtyFormIdRef.current !== item.id) {
        lastLocalFpRef.current.set(item.id, fp);
      }
    });

    setCloudRecords(items);
    setCloudError(null);
    setIsLoadingRecords(false);

    // Mirror Cloud records into localStorage cache while pruning records deleted remotely on Cloud
    // and preserving genuinely unsynced local-only records or active in-flight writes
    setLocalRecords((prev) => {
      const keptLocal = prev.filter((r) => {
        if (nextCloudIds.has(r.id) || deletedIdsRef.current.has(r.id)) return false;
        if (options.fromServer) {
          if (inFlightWritesRef.current.has(r.id)) return true;
          if (remotelyDeletedIds.has(r.id)) return false;
          if (r.ownerId && r.ownerId !== 'local') return false;
        }
        return true;
      });
      return [...items, ...keptLocal].sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
    });

    // Real-time sync for the currently open record when another user/device updates or deletes it
    const activeOpen = currentFormRef.current;
    const remoteMatch = items.find((it) => it.id === activeOpen.id);
    const isDirtyCurrent = dirtyFormIdRef.current === activeOpen.id;
    const isWritingCurrent = inFlightWritesRef.current.has(activeOpen.id);

    if (remoteMatch && !options.hasPendingWrites && !isWritingCurrent) {
      const remoteFp = buildRecordFingerprint(remoteMatch);
      const localFp = buildRecordFingerprint(activeOpen);
      const prevCloudFp = prevCloudFpSnapshot.get(activeOpen.id);
      const hasUnsavedLocalDiff = isDirtyCurrent && localFp !== remoteFp && localFp !== prevCloudFp;

      if (remoteFp === localFp) {
        dirtyFormIdRef.current = null;
        firstDirtyAtRef.current = 0;
        pendingCloudSaveRef.current = null;
        setRemoteUpdateCandidate((prev) => (prev?.id === activeOpen.id ? null : prev));
      } else if (!hasUnsavedLocalDiff) {
        dirtyFormIdRef.current = null;
        firstDirtyAtRef.current = 0;
        pendingCloudSaveRef.current = null;
        lastLocalFpRef.current.set(remoteMatch.id, remoteFp);
        setRemoteUpdateCandidate((prev) => (prev?.id === activeOpen.id ? null : prev));
        setCurrentForm(remoteMatch);
      } else if (remoteFp !== prevCloudFp) {
        // Colleague updated the same record while this clinician also has unsaved local edits
        setRemoteUpdateCandidate(remoteMatch);
      }
    } else if (
      options.fromServer &&
      !remoteMatch &&
      remotelyDeletedIds.has(activeOpen.id) &&
      !isDirtyCurrent &&
      !isWritingCurrent
    ) {
      setRemoteUpdateCandidate(null);
      setCurrentForm(createEmptyEvaluation(userRef.current?.uid || 'local'));
      showNotice('success', 'รายการที่เปิดอยู่ถูกลบออกจากระบบโดยผู้ใช้อื่นแล้ว');
    }
  };

  // Attach shared real-time Firestore listener ONLY when authReady and user is authenticated & verified
  useEffect(() => {
    if (!authReady || !user || !isEmailVerified) return;

    setIsLoadingRecords(true);
    setCloudError(null);
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const path = 'evaluations';
    const q = query(
      collection(db, path),
      where('status', 'in', [...SHARED_EVALUATION_STATUSES]),
    );

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        cloudRetryAttemptsRef.current = 0;
        const items: PreAnestheticEvaluation[] = [];
        const sampleIdsToDelete: string[] = [];
        snapshot.forEach((docSnap) => {
          try {
            const raw = docSnap.data() as PreAnestheticEvaluation;
            const docId = docSnap.id || raw?.id;
            if (isSampleEvaluationRecord({ id: docId, hn: raw?.hn ?? '', patientName: raw?.patientName ?? '' })) {
              if (docId && raw?.ownerId === user.uid && !purgedSampleIdsRef.current.has(docId)) {
                sampleIdsToDelete.push(docId);
              }
              return;
            }
            const hydrated = hydrateEvaluationRecord(raw, docId, user.uid);
            if (hydrated && !deletedIdsRef.current.has(hydrated.id)) {
              items.push(hydrated);
            }
          } catch {
            // Protect all other records if any single legacy document has unexpected fields
          }
        });

        applyCloudSnapshot(items, {
          fromServer: !snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        });

        if (sampleIdsToDelete.length > 0) {
          sampleIdsToDelete.forEach((id) => purgedSampleIdsRef.current.add(id));
          setCurrentForm((prev) =>
            sampleIdsToDelete.includes(prev.id) ? createEmptyEvaluation(user.uid) : prev,
          );
          const batch = writeBatch(db);
          sampleIdsToDelete.forEach((id) => {
            batch.delete(doc(db, path, id));
          });
          batch
            .commit()
            .then(() => {
              showNotice(
                'success',
                `ลบข้อมูลเคสตัวอย่างออกเรียบร้อยแล้ว (${sampleIdsToDelete.length} รายการ) พร้อมบันทึกข้อมูลจริง`,
              );
            })
            .catch((error) => {
              sampleIdsToDelete.forEach((id) => purgedSampleIdsRef.current.delete(id));
              logFirestoreError(error, OperationType.DELETE, path);
            });
        }
      },
      (error) => {
        setIsLoadingRecords(false);
        logFirestoreError(error, OperationType.LIST, path);
        const friendly = getFriendlyFirestoreErrorMessage(error);
        setCloudError(friendly);
        showNotice('error', `โหลดข้อมูลจาก Cloud ไม่สำเร็จ: ${friendly}`);

        // Auto-recover transient stream drops with exponential backoff (up to 5 attempts)
        const code = getFirestoreErrorCode(error);
        if (code !== 'permission-denied' && cloudRetryAttemptsRef.current < 5) {
          cloudRetryAttemptsRef.current += 1;
          const delayMs = Math.min(2000 * cloudRetryAttemptsRef.current, 10000);
          retryTimer = setTimeout(() => {
            setCloudRetryNonce((n) => n + 1);
          }, delayMs);
        }
      },
    );

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user, isEmailVerified, cloudRetryNonce]);

  // Attach Firestore listener for customizable medication catalog when authenticated & verified
  useEffect(() => {
    if (!authReady || !user || !isEmailVerified) {
      setHasCloudCatalog(false);
      return;
    }

    const catalogPath = `medicationCatalogs/${user.uid}`;
    const catalogRef = doc(db, 'medicationCatalogs', user.uid);
    const unsubscribe = onSnapshot(
      catalogRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setHasCloudCatalog(true);
          const data = docSnap.data();
          const sanitized = sanitizeMedicationGroups(data?.groups);
          const withOther = sanitized.some((g) => g.id === 'other')
            ? sanitized
            : (() => {
                try {
                  if (!localStorage.getItem('bph_med_other_cloud_v1')) {
                    localStorage.setItem('bph_med_other_cloud_v1', '1');
                    return [...sanitized, { id: 'other', label: '11. ยาอื่นๆ', items: [] }];
                  }
                } catch {
                  // ignore storage error
                }
                return sanitized;
              })();
          const upgraded = applyMedicationCatalogUpdatesOnce(
            withOther,
            `bph_med_thyroid_ht_cloud_v1_${user.uid}`,
          );
          setMedicationGroups(upgraded.groups);
          try {
            localStorage.setItem('bph_med_groups_v1', JSON.stringify(upgraded.groups));
          } catch {
            // ignore storage error
          }
          if (upgraded.changed) {
            updateDoc(catalogRef, {
              groups: upgraded.groups,
              updatedAt: serverTimestamp(),
            }).catch(() => {
              // ignore silent catalog sync error
            });
          }
        } else {
          setHasCloudCatalog(false);
        }
      },
      (error) => {
        logFirestoreError(error, OperationType.GET, catalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user, isEmailVerified]);

  const handleUpdateMedicationGroups = async (nextGroups: MedicationGroup[]) => {
    const clean = sanitizeMedicationGroups(nextGroups);
    setMedicationGroups(clean);
    try {
      localStorage.setItem('bph_med_groups_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user || !isEmailVerified) {
      showNotice('success', 'อัปเดตรายการยากลุ่มโรคเรียบร้อย');
      return;
    }
    const catalogPath = `medicationCatalogs/${user.uid}`;
    const catalogRef = doc(db, 'medicationCatalogs', user.uid);
    try {
      if (hasCloudCatalog) {
        await updateDoc(catalogRef, {
          groups: clean,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(catalogRef, {
          id: user.uid,
          ownerId: user.uid,
          groups: clean,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setHasCloudCatalog(true);
      }
      showNotice('success', 'อัปเดตรายการยากลุ่มโรคเรียบร้อย');
    } catch (error) {
      handleFirestoreError(
        error,
        hasCloudCatalog ? OperationType.UPDATE : OperationType.CREATE,
        catalogPath,
      );
    }
  };

  // Attach Firestore listener for customizable ward catalog when authenticated
  useEffect(() => {
    if (!authReady || !user || !isEmailVerified) {
      setHasCloudWardCatalog(false);
      return;
    }

    const wardCatalogPath = `wardCatalogs/${user.uid}`;
    const wardCatalogRef = doc(db, 'wardCatalogs', user.uid);
    const unsubscribe = onSnapshot(
      wardCatalogRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setHasCloudWardCatalog(true);
          const data = docSnap.data();
          const sanitized = sanitizeWardList(data?.wards);
          setWardOptions(sanitized);
          try {
            localStorage.setItem('bph_ward_list_v1', JSON.stringify(sanitized));
          } catch {
            // ignore storage error
          }
        } else {
          setHasCloudWardCatalog(false);
        }
      },
      (error) => {
        logFirestoreError(error, OperationType.GET, wardCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user, isEmailVerified]);

  const handleUpdateWardOptions = async (nextWards: string[]) => {
    const clean = sanitizeWardList(nextWards);
    setWardOptions(clean);
    try {
      localStorage.setItem('bph_ward_list_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user || !isEmailVerified) {
      showNotice('success', 'อัปเดตรายการหอผู้ป่วยเรียบร้อย');
      return;
    }

    const wardCatalogPath = `wardCatalogs/${user.uid}`;
    const wardCatalogRef = doc(db, 'wardCatalogs', user.uid);
    try {
      if (hasCloudWardCatalog) {
        await updateDoc(wardCatalogRef, {
          wards: clean,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(wardCatalogRef, {
          id: user.uid,
          ownerId: user.uid,
          wards: clean,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setHasCloudWardCatalog(true);
      }
      showNotice('success', 'อัปเดตรายการหอผู้ป่วยเรียบร้อย');
    } catch (error) {
      handleFirestoreError(
        error,
        hasCloudWardCatalog ? OperationType.UPDATE : OperationType.CREATE,
        wardCatalogPath,
      );
    }
  };

  // Attach Firestore listener for customizable surgeon catalog when authenticated
  useEffect(() => {
    if (!authReady || !user || !isEmailVerified) {
      setHasCloudSurgeonCatalog(false);
      return;
    }

    const surgeonCatalogPath = `surgeonCatalogs/${user.uid}`;
    const surgeonCatalogRef = doc(db, 'surgeonCatalogs', user.uid);
    const unsubscribe = onSnapshot(
      surgeonCatalogRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setHasCloudSurgeonCatalog(true);
          const data = docSnap.data();
          const sanitized = sanitizeSurgeonList(data?.surgeons);
          setSurgeonOptions(sanitized);
          try {
            localStorage.setItem('bph_surgeon_list_v1', JSON.stringify(sanitized));
          } catch {
            // ignore storage error
          }
        } else {
          setHasCloudSurgeonCatalog(false);
        }
      },
      (error) => {
        logFirestoreError(error, OperationType.GET, surgeonCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user, isEmailVerified]);

  const handleUpdateSurgeonOptions = async (nextSurgeons: string[]) => {
    const clean = sanitizeSurgeonList(nextSurgeons);
    setSurgeonOptions(clean);
    try {
      localStorage.setItem('bph_surgeon_list_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user || !isEmailVerified) {
      showNotice('success', 'อัปเดตรายชื่อแพทย์ผ่าตัดเรียบร้อย');
      return;
    }

    const surgeonCatalogPath = `surgeonCatalogs/${user.uid}`;
    const surgeonCatalogRef = doc(db, 'surgeonCatalogs', user.uid);
    try {
      if (hasCloudSurgeonCatalog) {
        await updateDoc(surgeonCatalogRef, {
          surgeons: clean,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(surgeonCatalogRef, {
          id: user.uid,
          ownerId: user.uid,
          surgeons: clean,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setHasCloudSurgeonCatalog(true);
      }
      showNotice('success', 'อัปเดตรายชื่อแพทย์ผ่าตัดเรียบร้อย');
    } catch (error) {
      handleFirestoreError(
        error,
        hasCloudSurgeonCatalog ? OperationType.UPDATE : OperationType.CREATE,
        surgeonCatalogPath,
      );
    }
  };

  // Attach Firestore listener for customizable oxygen presets catalog when authenticated
  useEffect(() => {
    if (!authReady || !user || !isEmailVerified) {
      setHasCloudOxygenCatalog(false);
      return;
    }

    const oxygenCatalogPath = `oxygenCatalogs/${user.uid}`;
    const oxygenCatalogRef = doc(db, 'oxygenCatalogs', user.uid);
    const unsubscribe = onSnapshot(
      oxygenCatalogRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setHasCloudOxygenCatalog(true);
          const data = docSnap.data();
          const sanitized = sanitizeOxygenPresets(data?.presets);
          setOxygenPresets(sanitized);
          try {
            localStorage.setItem('bph_oxygen_presets_v1', JSON.stringify(sanitized));
          } catch {
            // ignore storage error
          }
        } else {
          setHasCloudOxygenCatalog(false);
        }
      },
      (error) => {
        logFirestoreError(error, OperationType.GET, oxygenCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user, isEmailVerified]);

  const handleUpdateOxygenPresets = async (nextPresets: string[]) => {
    const clean = sanitizeOxygenPresets(nextPresets);
    setOxygenPresets(clean);
    try {
      localStorage.setItem('bph_oxygen_presets_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user || !isEmailVerified) {
      showNotice('success', 'อัปเดตตัวเลือกการให้ออกซิเจนเรียบร้อย');
      return;
    }

    const oxygenCatalogPath = `oxygenCatalogs/${user.uid}`;
    const oxygenCatalogRef = doc(db, 'oxygenCatalogs', user.uid);
    try {
      if (hasCloudOxygenCatalog) {
        await updateDoc(oxygenCatalogRef, {
          presets: clean,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(oxygenCatalogRef, {
          id: user.uid,
          ownerId: user.uid,
          presets: clean,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setHasCloudOxygenCatalog(true);
      }
      showNotice('success', 'อัปเดตตัวเลือกการให้ออกซิเจนเรียบร้อย');
    } catch (error) {
      handleFirestoreError(
        error,
        hasCloudOxygenCatalog ? OperationType.UPDATE : OperationType.CREATE,
        oxygenCatalogPath,
      );
    }
  };

  // Attach Firestore listener for customizable summarizer catalog when authenticated
  useEffect(() => {
    if (!authReady || !user || !isEmailVerified) {
      setHasCloudSummarizerCatalog(false);
      return;
    }

    const summarizerCatalogPath = `summarizerCatalogs/${user.uid}`;
    const summarizerCatalogRef = doc(db, 'summarizerCatalogs', user.uid);
    const unsubscribe = onSnapshot(
      summarizerCatalogRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setHasCloudSummarizerCatalog(true);
          const data = docSnap.data();
          const sanitized = sanitizeSummarizerList(data?.summarizers);
          setSummarizerOptions(sanitized);
          try {
            localStorage.setItem('bph_summarizer_list_v1', JSON.stringify(sanitized));
          } catch {
            // ignore storage error
          }
        } else {
          setHasCloudSummarizerCatalog(false);
        }
      },
      (error) => {
        logFirestoreError(error, OperationType.GET, summarizerCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user, isEmailVerified]);

  const handleUpdateSummarizerOptions = async (nextSummarizers: string[]) => {
    const clean = sanitizeSummarizerList(nextSummarizers);
    setSummarizerOptions(clean);
    try {
      localStorage.setItem('bph_summarizer_list_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user || !isEmailVerified) {
      showNotice('success', 'อัปเดตรายชื่อผู้สรุป (Summarized by) เรียบร้อย');
      return;
    }

    const summarizerCatalogPath = `summarizerCatalogs/${user.uid}`;
    const summarizerCatalogRef = doc(db, 'summarizerCatalogs', user.uid);
    try {
      if (hasCloudSummarizerCatalog) {
        await updateDoc(summarizerCatalogRef, {
          summarizers: clean,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(summarizerCatalogRef, {
          id: user.uid,
          ownerId: user.uid,
          summarizers: clean,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setHasCloudSummarizerCatalog(true);
      }
      showNotice('success', 'อัปเดตรายชื่อผู้สรุป (Summarized by) เรียบร้อย');
    } catch (error) {
      handleFirestoreError(
        error,
        hasCloudSummarizerCatalog ? OperationType.UPDATE : OperationType.CREATE,
        summarizerCatalogPath,
      );
    }
  };

  // Attach Firestore listener for customizable visitor catalog when authenticated
  useEffect(() => {
    if (!authReady || !user || !isEmailVerified) {
      setHasCloudVisitorCatalog(false);
      return;
    }

    const visitorCatalogPath = `visitorCatalogs/${user.uid}`;
    const visitorCatalogRef = doc(db, 'visitorCatalogs', user.uid);
    const unsubscribe = onSnapshot(
      visitorCatalogRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setHasCloudVisitorCatalog(true);
          const data = docSnap.data();
          const sanitized = sanitizeSummarizerList(data?.visitors);
          setVisitorOptions(sanitized);
          try {
            localStorage.setItem('bph_visitor_list_v1', JSON.stringify(sanitized));
          } catch {
            // ignore storage error
          }
        } else {
          setHasCloudVisitorCatalog(false);
        }
      },
      (error) => {
        logFirestoreError(error, OperationType.GET, visitorCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user, isEmailVerified]);

  const handleUpdateVisitorOptions = async (nextVisitors: string[]) => {
    const clean = sanitizeSummarizerList(nextVisitors);
    setVisitorOptions(clean);
    try {
      localStorage.setItem('bph_visitor_list_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user || !isEmailVerified) {
      showNotice('success', 'อัปเดตรายชื่อผู้เยี่ยม (visit by) เรียบร้อย');
      return;
    }

    const visitorCatalogPath = `visitorCatalogs/${user.uid}`;
    const visitorCatalogRef = doc(db, 'visitorCatalogs', user.uid);
    try {
      if (hasCloudVisitorCatalog) {
        await updateDoc(visitorCatalogRef, {
          visitors: clean,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(visitorCatalogRef, {
          id: user.uid,
          ownerId: user.uid,
          visitors: clean,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setHasCloudVisitorCatalog(true);
      }
      showNotice('success', 'อัปเดตรายชื่อผู้เยี่ยม (visit by) เรียบร้อย');
    } catch (error) {
      handleFirestoreError(
        error,
        hasCloudVisitorCatalog ? OperationType.UPDATE : OperationType.CREATE,
        visitorCatalogPath,
      );
    }
  };

  // Attach Firestore listener for customizable specialty catalog when authenticated
  useEffect(() => {
    if (!authReady || !user || !isEmailVerified) {
      setHasCloudSpecialtyCatalog(false);
      return;
    }

    const specialtyCatalogPath = `specialtyCatalogs/${user.uid}`;
    const specialtyCatalogRef = doc(db, 'specialtyCatalogs', user.uid);
    const unsubscribe = onSnapshot(
      specialtyCatalogRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setHasCloudSpecialtyCatalog(true);
          const data = docSnap.data();
          const sanitized = sanitizeSpecialtyList(data?.specialties);
          setSpecialtyOptions(sanitized);
          try {
            localStorage.setItem('bph_specialty_list_v1', JSON.stringify(sanitized));
          } catch {
            // ignore storage error
          }
        } else {
          setHasCloudSpecialtyCatalog(false);
        }
      },
      (error) => {
        logFirestoreError(error, OperationType.GET, specialtyCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user, isEmailVerified]);

  const handleUpdateSpecialtyOptions = async (nextSpecialties: string[]) => {
    const clean = sanitizeSpecialtyList(nextSpecialties);
    setSpecialtyOptions(clean);
    try {
      localStorage.setItem('bph_specialty_list_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user || !isEmailVerified) {
      showNotice('success', 'อัปเดตรายการสาขาเรียบร้อย');
      return;
    }

    const specialtyCatalogPath = `specialtyCatalogs/${user.uid}`;
    const specialtyCatalogRef = doc(db, 'specialtyCatalogs', user.uid);
    try {
      if (hasCloudSpecialtyCatalog) {
        await updateDoc(specialtyCatalogRef, {
          specialties: clean,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(specialtyCatalogRef, {
          id: user.uid,
          ownerId: user.uid,
          specialties: clean,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setHasCloudSpecialtyCatalog(true);
      }
      showNotice('success', 'อัปเดตรายการสาขาเรียบร้อย');
    } catch (error) {
      handleFirestoreError(
        error,
        hasCloudSpecialtyCatalog ? OperationType.UPDATE : OperationType.CREATE,
        specialtyCatalogPath,
      );
    }
  };

  const resolvePreservedOwnerId = (
    rec: PreAnestheticEvaluation,
    activeUid: string,
  ): string => {
    const cloudMatch = cloudRecordsRef.current.find((r) => r.id === rec.id);
    if (cloudMatch?.ownerId && cloudMatch.ownerId !== 'local') {
      return cloudMatch.ownerId;
    }
    const existingOwner = (rec.ownerId || '').trim();
    if (existingOwner && existingOwner !== 'local') {
      return existingOwner;
    }
    return activeUid;
  };

  // Always keep all saved Pre-op evaluations permanently visible in ทะเบียน (shared Cloud + local mirror)
  const records = useMemo(() => {
    if (!isVerifiedCloudUser) return localRecords;
    const cloudIdSet = new Set(cloudRecords.map((r) => r.id));
    const localOnly = localRecords.filter((r) => !cloudIdSet.has(r.id));
    if (localOnly.length === 0) return cloudRecords;
    return [...cloudRecords, ...localOnly].sort((a, b) =>
      compareByDateAndSurgeon(a, b, 'desc'),
    );
  }, [isVerifiedCloudUser, cloudRecords, localRecords]);

  // Real-time projection: reflects unsaved Pre-op / Post-op edits immediately without shadowing live Cloud updates
  const liveRecords = useMemo(() => {
    const hasLiveIdentity = Boolean(
      currentForm.patientName.trim() || currentForm.hn.trim(),
    );
    if (!hasLiveIdentity || deletedIdsRef.current.has(currentForm.id)) {
      return records;
    }
    const existsIdx = records.findIndex((r) => r.id === currentForm.id);
    // If this record already exists in live Cloud/records and has NO unsaved local edits,
    // display the live Cloud record directly so colleagues' updates are never shadowed
    if (existsIdx !== -1 && dirtyFormIdRef.current !== currentForm.id) {
      return records;
    }
    const liveEntry: PreAnestheticEvaluation = {
      ...currentForm,
      patientName:
        currentForm.patientName.trim() || `ผู้ป่วย HN ${currentForm.hn.trim()}`,
    };
    const merged =
      existsIdx !== -1
        ? records.map((r) => (r.id === currentForm.id ? { ...r, ...liveEntry } : r))
        : [liveEntry, ...records];
    return [...merged].sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
  }, [records, currentForm]);

  const unsyncedLocalRecords = useMemo(() => {
    if (!isVerifiedCloudUser || isLoadingRecords) return [];
    const cloudIdSet = new Set(cloudRecords.map((r) => r.id));
    return localRecords.filter(
      (r) =>
        !cloudIdSet.has(r.id) &&
        r.status !== 'locked' &&
        Boolean(r.patientName.trim() || r.hn.trim()),
    );
  }, [isVerifiedCloudUser, isLoadingRecords, cloudRecords, localRecords]);
  const savedIdSet = useMemo(() => new Set(records.map((r) => r.id)), [records]);

  const handleFormChange = (next: PreAnestheticEvaluation) => {
    const now = Date.now();
    lastUserEditAtRef.current = now;
    if (dirtyFormIdRef.current !== next.id || firstDirtyAtRef.current === 0) {
      firstDirtyAtRef.current = now;
    }
    dirtyFormIdRef.current = next.id;
    setCurrentForm(next);
  };

  const buildCloudUpdatePayload = (sanitized: PreAnestheticEvaluation) => ({
    status: sanitized.status,
    patientName: sanitized.patientName,
    hn: sanitized.hn,
    an: sanitized.an,
    age: sanitized.age,
    gender: sanitized.gender ?? '',
    ward: sanitized.ward,
    bed: sanitized.bed ?? '',
    specialty: sanitized.specialty,
    dateOfVisit: sanitized.dateOfVisit,
    dateOfOperation: sanitized.dateOfOperation,
    operationTime: sanitized.operationTime,
    scheduleType: sanitized.scheduleType,
    orRoom: sanitized.orRoom,
    caseOrder: sanitized.caseOrder,
    surgeon: sanitized.surgeon,
    diagnosis: sanitized.diagnosis,
    operation: sanitized.operation,
    asaClass: sanitized.asaClass,
    asaEmergency: sanitized.asaEmergency,
    expectedDifficultAirway: sanitized.expectedDifficultAirway,
    hasComplication: sanitized.hasComplication,
    anesthesiaType: sanitized.anesthesiaType,
    formData: sanitized.formData,
    updatedAt: serverTimestamp(),
  });

  const upsertEvaluationToCloud = (
    sanitized: PreAnestheticEvaluation,
    activeUid: string,
  ): Promise<void> => {
    const docId = sanitized.id;
    const prevInFlight = inFlightWritesRef.current.get(docId) ?? Promise.resolve();

    const run = prevInFlight
      .catch(() => {
        // Previous write error shouldn't block subsequent writes for this doc
      })
      .then(async () => {
        if (!sanitized.patientName.trim()) {
          throw new Error('patientName is required for Firestore evaluation write');
        }
        const docRef = doc(db, 'evaluations', docId);
        const isKnownExisting =
          knownCloudIdsRef.current.has(docId) ||
          cloudRecords.some((r) => r.id === docId);
        const updatePayload = buildCloudUpdatePayload(sanitized);
        const createPayload = {
          ...sanitized,
          ownerId: activeUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (isKnownExisting) {
          try {
            await updateDoc(docRef, updatePayload);
          } catch (error) {
            const code = getFirestoreErrorCode(error);
            // If the document does not exist on the server (e.g. deleted remotely or stale local ID),
            // Firestore rules evaluating existing() can return permission-denied or not-found — try create once.
            if (code === 'not-found' || code === 'permission-denied') {
              await setDoc(docRef, createPayload);
            } else {
              throw error;
            }
          }
        } else {
          try {
            await setDoc(docRef, createPayload);
          } catch (error) {
            // If the document already exists on Cloud (e.g. created by a colleague or before onSnapshot refreshed),
            // setDoc triggers update rules and fails createdAt/ownerId immutability — retry with updateDoc.
            if (getFirestoreErrorCode(error) === 'permission-denied') {
              await updateDoc(docRef, updatePayload);
            } else {
              throw error;
            }
          }
        }

        knownCloudIdsRef.current.add(docId);
        persistSyncedCloudIds(knownCloudIdsRef.current);
      });

    inFlightWritesRef.current.set(docId, run);
    const cleanup = () => {
      if (inFlightWritesRef.current.get(docId) === run) {
        inFlightWritesRef.current.delete(docId);
      }
    };
    void run.then(cleanup, cleanup);
    return run;
  };

  const commitAutoSaveToCloud = (
    targetSnapshot: PreAnestheticEvaluation,
    fp: string,
    activeUser: User,
  ) => {
    if (
      deletedIdsRef.current.has(targetSnapshot.id) ||
      !targetSnapshot.patientName.trim() ||
      targetSnapshot.status === 'locked' ||
      activeUser.emailVerified === false
    ) {
      return;
    }
    if (lastCloudFpRef.current.get(targetSnapshot.id) === fp) {
      return;
    }
    if (pendingCloudSaveRef.current?.record.id === targetSnapshot.id) {
      pendingCloudSaveRef.current = null;
    }
    firstDirtyAtRef.current = 0;

    const preservedOwner = resolvePreservedOwnerId(targetSnapshot, activeUser.uid);
    const sanitizedCloud = sanitizeEvaluationForFirestore(targetSnapshot, preservedOwner);
    upsertEvaluationToCloud(sanitizedCloud, activeUser.uid)
      .then(() => {
        lastCloudFpRef.current.set(sanitizedCloud.id, fp);
        lastLocalFpRef.current.set(sanitizedCloud.id, fp);
        if (
          dirtyFormIdRef.current === sanitizedCloud.id &&
          buildRecordFingerprint(currentFormRef.current) === fp
        ) {
          dirtyFormIdRef.current = null;
        }
        setCloudRecords((prev) => {
          const exists = prev.some((r) => r.id === sanitizedCloud.id);
          const next = exists
            ? prev.map((r) => (r.id === sanitizedCloud.id ? sanitizedCloud : r))
            : [...prev, sanitizedCloud];
          return next.sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
        });
        setLocalRecords((prev) => {
          const exists = prev.some((r) => r.id === sanitizedCloud.id);
          const next = exists
            ? prev.map((r) => (r.id === sanitizedCloud.id ? sanitizedCloud : r))
            : [...prev, sanitizedCloud];
          return next.sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
        });
        setCloudError(null);
      })
      .catch((error) => {
        logFirestoreError(error, OperationType.WRITE, `evaluations/${sanitizedCloud.id}`);
        const friendly = getFriendlyFirestoreErrorMessage(error);
        setCloudError(friendly);
      });
  };

  const flushPendingCloudSave = () => {
    const activeUser = userRef.current;
    const pending = pendingCloudSaveRef.current;
    if (!activeUser || !pending) return;
    pendingCloudSaveRef.current = null;
    commitAutoSaveToCloud(pending.record, pending.fp, activeUser);
  };

  const handlePullFromCloud = async (
    targetUser?: User | null,
    options?: { silent?: boolean },
  ) => {
    const activeUser = targetUser ?? userRef.current;
    if (!activeUser || !activeUser.emailVerified) {
      if (!options?.silent) {
        showNotice('error', 'กรุณาเข้าสู่ระบบและยืนยันอีเมลก่อนดึงข้อมูลจาก Cloud');
      }
      return;
    }
    if (!options?.silent) {
      setIsPullingCloud(true);
    }
    const path = 'evaluations';
    const q = query(
      collection(db, path),
      where('status', 'in', [...SHARED_EVALUATION_STATUSES]),
    );
    try {
      let snapshot;
      let fromServer = true;
      try {
        snapshot = await getDocsFromServer(q);
      } catch {
        snapshot = await getDocs(q);
        fromServer = !snapshot.metadata.fromCache;
      }
      const items: PreAnestheticEvaluation[] = [];
      snapshot.forEach((docSnap) => {
        try {
          const raw = docSnap.data() as PreAnestheticEvaluation;
          const docId = docSnap.id || raw?.id;
          if (isSampleEvaluationRecord({ id: docId, hn: raw?.hn ?? '', patientName: raw?.patientName ?? '' })) {
            return;
          }
          const hydrated = hydrateEvaluationRecord(raw, docId, activeUser.uid);
          if (hydrated && !deletedIdsRef.current.has(hydrated.id)) {
            items.push(hydrated);
          }
        } catch {
          // Skip malformed document without failing entire pull
        }
      });
      applyCloudSnapshot(items, { fromServer, hasPendingWrites: false });
      if (!options?.silent) {
        showNotice(
          'success',
          items.length > 0
            ? `อัปเดตข้อมูลใบ Pre-op ล่าสุดจาก Cloud เรียบร้อย (${items.length} รายการ)`
            : 'เชื่อมต่อ Cloud สำเร็จ (ยังไม่พบใบ Pre-op ที่บันทึกไว้บน Cloud)',
        );
      }
    } catch (error) {
      logFirestoreError(error, OperationType.LIST, path);
      const friendly = getFriendlyFirestoreErrorMessage(error);
      setCloudError(friendly);
      if (!options?.silent) {
        showNotice('error', `ดึงข้อมูลจาก Cloud ไม่สำเร็จ: ${friendly}`);
      }
    } finally {
      if (!options?.silent) {
        setIsPullingCloud(false);
      }
    }
  };

  // Flush any pending auto-save immediately when switching tabs and ensure fresh Cloud fetch if empty
  useEffect(() => {
    flushPendingCloudSave();
    if (activeTab === 'registry' && authReady && isVerifiedCloudUser && !isLoadingRecords && !isPullingCloud && cloudRecords.length === 0) {
      void handlePullFromCloud(user, { silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authReady, user, isEmailVerified]);

  // Recover real-time sync immediately when tab returns to foreground, window regains network, or page hides
  useEffect(() => {
    if (!authReady || !user || !isEmailVerified) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastHiddenAtRef.current = Date.now();
        flushPendingCloudSave();
        return;
      }
      if (document.visibilityState === 'visible') {
        const awayMs = lastHiddenAtRef.current ? Date.now() - lastHiddenAtRef.current : 0;
        const sinceLastPull = Date.now() - lastForegroundPullAtRef.current;
        if (awayMs >= 15000 && sinceLastPull >= 5000) {
          lastForegroundPullAtRef.current = Date.now();
          void handlePullFromCloud(user, { silent: true });
        }
      }
    };

    const handleOnline = () => {
      flushPendingCloudSave();
      autoSyncedUidRef.current = null;
      lastForegroundPullAtRef.current = Date.now();
      setCloudRetryNonce((n) => n + 1);
      void handlePullFromCloud(user, { silent: true });
    };

    const handlePageHide = () => {
      flushPendingCloudSave();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('pagehide', handlePageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user, isEmailVerified]);

  const handleImportJsonFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rawList = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { records?: unknown }).records)
        ? ((parsed as { records: unknown[] }).records)
        : [parsed];
      let importedCount = 0;
      let updatedCount = 0;

      const existingById = new Map(records.map((r) => [r.id, r]));
      const existingBySignature = new Map<string, PreAnestheticEvaluation>();
      records.forEach((r) => {
        const hnKey = (r.hn || '').replace(/[\s-]/g, '').toLowerCase();
        const opKey = (r.dateOfOperation || '').trim();
        const nameKey = (r.patientName || '').trim().toLowerCase();
        if (hnKey && opKey) {
          existingBySignature.set(`hn:${hnKey}|op:${opKey}`, r);
        } else if (nameKey && opKey) {
          existingBySignature.set(`name:${nameKey}|op:${opKey}`, r);
        }
      });

      for (const item of rawList) {
        const rawObj = item && typeof item === 'object' ? (item as Partial<PreAnestheticEvaluation>) : null;
        const incomingId = typeof rawObj?.id === 'string' && rawObj.id.trim() ? rawObj.id.trim() : '';
        const incomingHn = typeof rawObj?.hn === 'string' ? rawObj.hn.replace(/[\s-]/g, '').toLowerCase() : '';
        const incomingOp = typeof rawObj?.dateOfOperation === 'string' ? rawObj.dateOfOperation.trim() : '';
        const incomingName = typeof rawObj?.patientName === 'string' ? rawObj.patientName.trim().toLowerCase() : '';

        const matchedExisting =
          (incomingId && existingById.get(incomingId)) ||
          (incomingHn && incomingOp ? existingBySignature.get(`hn:${incomingHn}|op:${incomingOp}`) : undefined) ||
          (incomingName && incomingOp ? existingBySignature.get(`name:${incomingName}|op:${incomingOp}`) : undefined);

        // Only reuse an imported document ID if it already matches one of this clinician's own records;
        // otherwise mint a fresh ID so importing another user's JSON never collides with their Cloud doc.
        const targetId = matchedExisting?.id || (!user && incomingId ? incomingId : generateEvaluationId());
        const hydrated = hydrateEvaluationRecord(
          item,
          targetId,
          user?.uid || 'local',
        );
        if (!hydrated) continue;
        hydrated.id = targetId;
        if (!hydrated.patientName.trim()) {
          hydrated.patientName = hydrated.hn ? `ผู้ป่วย HN ${hydrated.hn}` : 'ผู้ป่วย (นำเข้า)';
        }
        const saved = await saveEvaluationRecord(hydrated, { silentSuccess: true });
        if (saved) {
          if (matchedExisting) updatedCount += 1;
          else importedCount += 1;
        }
      }

      const totalProcessed = importedCount + updatedCount;
      if (totalProcessed > 0) {
        showNotice(
          'success',
          `นำเข้าข้อมูลใบ Pre-op เรียบร้อย (เพิ่มใหม่ ${importedCount} ราย${
            updatedCount > 0 ? ` · อัปเดตข้อมูลเดิม ${updatedCount} ราย` : ''
          })`,
        );
      } else {
        showNotice('error', 'ไม่พบข้อมูลใบ Pre-op ที่ถูกต้องในไฟล์ JSON นี้');
      }
    } catch {
      showNotice('error', 'ไม่สามารถอ่านไฟล์ JSON ได้ กรุณาตรวจสอบรูปแบบไฟล์');
    }
  };

  const handleOpenAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (verifiedUser: User) => {
    try {
      await reload(verifiedUser);
    } catch {
      // Non-critical reload fallback
    }
    const latestUser = auth.currentUser ?? verifiedUser;
    try {
      await latestUser.getIdToken(true);
    } catch {
      // Non-critical token refresh fallback
    }
    setUser(latestUser);
    setIsEmailVerified(Boolean(latestUser.emailVerified));
    setAllowOfflineBypass(false);
    setIsAuthModalOpen(false);
    setCloudError(null);
    setCloudRetryNonce((n) => n + 1);
    showNotice('success', 'เข้าสู่ระบบสำเร็จ กำลังซิงค์ข้อมูลใบ Pre-op จาก Cloud...');
    void handlePullFromCloud(latestUser, { silent: true });
  };

  const handleGoogleSignIn = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred?.user) {
        await handleAuthSuccess(cred.user);
      }
    } catch (error) {
      const msg = getFriendlyAuthErrorMessage(error);
      showNotice('error', msg);
      throw error;
    }
  };

  const handleRefreshCloudConnection = async () => {
    const activeUser = auth.currentUser ?? user;
    if (activeUser) {
      try {
        await reload(activeUser);
        await activeUser.getIdToken(true);
        setUser(auth.currentUser ?? activeUser);
        setIsEmailVerified(Boolean((auth.currentUser ?? activeUser).emailVerified));
      } catch {
        // Proceed with reconnect retry even if reload fails offline
      }
    }
    setCloudError(null);
    setCloudRetryNonce((n) => n + 1);
    void handlePullFromCloud(auth.currentUser ?? user);
  };

  const handleSignOut = async () => {
    try {
      flushPendingCloudSave();
      await signOut(auth);
      setIsEmailVerified(false);
      setAllowOfflineBypass(false);
      setIsAuthModalOpen(false);
      showNotice('success', 'ออกจากระบบแล้ว');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      showNotice('error', msg);
    }
  };

  const handleSyncLocalToCloud = async () => {
    if (!user || !isEmailVerified || unsyncedLocalRecords.length === 0) return;
    setIsSyncingLocal(true);
    const syncedRecords: PreAnestheticEvaluation[] = [];
    const failedIds = new Set<string>();
    let lastError: unknown = null;

    try {
      for (const rec of unsyncedLocalRecords) {
        if (rec.status === 'locked') {
          continue;
        }
        const resolvedName =
          rec.patientName.trim() || (rec.hn.trim() ? `ผู้ป่วย HN ${rec.hn.trim()}` : '');
        if (!resolvedName) continue;
        const preservedOwner = resolvePreservedOwnerId(rec, user.uid);
        const sanitized = sanitizeEvaluationForFirestore(
          { ...rec, patientName: resolvedName },
          preservedOwner,
        );
        try {
          await upsertEvaluationToCloud(sanitized, user.uid);
          syncedRecords.push(sanitized);
        } catch (error) {
          lastError = error;
          logFirestoreError(error, OperationType.WRITE, `evaluations/${sanitized.id}`);
          failedIds.add(rec.id);
        }
      }

      if (syncedRecords.length > 0) {
        const syncedMap = new Map(syncedRecords.map((r) => [r.id, r]));
        setCloudRecords((prev) => {
          const merged = prev.filter((r) => !syncedMap.has(r.id));
          return [...merged, ...syncedRecords].sort((a, b) =>
            compareByDateAndSurgeon(a, b, 'desc'),
          );
        });
        setLocalRecords((prev) =>
          prev
            .map((r) => syncedMap.get(r.id) ?? r)
            .sort((a, b) => compareByDateAndSurgeon(a, b, 'desc')),
        );
        setCloudError(null);
      }

      if (failedIds.size === 0) {
        showNotice(
          'success',
          `ซิงค์ข้อมูลจากทะเบียนขึ้น Cloud เรียบร้อย (${syncedRecords.length} ราย) ข้อมูลยังคงแสดงในทะเบียนตลอดเวลา`,
        );
      } else {
        const friendly = getFriendlyFirestoreErrorMessage(lastError);
        showNotice(
          'error',
          `ซิงค์ขึ้น Cloud สำเร็จ ${syncedRecords.length} ราย · คงค้างในเครื่อง ${failedIds.size} ราย (${friendly})`,
        );
      }
    } finally {
      setIsSyncingLocal(false);
    }
  };

  // Automatically upload local-only records to Cloud once after sign-in finishes loading
  useEffect(() => {
    if (!authReady || !user || !isEmailVerified || isLoadingRecords || isSyncingLocal) return;
    if (unsyncedLocalRecords.length === 0) {
      autoSyncedUidRef.current = user.uid;
      return;
    }
    if (autoSyncedUidRef.current === user.uid) return;
    autoSyncedUidRef.current = user.uid;
    void handleSyncLocalToCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user, isEmailVerified, isLoadingRecords, unsyncedLocalRecords.length]);

  // Real-time auto-save: persists Pre-op / Post-op edits automatically to Local (250ms) and Cloud Firestore (450ms debounce, 2s max-wait)
  useEffect(() => {
    if (dirtyFormIdRef.current !== currentForm.id) return;
    if (!currentForm.patientName.trim()) return;
    if (deletedIdsRef.current.has(currentForm.id)) return;

    const targetSnapshot = currentForm;
    const fp = buildRecordFingerprint(targetSnapshot);
    const needsLocal = lastLocalFpRef.current.get(targetSnapshot.id) !== fp;
    const needsCloud = isVerifiedCloudUser && lastCloudFpRef.current.get(targetSnapshot.id) !== fp;

    if (!needsLocal && !needsCloud) return;

    let localTimer: ReturnType<typeof setTimeout> | undefined;
    let cloudTimer: ReturnType<typeof setTimeout> | undefined;

    if (needsLocal) {
      localTimer = setTimeout(() => {
        if (deletedIdsRef.current.has(targetSnapshot.id)) return;
        const sanitizedLocal = sanitizeEvaluationForFirestore(
          targetSnapshot,
          user?.uid || 'local',
        );
        lastLocalFpRef.current.set(sanitizedLocal.id, fp);
        setLocalRecords((prev) => {
          const exists = prev.some((r) => r.id === sanitizedLocal.id);
          const next = exists
            ? prev.map((r) => (r.id === sanitizedLocal.id ? sanitizedLocal : r))
            : [...prev, sanitizedLocal];
          return next.sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
        });
      }, 250);
    }

    if (needsCloud && user && isEmailVerified && targetSnapshot.status !== 'locked') {
      pendingCloudSaveRef.current = { record: targetSnapshot, fp };
      const elapsedSinceFirstDirty = firstDirtyAtRef.current
        ? Date.now() - firstDirtyAtRef.current
        : 0;
      const delayMs = elapsedSinceFirstDirty >= 2000 ? 0 : 450;
      cloudTimer = setTimeout(() => {
        commitAutoSaveToCloud(targetSnapshot, fp, user);
      }, delayMs);
    }

    return () => {
      if (localTimer) clearTimeout(localTimer);
      if (cloudTimer) clearTimeout(cloudTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentForm, user, isEmailVerified]);

  const countCasesOnDate = (targetDate: string, targetRoom?: string): number =>
    liveRecords.filter(
      (r) =>
        (r.dateOfOperation || '').trim() === targetDate.trim() &&
        (!targetRoom || (r.orRoom || '').trim() === targetRoom.trim()),
    ).length;

  const handleCreateNew = () => {
    flushPendingCloudSave();
    const defaultDate = currentForm.dateOfOperation?.trim() || getTodayIsoDate();
    setNewFormDraft({
      hn: '',
      patientName: '',
      dateOfOperation: defaultDate,
      surgeon: '',
      scheduleType: 'elective',
      orRoom: '',
      caseOrder: '',
      operationTime: '',
    });
    setIsNewFormModalOpen(true);
  };

  const handleConfirmCreateNew = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const chosenDate = newFormDraft.dateOfOperation.trim();
    if (!chosenDate) {
      showNotice('error', 'กรุณาเลือกวันที่ทำผ่าตัด (Date of Operation)');
      return;
    }
    const trimmedHn = newFormDraft.hn.trim();
    const trimmedName = newFormDraft.patientName.trim();
    if (!trimmedHn && !trimmedName) {
      showNotice('error', 'กรุณาระบุ HN หรือ ชื่อ-นามสกุลผู้ป่วย เพื่อเก็บข้อมูลลงทะเบียน');
      return;
    }

    const resolvedName = trimmedName || `ผู้ป่วย HN ${trimmedHn}`;
    const created = createEmptyEvaluation(user?.uid || 'local', {
      hn: trimmedHn,
      patientName: resolvedName,
      gender: inferPatientGender(resolvedName),
      dateOfOperation: chosenDate,
      dateOfVisit: '',
      surgeon: newFormDraft.surgeon.trim(),
      scheduleType: newFormDraft.scheduleType,
      asaEmergency: newFormDraft.scheduleType === 'emergency',
      orRoom: newFormDraft.orRoom.trim(),
      caseOrder: newFormDraft.caseOrder.trim(),
      operationTime: newFormDraft.operationTime.trim(),
    });

    const result = await saveEvaluationRecord(created, { silentSuccess: true });
    if (!result) return;

    setCurrentForm(result.record);
    setIsNewFormModalOpen(false);
    setActiveTab('form');
    setShowFolderSidebar(true);
    if (!result.savedToLocalFallback) {
      const dateMeta = formatThaiScheduleDate(chosenDate);
      showNotice(
        'success',
        `สร้างใบ Pre-op และเก็บไว้ในทะเบียนแล้ว (${result.record.hn ? `HN ${result.record.hn} · ` : ''}${result.record.patientName} · ${dateMeta.label})`,
      );
    }
  };

  const handleCreateNewForDate = (
    dateOfOperation: string,
    orRoom?: string,
    surgeon?: string,
  ) => {
    const nextOrder = orRoom
      ? String(countCasesOnDate(dateOfOperation, orRoom) + 1)
      : '';
    setNewFormDraft({
      hn: '',
      patientName: '',
      dateOfOperation,
      surgeon: surgeon ?? '',
      scheduleType: 'elective',
      orRoom: orRoom ?? '',
      caseOrder: nextOrder,
      operationTime: '',
    });
    setIsNewFormModalOpen(true);
  };

  const saveEvaluationRecord = async (
    recordToSave: PreAnestheticEvaluation,
    options?: { silentSuccess?: boolean },
  ): Promise<{ record: PreAnestheticEvaluation; savedToLocalFallback: boolean } | null> => {
    if (!recordToSave.patientName.trim()) {
      showNotice('error', 'กรุณาระบุชื่อผู้ป่วย (Name) ก่อนบันทึกข้อมูล');
      return null;
    }

    setIsSaving(true);
    try {
      if (!user || !isEmailVerified) {
        const sanitized = sanitizeEvaluationForFirestore(recordToSave, 'local');
        lastLocalFpRef.current.set(sanitized.id, buildRecordFingerprint(sanitized));
        setLocalRecords((prev) => {
          const exists = prev.some((r) => r.id === sanitized.id);
          const next = exists
            ? prev.map((r) => (r.id === sanitized.id ? sanitized : r))
            : [...prev, sanitized];
          return next.sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
        });
        if (currentForm.id === sanitized.id) {
          setCurrentForm(sanitized);
        }
        if (!options?.silentSuccess) {
          showNotice(
            'success',
            `บันทึกใบ Pre-op ของ ${sanitized.patientName} เก็บไว้ในทะเบียนเรียบร้อยแล้ว (แสดงในทะเบียนตลอดเวลา)`,
          );
        }
        return { record: sanitized, savedToLocalFallback: false };
      }

      const preservedOwner = resolvePreservedOwnerId(recordToSave, user.uid);
      const sanitized = sanitizeEvaluationForFirestore(recordToSave, preservedOwner);
      const docPath = `evaluations/${sanitized.id}`;
      const isExisting =
        knownCloudIdsRef.current.has(sanitized.id) ||
        cloudRecords.some((r) => r.id === sanitized.id);

      try {
        await upsertEvaluationToCloud(sanitized, user.uid);
      } catch (error) {
        logFirestoreError(
          error,
          isExisting ? OperationType.UPDATE : OperationType.CREATE,
          docPath,
        );
        // Save safe local copy so the visit still appears immediately and permanently in ทะเบียน
        const localBackup = sanitizeEvaluationForFirestore(recordToSave, 'local');
        setLocalRecords((prev) => {
          const exists = prev.some((r) => r.id === localBackup.id);
          const next = exists
            ? prev.map((r) => (r.id === localBackup.id ? localBackup : r))
            : [...prev, localBackup];
          return next.sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
        });
        if (currentForm.id === localBackup.id) {
          setCurrentForm(localBackup);
        }
        const friendly = getFriendlyFirestoreErrorMessage(error);
        showNotice(
          'error',
          `บันทึกขึ้น Cloud ไม่สำเร็จ (${friendly}) — เก็บข้อมูลไว้ในทะเบียนเครื่องนี้เรียบร้อยแล้ว (แสดงตลอดเวลา)`,
        );
        return { record: localBackup, savedToLocalFallback: true };
      }

      // Reflect saved record immediately in BOTH Cloud state and local persistent cache
      // so saved Pre-op sheets always remain visible in ทะเบียน without moving away
      const savedFp = buildRecordFingerprint(sanitized);
      lastCloudFpRef.current.set(sanitized.id, savedFp);
      lastLocalFpRef.current.set(sanitized.id, savedFp);
      if (dirtyFormIdRef.current === sanitized.id) {
        dirtyFormIdRef.current = null;
        firstDirtyAtRef.current = 0;
      }
      if (pendingCloudSaveRef.current?.record.id === sanitized.id) {
        pendingCloudSaveRef.current = null;
      }
      setRemoteUpdateCandidate((prev) => (prev?.id === sanitized.id ? null : prev));
      setCloudRecords((prev) => {
        const exists = prev.some((r) => r.id === sanitized.id);
        const next = exists
          ? prev.map((r) => (r.id === sanitized.id ? sanitized : r))
          : [...prev, sanitized];
        return next.sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
      });
      setLocalRecords((prev) => {
        const exists = prev.some((r) => r.id === sanitized.id);
        const next = exists
          ? prev.map((r) => (r.id === sanitized.id ? sanitized : r))
          : [...prev, sanitized];
        return next.sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
      });
      setCloudError(null);

      if (currentForm.id === sanitized.id) {
        setCurrentForm(sanitized);
      }
      if (!options?.silentSuccess) {
        showNotice(
          'success',
          `บันทึกใบ Pre-op ของ ${sanitized.patientName}${sanitized.dateOfOperation ? ` (วันผ่าตัด ${formatThaiDateBE(sanitized.dateOfOperation)})` : ''} เก็บไว้ในทะเบียนเรียบร้อยแล้ว (แสดงในทะเบียนตลอดเวลา)`,
        );
      }
      return { record: sanitized, savedToLocalFallback: false };
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!currentForm.patientName.trim()) {
      showNotice('error', 'กรุณาระบุชื่อผู้ป่วย (Name) ก่อนบันทึกข้อมูล');
      setActiveTab('form');
      return;
    }
    const result = await saveEvaluationRecord(currentForm);
    if (result) {
      setCurrentForm(result.record);
    }
  };

  const handleDelete = async (recordId: string) => {
    deletedIdsRef.current.add(recordId);
    const isInCloud =
      knownCloudIdsRef.current.has(recordId) || cloudRecords.some((r) => r.id === recordId);

    if (!user || !isEmailVerified || !isInCloud) {
      setLocalRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (currentForm.id === recordId) {
        setCurrentForm(createEmptyEvaluation(user && isEmailVerified ? user.uid : 'local'));
      }
      showNotice('success', 'ลบข้อมูลเรียบร้อย');
      return;
    }

    const docPath = `evaluations/${recordId}`;
    try {
      await deleteDoc(doc(db, 'evaluations', recordId));
      knownCloudIdsRef.current.delete(recordId);
      persistSyncedCloudIds(knownCloudIdsRef.current);
      if (dirtyFormIdRef.current === recordId) {
        dirtyFormIdRef.current = null;
        firstDirtyAtRef.current = 0;
      }
      if (pendingCloudSaveRef.current?.record.id === recordId) {
        pendingCloudSaveRef.current = null;
      }
      setCloudRecords((prev) => prev.filter((r) => r.id !== recordId));
      setLocalRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (currentForm.id === recordId) {
        setRemoteUpdateCandidate(null);
        setCurrentForm(createEmptyEvaluation(user.uid));
      }
      showNotice('success', 'ลบข้อมูลออกจากฐานข้อมูลเรียบร้อย');
    } catch (error) {
      deletedIdsRef.current.delete(recordId);
      logFirestoreError(error, OperationType.DELETE, docPath);
      const msg =
        getFirestoreErrorCode(error) === 'permission-denied'
          ? 'ลบได้เฉพาะรายการที่คุณเป็นผู้สร้าง (หรือผู้ดูแลระบบ) เท่านั้น แต่คุณสามารถเปิดดูและแก้ไขข้อมูลรายการนี้ได้ตามปกติ'
          : `ลบข้อมูลไม่สำเร็จ: ${getFriendlyFirestoreErrorMessage(error)}`;
      showNotice('error', msg);
    }
  };

  const handleDuplicate = (record: PreAnestheticEvaluation) => {
    flushPendingCloudSave();
    const copy: PreAnestheticEvaluation = {
      ...record,
      id: generateEvaluationId(),
      ownerId: user?.uid || 'local',
      patientName: `${record.patientName} (สำเนา)`,
      status: 'draft',
    };
    dirtyFormIdRef.current = null;
    firstDirtyAtRef.current = 0;
    setRemoteUpdateCandidate(null);
    setCurrentForm(copy);
    setActiveTab('form');
    showNotice('success', 'คัดลอกแบบฟอร์มเป็นรายการใหม่แล้ว กรุณากดบันทึกเมื่อแก้ไขเสร็จ');
  };

  const handleEditRecord = (record: PreAnestheticEvaluation) => {
    flushPendingCloudSave();
    const latestFromCloud = cloudRecordsRef.current.find((r) => r.id === record.id) ?? record;
    const fp = buildRecordFingerprint(latestFromCloud);
    lastLocalFpRef.current.set(latestFromCloud.id, fp);
    if (knownCloudIdsRef.current.has(latestFromCloud.id)) {
      lastCloudFpRef.current.set(latestFromCloud.id, fp);
    }
    dirtyFormIdRef.current = null;
    firstDirtyAtRef.current = 0;
    setRemoteUpdateCandidate(null);
    setCurrentForm(latestFromCloud);
    setActiveTab('form');
  };

  const handlePrintRecord = (record: PreAnestheticEvaluation) => {
    flushPendingCloudSave();
    const latestFromCloud = cloudRecordsRef.current.find((r) => r.id === record.id) ?? record;
    const fp = buildRecordFingerprint(latestFromCloud);
    lastLocalFpRef.current.set(latestFromCloud.id, fp);
    if (knownCloudIdsRef.current.has(latestFromCloud.id)) {
      lastCloudFpRef.current.set(latestFromCloud.id, fp);
    }
    dirtyFormIdRef.current = null;
    firstDirtyAtRef.current = 0;
    setRemoteUpdateCandidate(null);
    setCurrentForm(latestFromCloud);
    setActiveTab('print_preview');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-pcanvas flex items-center justify-center px-4">
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600 bg-white/90 border border-pblue-200 rounded-xl px-5 py-3 shadow-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-pblue-600" />
          กำลังตรวจสอบสถานะการเข้าสู่ระบบ...
        </div>
      </div>
    );
  }

  if (!isVerifiedCloudUser && !allowOfflineBypass) {
    return (
      <>
        <AuthModal
          variant="fullscreen"
          user={user}
          onGoogleSignIn={handleGoogleSignIn}
          onAuthSuccess={handleAuthSuccess}
          onSignOut={handleSignOut}
          onContinueOffline={() => setAllowOfflineBypass(true)}
          onOpenShareQr={() => setIsShareQrOpen(true)}
        />
        <ShareQrModal
          isOpen={isShareQrOpen}
          onClose={() => setIsShareQrOpen(false)}
          onNotify={showNotice}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen text-[#243040] flex flex-col">
      {/* Top Bar Contract: Exact 3 zones separated by gap-8 */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-pborder">
        <div className="h-[3px] w-full pastel-top-ribbon" aria-hidden="true" />
        <div className="px-6 py-3.5">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8">
            {/* Zone 1: Single-line brand wordmark */}
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className="text-lg font-bold tracking-tight text-pblue-800 hover:text-prose-800 transition-colors whitespace-nowrap shrink-0 text-left"
            >
              Bangplee Pre-Anesthetic
            </button>

            {/* Zone 2: Concise single-line nav links with soft 5-color pastel active underline */}
            <nav
              aria-label="หลัก"
              className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600"
            >
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'form'
                    ? 'border-pblue-400 text-pblue-800 font-semibold'
                    : 'border-transparent hover:text-pblue-800'
                }`}
              >
                Pre-op
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('post_op')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'post_op'
                    ? 'border-pgreen-400 text-pgreen-800 font-semibold'
                    : 'border-transparent hover:text-pgreen-800'
                }`}
              >
                Post-op
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('registry')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'registry'
                    ? 'border-prose-400 text-prose-800 font-semibold'
                    : 'border-transparent hover:text-prose-800'
                }`}
              >
                ทะเบียนผ่าตัด ({liveRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'dashboard'
                    ? 'border-pyellow-400 text-pyellow-800 font-semibold'
                    : 'border-transparent hover:text-pyellow-800'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('print_preview')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'print_preview'
                    ? 'border-ppink-400 text-ppink-800 font-semibold'
                    : 'border-transparent hover:text-ppink-800'
                }`}
              >
                พิมพ์ A4
              </button>
            </nav>

            {/* Zone 3: 1 Primary Action — Always Save/Update directly */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-pblue-600 rounded-lg hover:bg-pblue-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving
                  ? 'กำลังบันทึก...'
                  : savedIdSet.has(currentForm.id)
                  ? 'อัปเดตข้อมูล'
                  : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>

          {/* Mobile Nav Row */}
          <div className="md:hidden flex items-center gap-2 mt-2.5 overflow-x-auto pb-0.5">
            {(
              [
                { key: 'form', label: 'Pre-op', activeCls: 'bg-pblue-100 text-pblue-800 border-pblue-300' },
                { key: 'post_op', label: 'Post-op', activeCls: 'bg-pgreen-100 text-pgreen-800 border-pgreen-300' },
                { key: 'registry', label: `ทะเบียนผ่าตัด (${liveRecords.length})`, activeCls: 'bg-prose-100 text-prose-800 border-prose-300' },
                { key: 'dashboard', label: 'Dashboard', activeCls: 'bg-pyellow-100 text-pyellow-800 border-pyellow-300' },
                { key: 'print_preview', label: 'พิมพ์ A4', activeCls: 'bg-ppink-100 text-ppink-800 border-ppink-300' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === t.key
                    ? t.activeCls
                    : 'bg-white border-pborder text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Secondary Workspace Toolbar (Below Header) */}
      <div className="no-print bg-gradient-to-r from-pblue-50/85 via-white/90 to-ppink-50/75 border-b border-pborder px-6 py-2.5">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-[#243040]">
              {currentForm.patientName.trim()
                ? `${currentForm.patientName} (HN: ${currentForm.hn || '—'})`
                : 'แบบฟอร์มใหม่ (ยังไม่บันทึก)'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-pblue-800 font-medium">
              วันผ่าตัด: {currentForm.dateOfOperation ? formatThaiDateBE(currentForm.dateOfOperation) : 'ยังไม่ระบุ'}
            </span>
            {currentForm.surgeon?.trim() && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-700">{currentForm.surgeon.trim()}</span>
              </>
            )}
            {isVerifiedCloudUser && user ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-pgreen-800 font-medium">
                  ซิงค์ Real-time ({user.displayName ? `${user.displayName} · ${user.email}` : user.email})
                </span>
                <button
                  type="button"
                  disabled={isPullingCloud}
                  onClick={() => void handlePullFromCloud()}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-pgreen-800 bg-pgreen-50 border border-pgreen-200 rounded hover:bg-pgreen-100 disabled:opacity-60 transition-colors"
                  title="ดึงข้อมูลล่าสุดจากฐานข้อมูล Cloud ทันที"
                >
                  <RefreshCw className={`w-3 h-3 ${isPullingCloud ? 'animate-spin' : ''}`} />
                  {isPullingCloud ? 'กำลังอัปเดต...' : 'อัปเดตล่าสุด'}
                </button>
                {unsyncedLocalRecords.length > 0 && (
                  <button
                    type="button"
                    disabled={isSyncingLocal}
                    onClick={handleSyncLocalToCloud}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-pblue-800 bg-pblue-50 border border-pblue-200 rounded hover:bg-pblue-100 disabled:opacity-60 transition-colors"
                  >
                    <UploadCloud className="w-3 h-3" />
                    {isSyncingLocal
                      ? 'กำลังซิงค์...'
                      : `ซิงค์ขึ้น Cloud (${unsyncedLocalRecords.length} ราย)`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenAuthModal}
                  className="inline-flex items-center gap-1 text-pblue-800 hover:text-prose-800 underline ml-1"
                >
                  สลับบัญชี
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-prose-800 underline ml-1"
                >
                  <LogOut className="w-3 h-3" />
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-700">จัดเก็บในเครื่องนี้</span>
                <button
                  type="button"
                  onClick={handleOpenAuthModal}
                  className="inline-flex items-center gap-1 text-pblue-800 hover:text-prose-800 font-semibold underline"
                >
                  <LogIn className="w-3 h-3" />
                  เข้าสู่ระบบ (ซิงค์ข้ามเครื่อง)
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(activeTab === 'form' || activeTab === 'post_op') && (
              <button
                type="button"
                onClick={() => setShowFolderSidebar((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  showFolderSidebar
                    ? 'bg-pblue-50 border-pblue-300 text-pblue-800'
                    : 'bg-white border-pborder text-slate-700 hover:bg-pblue-50/60'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-pblue-600" />
                {showFolderSidebar
                  ? `ซ่อนทะเบียนผ่าตัด (${liveRecords.length})`
                  : `แสดงทะเบียนผ่าตัด (${liveRecords.length})`}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveTab('registry');
                setRegistryFocusNonce((n) => n + 1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-prose-800 bg-prose-50 border border-prose-200 rounded-lg hover:bg-prose-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Search className="w-3.5 h-3.5 text-prose-600" />
              ค้นหาใบ Pre-op เก่า
            </button>

            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pgreen-800 bg-pgreen-50 border border-pgreen-200 rounded-lg hover:bg-pgreen-100 transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-pgreen-600" />
              สร้างใบเยี่ยมใหม่
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ppink-800 bg-ppink-50 border border-ppink-200 rounded-lg hover:bg-ppink-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-ppink-600" />
              พิมพ์ / PDF (1 หน้า A4)
            </button>

            <button
              type="button"
              onClick={() => {
                exportSingleHtmlReport(currentForm);
                showNotice('success', 'ส่งออกไฟล์รายงาน HTML (1 หน้า A4) เรียบร้อย');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pyellow-800 bg-pyellow-50 border border-pyellow-200 rounded-lg hover:bg-pyellow-100 transition-colors whitespace-nowrap shrink-0"
            >
              <FileCode2 className="w-3.5 h-3.5 text-pyellow-600" />
              ส่งออกไฟล์ HTML
            </button>

            <button
              type="button"
              onClick={() => {
                const list = liveRecords.length > 0 ? liveRecords : [currentForm];
                exportEvaluationsCsv(list);
                showNotice('success', 'ส่งออกไฟล์ CSV สำหรับ Excel เรียบร้อย');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-pborder rounded-lg hover:bg-pblue-50/70 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-pblue-600" />
              ส่งออก CSV
            </button>

            <button
              type="button"
              onClick={() => setIsShareQrOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pblue-800 bg-pblue-50 border border-pblue-200 rounded-lg hover:bg-pblue-100 transition-colors whitespace-nowrap shrink-0"
              title="แสดง QR Code สำหรับสแกนเข้าใช้งานหรือแชร์ให้ทีม"
            >
              <QrCode className="w-3.5 h-3.5 text-pblue-600" />
              QR แชร์แอป
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {authReady && !isVerifiedCloudUser && (
          <div
            role="status"
            className="no-print flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-pyellow-50 border border-pyellow-200 rounded-xl text-xs text-pyellow-800"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-pyellow-600 shrink-0" />
              <span className="font-medium">
                {user && !isEmailVerified
                  ? `บัญชี ${user.email} ยังไม่ได้ยืนยันอีเมล — กรุณายืนยันอีเมลเพื่อเปิดใช้งานซิงค์ข้อมูล Cloud แบบ Real-time`
                  : 'ขณะนี้ใช้งานแบบออฟไลน์เฉพาะเครื่องนี้ — กรุณาเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน หรือบัญชี Google เพื่อดูและแก้ไขข้อมูลร่วมกับทีมแบบ Real-time'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-pblue-600 rounded-lg hover:bg-pblue-700 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              {user && !isEmailVerified ? 'ยืนยันอีเมลตอนนี้' : 'เข้าสู่ระบบ (ซิงค์ Real-time)'}
            </button>
          </div>
        )}
        {cloudError && isVerifiedCloudUser && (
          <div
            role="alert"
            className="no-print flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-prose-50 border border-prose-200 rounded-xl text-xs text-prose-800"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-prose-600 shrink-0" />
              <span className="font-medium">
                การเชื่อมต่อฐานข้อมูล Cloud ขัดข้อง: {cloudError} (ข้อมูลที่บันทึกใหม่จะถูกสำรองในเครื่องและแสดงในทะเบียนผ่าตัดโดยอัตโนมัติ)
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleRefreshCloudConnection()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-prose-800 bg-white border border-prose-300 rounded-md hover:bg-prose-100 whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              รีเฟรชสิทธิ์ & เชื่อมต่อใหม่
            </button>
          </div>
        )}
        {remoteUpdateCandidate && remoteUpdateCandidate.id === currentForm.id && (
          <div
            role="status"
            className="no-print flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-pblue-50 border border-pblue-200 rounded-xl text-xs text-pblue-800"
          >
            <div className="flex items-center gap-2 min-w-0">
              <RefreshCw className="w-4 h-4 text-pblue-600 shrink-0" />
              <span className="font-medium">
                มีผู้ใช้งานอื่นเพิ่งอัปเดตข้อมูลของ{' '}
                <strong>{remoteUpdateCandidate.patientName || currentForm.patientName}</strong> บน Cloud
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = remoteUpdateCandidate;
                  const fp = buildRecordFingerprint(next);
                  dirtyFormIdRef.current = null;
                  firstDirtyAtRef.current = 0;
                  pendingCloudSaveRef.current = null;
                  lastCloudFpRef.current.set(next.id, fp);
                  lastLocalFpRef.current.set(next.id, fp);
                  setRemoteUpdateCandidate(null);
                  setCurrentForm(next);
                  showNotice('success', 'โหลดข้อมูลล่าสุดจาก Cloud เรียบร้อย');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-pblue-600 rounded-md hover:bg-pblue-700 whitespace-nowrap"
              >
                โหลดข้อมูลล่าสุดจากทีม
              </button>
              <button
                type="button"
                onClick={() => setRemoteUpdateCandidate(null)}
                className="px-2 py-1 text-xs font-medium text-pblue-800 hover:underline whitespace-nowrap"
              >
                เก็บข้อมูลที่กำลังพิมพ์
              </button>
            </div>
          </div>
        )}
        {(activeTab === 'form' || activeTab === 'post_op') && (
          <div
            className={
              showFolderSidebar
                ? 'grid grid-cols-1 xl:grid-cols-[290px_minmax(0,1fr)] gap-5 items-start'
                : 'space-y-5'
            }
          >
            {showFolderSidebar && (
              <div className="xl:sticky xl:top-20">
                <CaseFolderSidebar
                  records={liveRecords}
                  activeId={currentForm.id}
                  surgeonOptions={surgeonOptions}
                  wardOptions={wardOptions}
                  onSelectRecord={(rec) => {
                    const keepPostOp = activeTab === 'post_op';
                    handleEditRecord(rec);
                    if (keepPostOp) setActiveTab('post_op');
                  }}
                  onCreateNew={handleCreateNew}
                  onCreateNewForDate={handleCreateNewForDate}
                  onOpenFullRegistry={() => setActiveTab('registry')}
                  onClose={() => setShowFolderSidebar(false)}
                />
              </div>
            )}
            <div className="min-w-0 space-y-4">
              <ClinicalSummaryBar evaluation={currentForm} />

              {/* Unified Patient Form Switcher: Pre-op vs Post-op (Same Patient Record) */}
              <div className="no-print flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1 p-1 bg-white/90 border border-pborder rounded-lg shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      activeTab === 'form'
                        ? 'bg-pblue-100 text-pblue-800 shadow-2xs'
                        : 'text-slate-600 hover:text-pblue-800'
                    }`}
                  >
                    Pre-op Evaluation (ANE-FM-002-03)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('post_op')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      activeTab === 'post_op'
                        ? 'bg-pgreen-100 text-pgreen-800 shadow-2xs'
                        : 'text-slate-600 hover:text-pgreen-800'
                    }`}
                  >
                    Post-op Evaluation (ANE-FM-006-01)
                  </button>
                </div>
                <span className="text-xs text-slate-500">
                  เชื่อมข้อมูลผู้ป่วยคนเดียวกัน · กดบันทึกครั้งเดียวจัดเก็บครบทั้ง Pre-op และ Post-op
                </span>
              </div>

              {activeTab === 'form' ? (
                <PreAnestheticForm
                  value={currentForm}
                  onChange={handleFormChange}
                  medicationGroups={medicationGroups}
                  onUpdateMedicationGroups={handleUpdateMedicationGroups}
                  wardOptions={wardOptions}
                  onUpdateWardOptions={handleUpdateWardOptions}
                  specialtyOptions={specialtyOptions}
                  onUpdateSpecialtyOptions={handleUpdateSpecialtyOptions}
                  surgeonOptions={surgeonOptions}
                  onUpdateSurgeonOptions={handleUpdateSurgeonOptions}
                  oxygenPresets={oxygenPresets}
                  onUpdateOxygenPresets={handleUpdateOxygenPresets}
                  summarizerOptions={summarizerOptions}
                  onUpdateSummarizerOptions={handleUpdateSummarizerOptions}
                  onGoToPostOp={() => setActiveTab('post_op')}
                />
              ) : (
                <PostOpEvaluationForm
                  value={currentForm}
                  onChange={handleFormChange}
                  records={liveRecords}
                  onSelectPatient={(rec) => {
                    handleEditRecord(rec);
                    setActiveTab('post_op');
                  }}
                  wardOptions={wardOptions}
                  summarizerOptions={summarizerOptions}
                  visitorOptions={visitorOptions}
                  onUpdateVisitorOptions={handleUpdateVisitorOptions}
                  onGoToPreOp={() => setActiveTab('form')}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            records={liveRecords}
            wardOptions={wardOptions}
            isLoading={isLoadingRecords}
            onCreateNew={handleCreateNew}
            onSelectRecord={handleEditRecord}
            onSelectRecordPostOp={(rec) => {
              handleEditRecord(rec);
              setActiveTab('post_op');
            }}
          />
        )}

        {activeTab === 'registry' && (
          <RegistryView
            records={liveRecords}
            activeId={currentForm.id}
            wardOptions={wardOptions}
            surgeonOptions={surgeonOptions}
            isLoading={isLoadingRecords && liveRecords.length === 0}
            userEmail={isVerifiedCloudUser ? (user?.email ?? null) : null}
            cloudCount={cloudRecords.length}
            unsyncedLocalCount={unsyncedLocalRecords.length}
            isSyncingLocal={isSyncingLocal}
            isPullingCloud={isPullingCloud || (isVerifiedCloudUser && isLoadingRecords)}
            focusSearchNonce={registryFocusNonce}
            unsavedCurrentForm={
              !savedIdSet.has(currentForm.id) &&
              Boolean(currentForm.patientName.trim() || currentForm.hn.trim())
                ? currentForm
                : null
            }
            onSaveCurrentForm={handleSave}
            onSignIn={handleOpenAuthModal}
            onSyncLocalToCloud={() => void handleSyncLocalToCloud()}
            onPullFromCloud={() => void handlePullFromCloud()}
            onImportJsonFile={handleImportJsonFile}
            onEdit={handleEditRecord}
            onOpenPostOp={(rec) => {
              handleEditRecord(rec);
              setActiveTab('post_op');
            }}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onPrintRecord={handlePrintRecord}
            onCreateNew={handleCreateNew}
            onCreateNewForDate={handleCreateNewForDate}
          />
        )}

        {activeTab === 'print_preview' && (
          <div className="space-y-4">
            <div className="no-print bg-white border border-ppink-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <div>
                  <h2 className="text-sm font-semibold text-prose-800">
                    ตัวอย่างแบบฟอร์มกระดาษ A4 (Pre-op ANE-FM-002-03 &amp; Post-op ANE-FM-006-01)
                  </h2>
                  <p className="text-xs text-slate-500">
                    เลือกแบบฟอร์มที่ต้องการดูตัวอย่าง สั่งพิมพ์ หรือบันทึกเป็น PDF ได้ทันที
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 p-1 bg-ppink-50 border border-ppink-100 rounded-lg">
                  {(
                    [
                      { key: 'pre_op', label: 'Pre-op (ANE-FM-002-03)' },
                      { key: 'post_op', label: 'Post-op (ANE-FM-006-01)' },
                      { key: 'both', label: 'ทั้ง 2 หน้า' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setPrintSheetMode(opt.key)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        printSheetMode === opt.key
                          ? 'bg-white text-prose-800 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-prose-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportEvaluationJson(currentForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-pborder rounded-lg hover:bg-pblue-50"
                >
                  <Download className="w-3.5 h-3.5 text-pblue-600" />
                  ส่งออก JSON
                </button>
                <button
                  type="button"
                  onClick={() => exportSingleHtmlReport(currentForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pyellow-800 bg-pyellow-50 border border-pyellow-200 rounded-lg hover:bg-pyellow-100"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-pyellow-600" />
                  ดาวน์โหลด HTML
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-prose-600 rounded-lg hover:bg-prose-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  สั่งพิมพ์ / บันทึก PDF
                </button>
              </div>
            </div>
            {(printSheetMode === 'pre_op' || printSheetMode === 'both') && (
              <A4PrintSheet evaluation={currentForm} previewMode />
            )}
            {(printSheetMode === 'post_op' || printSheetMode === 'both') && (
              <PostOpA4PrintSheet
                evaluation={currentForm}
                previewMode
                pageBreakBefore={printSheetMode === 'both'}
              />
            )}
          </div>
        )}

        {/* Always-present hidden print sheet matching active view */}
        {activeTab !== 'print_preview' &&
          (activeTab === 'post_op' ? (
            <PostOpA4PrintSheet evaluation={currentForm} previewMode={false} />
          ) : (
            <A4PrintSheet evaluation={currentForm} previewMode={false} />
          ))}
      </main>

      {/* New Form — Select Operation Date & Surgeon Modal */}
      {isNewFormModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-form-date-modal-title"
          className="no-print fixed inset-0 z-50 bg-[#243040]/40 backdrop-blur-[1px] flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleConfirmCreateNew}
            onKeyDown={handleFormTabNavigation}
            className="bg-white border border-pblue-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl"
          >
            <div className="h-[3px] w-full pastel-top-ribbon" aria-hidden="true" />
            <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-pborder">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pblue-600 shrink-0" />
                <div>
                  <h3
                    id="new-form-date-modal-title"
                    className="text-sm font-bold text-[#243040]"
                  >
                    สร้างใบเยี่ยมใหม่ (เปิดฟอร์มเต็ม)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ระบุ HN / ชื่อผู้ป่วย และวันที่ผ่าตัด เพื่อสร้างฟอร์มและเก็บข้อมูลลงทะเบียนทันที สามารถสืบค้นย้อนหลังได้จาก HN และวันที่
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewFormModalOpen(false)}
                aria-label="ปิดหน้าต่าง"
                className="p-1 text-slate-400 hover:text-prose-800 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const todayStr = getTodayIsoDate();
              const quickDates = [
                { label: 'วันนี้', val: todayStr },
                { label: 'พรุ่งนี้', val: addDaysToIsoDate(todayStr, 1) },
                { label: 'มะรืนนี้', val: addDaysToIsoDate(todayStr, 2) },
                { label: '+3 วัน', val: addDaysToIsoDate(todayStr, 3) },
              ];
              const selectedMeta = formatThaiScheduleDate(newFormDraft.dateOfOperation);
              const existingCount = newFormDraft.dateOfOperation
                ? countCasesOnDate(newFormDraft.dateOfOperation)
                : 0;
              const normalizedDraftHn = newFormDraft.hn.replace(/[\s-]/g, '').toLowerCase();
              const matchedByHn =
                normalizedDraftHn.length >= 3
                  ? liveRecords.filter(
                      (r) =>
                        r.hn &&
                        r.hn.replace(/[\s-]/g, '').toLowerCase() === normalizedDraftHn,
                    )
                  : [];
              return (
                <div className="space-y-3">
                  {/* Patient HN & Name (Stored immediately into Registry) */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    <label className="sm:col-span-2 flex flex-col gap-1">
                      <span className="text-xs font-semibold text-slate-700">
                        HN <span className="text-red-600">*</span>
                      </span>
                      <input
                        type="text"
                        autoFocus
                        value={newFormDraft.hn}
                        onChange={(e) =>
                          setNewFormDraft((prev) => ({ ...prev, hn: e.target.value }))
                        }
                        placeholder="เช่น 67012345"
                        maxLength={40}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                      />
                    </label>
                    <label className="sm:col-span-3 flex flex-col gap-1">
                      <span className="text-xs font-semibold text-slate-700">
                        ชื่อ-นามสกุลผู้ป่วย (Name)
                      </span>
                      <input
                        type="text"
                        value={newFormDraft.patientName}
                        onChange={(e) =>
                          setNewFormDraft((prev) => ({ ...prev, patientName: e.target.value }))
                        }
                        placeholder="เช่น นายสมชาย ใจดี (เว้นว่างได้หากกรอก HN แล้ว)"
                        maxLength={120}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                      />
                    </label>
                  </div>

                  {matchedByHn.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-950">
                      <span>
                        พบประวัติเดิมของ HN <strong className="font-mono">{newFormDraft.hn.trim()}</strong> ในทะเบียนแล้ว ({matchedByHn.length} รายการ — {matchedByHn[matchedByHn.length - 1].patientName})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const latest = matchedByHn[matchedByHn.length - 1];
                          handleEditRecord(latest);
                          setIsNewFormModalOpen(false);
                        }}
                        className="font-semibold text-blue-800 hover:underline whitespace-nowrap"
                      >
                        เปิดข้อมูลเดิม
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor="new-form-op-date"
                        className="text-xs font-semibold text-slate-700"
                      >
                        วันที่ทำผ่าตัด (Date of Operation) <span className="text-red-600">*</span>
                      </label>
                      <div className="flex items-center gap-1">
                        {quickDates.map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() =>
                              setNewFormDraft((prev) => ({
                                ...prev,
                                dateOfOperation: opt.val,
                              }))
                            }
                            className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors ${
                              newFormDraft.dateOfOperation === opt.val
                                ? 'bg-pblue-600 text-white border-pblue-600'
                                : 'bg-white text-slate-600 border-pborder hover:bg-pblue-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <ThaiDateInput
                      id="new-form-op-date"
                      ariaLabel="วันที่ทำผ่าตัด (พ.ศ.)"
                      required
                      value={newFormDraft.dateOfOperation}
                      onChange={(next) =>
                        setNewFormDraft((prev) => ({
                          ...prev,
                          dateOfOperation: next,
                        }))
                      }
                      wrapperClassName="w-full"
                      className="w-full bg-white border border-pborder rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-[#243040] focus:outline-none focus:border-pblue-400 focus:ring-1 focus:ring-pblue-300"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-pblue-50/70 border border-pblue-200 rounded-lg text-xs">
                      <span className="font-medium text-[#243040]">
                        {selectedMeta.label}
                        {selectedMeta.relativeTag ? (
                          <span className="ml-1.5 text-pblue-800 font-semibold">
                            ({selectedMeta.relativeTag})
                          </span>
                        ) : null}
                      </span>
                      <span className="text-slate-600 tabular-nums">
                        เคสที่เก็บไว้ในวันนี้:{' '}
                        <strong className="font-mono text-pblue-800">{existingCount}</strong> ราย
                      </span>
                    </div>
                  </div>

                  {/* Surgeon selector */}
                  <div className="space-y-1">
                    <label
                      htmlFor="new-form-surgeon"
                      className="text-xs font-semibold text-slate-700"
                    >
                      แพทย์ผ่าตัด (Surgeon)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        id="new-form-surgeon"
                        value={
                          surgeonOptions.includes(newFormDraft.surgeon)
                            ? newFormDraft.surgeon
                            : ''
                        }
                        onChange={(e) =>
                          setNewFormDraft((prev) => ({ ...prev, surgeon: e.target.value }))
                        }
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
                      >
                        <option value="">-- เลือกรายชื่อแพทย์ผ่าตัด --</option>
                        {surgeonOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        aria-label="พิมพ์ชื่อแพทย์ผ่าตัด"
                        value={newFormDraft.surgeon}
                        onChange={(e) =>
                          setNewFormDraft((prev) => ({ ...prev, surgeon: e.target.value }))
                        }
                        placeholder="หรือพิมพ์ชื่อแพทย์ผ่าตัด..."
                        maxLength={120}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-slate-700">ประเภทเคส</span>
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                        {(
                          [
                            { key: 'elective', label: 'Elective' },
                            { key: 'emergency', label: 'Emerg' },
                          ] as const
                        ).map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() =>
                              setNewFormDraft((prev) => ({ ...prev, scheduleType: t.key }))
                            }
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                              newFormDraft.scheduleType === t.key
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-slate-700">ห้องผ่าตัด (OR)</span>
                      <select
                        value={newFormDraft.orRoom}
                        onChange={(e) => {
                          const nextRoom = e.target.value;
                          const suggestedOrder =
                            nextRoom && newFormDraft.dateOfOperation
                              ? String(countCasesOnDate(newFormDraft.dateOfOperation, nextRoom) + 1)
                              : newFormDraft.caseOrder;
                          setNewFormDraft((prev) => ({
                            ...prev,
                            orRoom: nextRoom,
                            caseOrder: suggestedOrder,
                          }));
                        }}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
                      >
                        <option value="">-- ไม่ระบุ --</option>
                        {OR_ROOM_OPTIONS.map((room) => (
                          <option key={room} value={room}>
                            {room}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-2 gap-1.5">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-700">คิว#</span>
                        <input
                          type="text"
                          value={newFormDraft.caseOrder}
                          onChange={(e) =>
                            setNewFormDraft((prev) => ({ ...prev, caseOrder: e.target.value }))
                          }
                          placeholder="1, 2"
                          maxLength={16}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-800"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-700">เวลา</span>
                        <input
                          type="time"
                          value={newFormDraft.operationTime}
                          onChange={(e) =>
                            setNewFormDraft((prev) => ({
                              ...prev,
                              operationTime: e.target.value,
                            }))
                          }
                          className="bg-white border border-slate-300 rounded-lg px-1.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-800"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-pborder">
              <button
                type="button"
                onClick={() => setIsNewFormModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-pborder rounded-lg hover:bg-pblue-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-pblue-600 rounded-lg hover:bg-pblue-700 disabled:opacity-60"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                {isSaving ? 'กำลังบันทึกเข้าทะเบียน...' : 'สร้างฟอร์มและเก็บในทะเบียน'}
              </button>
            </div>
            </div>
          </form>
        </div>
      )}

      {/* Auth Modal (Email/Password + Google Sign-In) */}
      {isAuthModalOpen && (
        <AuthModal
          variant="modal"
          user={user}
          onGoogleSignIn={handleGoogleSignIn}
          onAuthSuccess={handleAuthSuccess}
          onSignOut={handleSignOut}
          onOpenShareQr={() => setIsShareQrOpen(true)}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* Share QR Code Modal */}
      <ShareQrModal
        isOpen={isShareQrOpen}
        onClose={() => setIsShareQrOpen(false)}
        onNotify={showNotice}
      />

      {/* Toast Notification */}
      {notice && (
        <div
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`no-print fixed bottom-5 right-5 z-50 max-w-md flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs font-medium shadow-lg ${
            notice.type === 'error'
              ? 'bg-prose-50 border-prose-300 text-prose-800'
              : 'bg-pgreen-50 border-pgreen-300 text-pgreen-800'
          }`}
        >
          {notice.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-prose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-pgreen-600 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="ปิดการแจ้งเตือน"
            className={`p-0.5 rounded shrink-0 ${
              notice.type === 'error'
                ? 'text-prose-600 hover:text-prose-800'
                : 'text-pgreen-600 hover:text-pgreen-800'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
