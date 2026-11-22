import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
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
  RefreshCw,
  Save,
  Search,
  UploadCloud,
  X,
} from 'lucide-react';
import { A4PrintSheet } from './components/A4PrintSheet';
import { CaseFolderSidebar } from './components/CaseFolderSidebar';
import { ClinicalSummaryBar } from './components/ClinicalSummaryBar';
import { DashboardView } from './components/DashboardView';
import { PostOpA4PrintSheet } from './components/PostOpA4PrintSheet';
import { PostOpEvaluationForm } from './components/PostOpEvaluationForm';
import { PreAnestheticForm } from './components/PreAnestheticForm';
import { RegistryView } from './components/RegistryView';
import { ThaiDateInput } from './components/ThaiDateInput';
import {
  auth,
  db,
  getFirestoreErrorCode,
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
const SHARED_EVALUATION_STATUSES = ['draft', 'evaluated', 'post_op_completed', 'locked'] as const;

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
  const [authReady, setAuthReady] = useState(false);
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
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const purgedSampleIdsRef = useRef<Set<string>>(new Set());
  const knownCloudIdsRef = useRef<Set<string>>(new Set());
  const inFlightWritesRef = useRef<Map<string, Promise<void>>>(new Map());
  const deletedIdsRef = useRef<Set<string>>(new Set());
  const autoSyncedUidRef = useRef<string | null>(null);
  const lastLocalFpRef = useRef<Map<string, string>>(new Map());
  const lastCloudFpRef = useRef<Map<string, string>>(new Map());
  const lastUserEditAtRef = useRef<number>(0);
  const currentFormRef = useRef<PreAnestheticEvaluation>(currentForm);
  currentFormRef.current = currentForm;
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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        knownCloudIdsRef.current.clear();
        setCloudRecords([]);
        setCloudError(null);
        setIsLoadingRecords(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Attach shared real-time Firestore listener ONLY when authReady and user is authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    setIsLoadingRecords(true);
    setCloudError(null);
    const path = 'evaluations';
    const q = query(
      collection(db, path),
      where('status', 'in', [...SHARED_EVALUATION_STATUSES]),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
        items.sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
        const nextCloudIds = new Set(items.map((item) => item.id));
        nextCloudIds.forEach((id) => knownCloudIdsRef.current.add(id));
        deletedIdsRef.current.forEach((id) => knownCloudIdsRef.current.delete(id));
        items.forEach((item) => {
          const fp = buildRecordFingerprint(item);
          lastCloudFpRef.current.set(item.id, fp);
          lastLocalFpRef.current.set(item.id, fp);
        });
        setCloudRecords(items);
        setCloudError(null);
        setIsLoadingRecords(false);
        // Mirror Cloud records into localStorage cache while keeping all non-deleted local records intact
        // so saved Pre-op evaluations NEVER vanish on reload, cache lag, or offline sessions
        setLocalRecords((prev) => {
          const keptLocal = prev.filter(
            (r) => !nextCloudIds.has(r.id) && !deletedIdsRef.current.has(r.id),
          );
          return [...items, ...keptLocal].sort((a, b) =>
            compareByDateAndSurgeon(a, b, 'desc'),
          );
        });

        // If another device updated the currently open record while user isn't actively typing, refresh it in real time
        const activeOpen = currentFormRef.current;
        const remoteMatch = items.find((it) => it.id === activeOpen.id);
        if (
          remoteMatch &&
          Date.now() - lastUserEditAtRef.current > 3000 &&
          buildRecordFingerprint(remoteMatch) !== buildRecordFingerprint(activeOpen)
        ) {
          setCurrentForm(remoteMatch);
        }

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
      },
    );

    return () => unsubscribe();
  }, [authReady, user, cloudRetryNonce]);

  // Attach Firestore listener for customizable medication catalog when authenticated
  useEffect(() => {
    if (!authReady || !user) {
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
        handleFirestoreError(error, OperationType.GET, catalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const handleUpdateMedicationGroups = async (nextGroups: MedicationGroup[]) => {
    const clean = sanitizeMedicationGroups(nextGroups);
    setMedicationGroups(clean);
    try {
      localStorage.setItem('bph_med_groups_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user) return;
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
    if (!authReady || !user) {
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
        handleFirestoreError(error, OperationType.GET, wardCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const handleUpdateWardOptions = async (nextWards: string[]) => {
    const clean = sanitizeWardList(nextWards);
    setWardOptions(clean);
    try {
      localStorage.setItem('bph_ward_list_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user) {
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
    if (!authReady || !user) {
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
        handleFirestoreError(error, OperationType.GET, surgeonCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const handleUpdateSurgeonOptions = async (nextSurgeons: string[]) => {
    const clean = sanitizeSurgeonList(nextSurgeons);
    setSurgeonOptions(clean);
    try {
      localStorage.setItem('bph_surgeon_list_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user) {
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
    if (!authReady || !user) {
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
        handleFirestoreError(error, OperationType.GET, oxygenCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const handleUpdateOxygenPresets = async (nextPresets: string[]) => {
    const clean = sanitizeOxygenPresets(nextPresets);
    setOxygenPresets(clean);
    try {
      localStorage.setItem('bph_oxygen_presets_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user) {
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
    if (!authReady || !user) {
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
        handleFirestoreError(error, OperationType.GET, summarizerCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const handleUpdateSummarizerOptions = async (nextSummarizers: string[]) => {
    const clean = sanitizeSummarizerList(nextSummarizers);
    setSummarizerOptions(clean);
    try {
      localStorage.setItem('bph_summarizer_list_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user) {
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
    if (!authReady || !user) {
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
        handleFirestoreError(error, OperationType.GET, visitorCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const handleUpdateVisitorOptions = async (nextVisitors: string[]) => {
    const clean = sanitizeSummarizerList(nextVisitors);
    setVisitorOptions(clean);
    try {
      localStorage.setItem('bph_visitor_list_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user) {
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
    if (!authReady || !user) {
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
        handleFirestoreError(error, OperationType.GET, specialtyCatalogPath);
      },
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const handleUpdateSpecialtyOptions = async (nextSpecialties: string[]) => {
    const clean = sanitizeSpecialtyList(nextSpecialties);
    setSpecialtyOptions(clean);
    try {
      localStorage.setItem('bph_specialty_list_v1', JSON.stringify(clean));
    } catch {
      // ignore storage error
    }

    if (!user) {
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
    const cloudMatch = cloudRecords.find((r) => r.id === rec.id);
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
    if (!user) return localRecords;
    const cloudIdSet = new Set(cloudRecords.map((r) => r.id));
    const localOnly = localRecords.filter((r) => !cloudIdSet.has(r.id));
    if (localOnly.length === 0) return cloudRecords;
    return [...cloudRecords, ...localOnly].sort((a, b) =>
      compareByDateAndSurgeon(a, b, 'desc'),
    );
  }, [user, cloudRecords, localRecords]);

  // Real-time projection: reflects every Pre-op / Post-op edit immediately across Sidebar, Registry & Dashboard (0ms latency)
  const liveRecords = useMemo(() => {
    const hasLiveIdentity = Boolean(
      currentForm.patientName.trim() || currentForm.hn.trim(),
    );
    if (!hasLiveIdentity || deletedIdsRef.current.has(currentForm.id)) {
      return records;
    }
    const liveEntry: PreAnestheticEvaluation = {
      ...currentForm,
      patientName:
        currentForm.patientName.trim() || `ผู้ป่วย HN ${currentForm.hn.trim()}`,
    };
    const existsIdx = records.findIndex((r) => r.id === currentForm.id);
    const merged =
      existsIdx !== -1
        ? records.map((r) => (r.id === currentForm.id ? { ...r, ...liveEntry } : r))
        : [liveEntry, ...records];
    return [...merged].sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
  }, [records, currentForm]);

  const unsyncedLocalRecords = useMemo(() => {
    if (!user || isLoadingRecords) return [];
    const cloudIdSet = new Set(cloudRecords.map((r) => r.id));
    return localRecords.filter(
      (r) =>
        !cloudIdSet.has(r.id) &&
        r.status !== 'locked' &&
        Boolean(r.patientName.trim() || r.hn.trim()),
    );
  }, [user, isLoadingRecords, cloudRecords, localRecords]);
  const savedIdSet = useMemo(() => new Set(records.map((r) => r.id)), [records]);

  const handleFormChange = (next: PreAnestheticEvaluation) => {
    lastUserEditAtRef.current = Date.now();
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

  const handlePullFromCloud = async (targetUser?: User | null) => {
    const activeUser = targetUser ?? user;
    if (!activeUser) {
      showNotice('error', 'กรุณาเข้าสู่ระบบ Google ก่อนดึงข้อมูลจาก Cloud');
      return;
    }
    setIsPullingCloud(true);
    const path = 'evaluations';
    const q = query(
      collection(db, path),
      where('status', 'in', [...SHARED_EVALUATION_STATUSES]),
    );
    try {
      let snapshot;
      try {
        snapshot = await getDocsFromServer(q);
      } catch {
        snapshot = await getDocs(q);
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
      items.sort((a, b) => compareByDateAndSurgeon(a, b, 'desc'));
      const nextCloudIds = new Set(items.map((item) => item.id));
      nextCloudIds.forEach((id) => knownCloudIdsRef.current.add(id));
      deletedIdsRef.current.forEach((id) => knownCloudIdsRef.current.delete(id));
      setCloudRecords(items);
      setCloudError(null);
      setLocalRecords((prev) => {
        const keptLocal = prev.filter(
          (r) => !nextCloudIds.has(r.id) && !deletedIdsRef.current.has(r.id),
        );
        return [...items, ...keptLocal].sort((a, b) =>
          compareByDateAndSurgeon(a, b, 'desc'),
        );
      });
      showNotice(
        'success',
        items.length > 0
          ? `ดึงข้อมูลใบ Pre-op ทั้งหมดจาก Cloud เรียบร้อย (${items.length} รายการ) แสดงในทะเบียนและพร้อมแก้ไขร่วมกันแล้ว`
          : 'เชื่อมต่อ Cloud สำเร็จ (ยังไม่พบใบ Pre-op ที่บันทึกไว้บน Cloud)',
      );
    } catch (error) {
      logFirestoreError(error, OperationType.LIST, path);
      const friendly = getFriendlyFirestoreErrorMessage(error);
      setCloudError(friendly);
      showNotice('error', `ดึงข้อมูลจาก Cloud ไม่สำเร็จ: ${friendly}`);
    } finally {
      setIsPullingCloud(false);
    }
  };

  // Ensure fresh Cloud fetch when user opens ทะเบียน while authenticated
  useEffect(() => {
    if (activeTab === 'registry' && authReady && user && !isLoadingRecords && !isPullingCloud && cloudRecords.length === 0) {
      void handlePullFromCloud(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authReady, user]);

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

  const handleSignIn = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      showNotice('success', 'เข้าสู่ระบบด้วย Google สำเร็จ กำลังดึงข้อมูลใบ Pre-op จาก Cloud...');
      if (cred?.user) {
        void handlePullFromCloud(cred.user);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'ไม่สามารถเข้าสู่ระบบได้';
      showNotice('error', `เข้าสู่ระบบไม่สำเร็จ: ${msg}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showNotice('success', 'ออกจากระบบแล้ว');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      showNotice('error', msg);
    }
  };

  const handleSyncLocalToCloud = async () => {
    if (!user || unsyncedLocalRecords.length === 0) return;
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
    if (!authReady || !user || isLoadingRecords || isSyncingLocal) return;
    if (unsyncedLocalRecords.length === 0) {
      autoSyncedUidRef.current = user.uid;
      return;
    }
    if (autoSyncedUidRef.current === user.uid) return;
    autoSyncedUidRef.current = user.uid;
    void handleSyncLocalToCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user, isLoadingRecords, unsyncedLocalRecords.length]);

  // Real-time auto-save: persists Pre-op / Post-op edits automatically to Local (300ms) and Cloud Firestore (1100ms)
  useEffect(() => {
    if (lastUserEditAtRef.current === 0) return;
    if (!currentForm.patientName.trim()) return;
    if (deletedIdsRef.current.has(currentForm.id)) return;

    const targetSnapshot = currentForm;
    const fp = buildRecordFingerprint(targetSnapshot);
    const needsLocal = lastLocalFpRef.current.get(targetSnapshot.id) !== fp;
    const needsCloud = Boolean(user) && lastCloudFpRef.current.get(targetSnapshot.id) !== fp;

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
      }, 300);
    }

    if (needsCloud && user && targetSnapshot.status !== 'locked' && user.emailVerified !== false) {
      const activeUid = user.uid;
      const preservedOwner = resolvePreservedOwnerId(targetSnapshot, activeUid);
      cloudTimer = setTimeout(() => {
        if (deletedIdsRef.current.has(targetSnapshot.id)) return;
        const sanitizedCloud = sanitizeEvaluationForFirestore(targetSnapshot, preservedOwner);
        upsertEvaluationToCloud(sanitizedCloud, activeUid)
          .then(() => {
            lastCloudFpRef.current.set(sanitizedCloud.id, fp);
            lastLocalFpRef.current.set(sanitizedCloud.id, fp);
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
          });
      }, 1100);
    }

    return () => {
      if (localTimer) clearTimeout(localTimer);
      if (cloudTimer) clearTimeout(cloudTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentForm, user]);

  const countCasesOnDate = (targetDate: string, targetRoom?: string): number =>
    liveRecords.filter(
      (r) =>
        (r.dateOfOperation || '').trim() === targetDate.trim() &&
        (!targetRoom || (r.orRoom || '').trim() === targetRoom.trim()),
    ).length;

  const handleCreateNew = () => {
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
      if (!user) {
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

    if (!user || !isInCloud) {
      setLocalRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (currentForm.id === recordId) {
        setCurrentForm(createEmptyEvaluation(user?.uid || 'local'));
      }
      showNotice('success', 'ลบข้อมูลเรียบร้อย');
      return;
    }

    const docPath = `evaluations/${recordId}`;
    try {
      await deleteDoc(doc(db, 'evaluations', recordId));
      knownCloudIdsRef.current.delete(recordId);
      setCloudRecords((prev) => prev.filter((r) => r.id !== recordId));
      setLocalRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (currentForm.id === recordId) {
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
    const copy: PreAnestheticEvaluation = {
      ...record,
      id: generateEvaluationId(),
      ownerId: user?.uid || 'local',
      patientName: `${record.patientName} (สำเนา)`,
      status: 'draft',
    };
    setCurrentForm(copy);
    setActiveTab('form');
    showNotice('success', 'คัดลอกแบบฟอร์มเป็นรายการใหม่แล้ว กรุณากดบันทึกเมื่อแก้ไขเสร็จ');
  };

  const handleEditRecord = (record: PreAnestheticEvaluation) => {
    const fp = buildRecordFingerprint(record);
    lastLocalFpRef.current.set(record.id, fp);
    if (knownCloudIdsRef.current.has(record.id)) {
      lastCloudFpRef.current.set(record.id, fp);
    }
    setCurrentForm(record);
    setActiveTab('form');
  };

  const handlePrintRecord = (record: PreAnestheticEvaluation) => {
    const fp = buildRecordFingerprint(record);
    lastLocalFpRef.current.set(record.id, fp);
    if (knownCloudIdsRef.current.has(record.id)) {
      lastCloudFpRef.current.set(record.id, fp);
    }
    setCurrentForm(record);
    setActiveTab('print_preview');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: Exact 3 zones separated by gap-8 */}
      <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left"
          >
            Bangplee Pre-Anesthetic
          </button>

          {/* Zone 2: Concise single-line nav links */}
          <nav
            aria-label="หลัก"
            className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'form'
                  ? 'border-blue-800 text-slate-950 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Pre-op
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('post_op')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'post_op'
                  ? 'border-blue-800 text-slate-950 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Post-op
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('registry')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'registry'
                  ? 'border-blue-800 text-slate-950 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              ทะเบียนผ่าตัด ({liveRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'border-blue-800 text-slate-950 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('print_preview')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'print_preview'
                  ? 'border-blue-800 text-slate-950 font-semibold'
                  : 'border-transparent hover:text-slate-900'
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
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
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
              { key: 'form', label: 'Pre-op' },
              { key: 'post_op', label: 'Post-op' },
              { key: 'registry', label: `ทะเบียนผ่าตัด (${liveRecords.length})` },
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'print_preview', label: 'พิมพ์ A4' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                activeTab === t.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Secondary Workspace Toolbar (Below Header) */}
      <div className="no-print bg-slate-100/80 border-b border-slate-200 px-6 py-2.5">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              {currentForm.patientName.trim()
                ? `${currentForm.patientName} (HN: ${currentForm.hn || '—'})`
                : 'แบบฟอร์มใหม่ (ยังไม่บันทึก)'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-blue-900 font-medium">
              วันผ่าตัด: {currentForm.dateOfOperation ? formatThaiDateBE(currentForm.dateOfOperation) : 'ยังไม่ระบุ'}
            </span>
            {currentForm.surgeon?.trim() && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-700">{currentForm.surgeon.trim()}</span>
              </>
            )}
            {user ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-800 font-medium">
                  ซิงค์ฐานข้อมูล ({user.email})
                </span>
                {unsyncedLocalRecords.length > 0 && (
                  <button
                    type="button"
                    disabled={isSyncingLocal}
                    onClick={handleSyncLocalToCloud}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-800 bg-white border border-blue-300 rounded hover:bg-blue-50 disabled:opacity-60"
                  >
                    <UploadCloud className="w-3 h-3" />
                    {isSyncingLocal
                      ? 'กำลังซิงค์...'
                      : `ซิงค์ขึ้น Cloud (${unsyncedLocalRecords.length} ราย)`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-1 text-blue-800 hover:text-blue-950 underline ml-1"
                >
                  สลับบัญชี
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 underline ml-1"
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
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-1 text-blue-800 hover:text-blue-950 font-semibold underline"
                >
                  <LogIn className="w-3 h-3" />
                  เข้าสู่ระบบ Google (ซิงค์ข้ามเครื่อง)
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
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-800" />
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Search className="w-3.5 h-3.5 text-blue-800" />
              ค้นหาใบ Pre-op เก่า
            </button>

            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-blue-800" />
              สร้างใบเยี่ยมใหม่
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-blue-800" />
              พิมพ์ / PDF (1 หน้า A4)
            </button>

            <button
              type="button"
              onClick={() => {
                exportSingleHtmlReport(currentForm);
                showNotice('success', 'ส่งออกไฟล์รายงาน HTML (1 หน้า A4) เรียบร้อย');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <FileCode2 className="w-3.5 h-3.5 text-blue-800" />
              ส่งออกไฟล์ HTML
            </button>

            <button
              type="button"
              onClick={() => {
                const list = liveRecords.length > 0 ? liveRecords : [currentForm];
                exportEvaluationsCsv(list);
                showNotice('success', 'ส่งออกไฟล์ CSV สำหรับ Excel เรียบร้อย');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-blue-800" />
              ส่งออก CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {cloudError && user && (
          <div
            role="alert"
            className="no-print flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span className="font-medium">
                การเชื่อมต่อฐานข้อมูล Cloud ขัดข้อง: {cloudError} (ข้อมูลที่บันทึกใหม่จะถูกสำรองในเครื่องและแสดงในทะเบียนผ่าตัดโดยอัตโนมัติ)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCloudRetryNonce((n) => n + 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-900 bg-white border border-red-300 rounded-md hover:bg-red-100 whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              ลองเชื่อมต่อใหม่
            </button>
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
                <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      activeTab === 'form'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pre-op Evaluation (ANE-FM-002-03)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('post_op')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      activeTab === 'post_op'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
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
                  onUpdateSummarizerOptions={handleUpdateSummarizerOptions}
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
            userEmail={user?.email ?? null}
            cloudCount={cloudRecords.length}
            unsyncedLocalCount={unsyncedLocalRecords.length}
            isSyncingLocal={isSyncingLocal}
            isPullingCloud={isPullingCloud || (Boolean(user) && isLoadingRecords)}
            focusSearchNonce={registryFocusNonce}
            unsavedCurrentForm={
              !savedIdSet.has(currentForm.id) &&
              Boolean(currentForm.patientName.trim() || currentForm.hn.trim())
                ? currentForm
                : null
            }
            onSaveCurrentForm={handleSave}
            onSignIn={handleSignIn}
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
            <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    ตัวอย่างแบบฟอร์มกระดาษ A4 (Pre-op ANE-FM-002-03 &amp; Post-op ANE-FM-006-01)
                  </h2>
                  <p className="text-xs text-slate-500">
                    เลือกแบบฟอร์มที่ต้องการดูตัวอย่าง สั่งพิมพ์ หรือบันทึกเป็น PDF ได้ทันที
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
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
                          ? 'bg-white text-slate-950 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  ส่งออก JSON
                </button>
                <button
                  type="button"
                  onClick={() => exportSingleHtmlReport(currentForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  ดาวน์โหลด HTML
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900"
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
          className="no-print fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleConfirmCreateNew}
            onKeyDown={handleFormTabNavigation}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-800 shrink-0" />
                <div>
                  <h3
                    id="new-form-date-modal-title"
                    className="text-sm font-bold text-slate-900"
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
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
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
                                ? 'bg-blue-800 text-white border-blue-800'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
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
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <span className="font-medium text-slate-800">
                        {selectedMeta.label}
                        {selectedMeta.relativeTag ? (
                          <span className="ml-1.5 text-blue-800 font-semibold">
                            ({selectedMeta.relativeTag})
                          </span>
                        ) : null}
                      </span>
                      <span className="text-slate-600 tabular-nums">
                        เคสที่เก็บไว้ในวันนี้:{' '}
                        <strong className="font-mono text-slate-900">{existingCount}</strong> ราย
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewFormModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-60"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                {isSaving ? 'กำลังบันทึกเข้าทะเบียน...' : 'สร้างฟอร์มและเก็บในทะเบียน'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Notification */}
      {notice && (
        <div
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`no-print fixed bottom-5 right-5 z-50 max-w-md flex items-start gap-2.5 px-4 py-3 rounded-lg border text-xs font-medium shadow-lg ${
            notice.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          {notice.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="ปิดการแจ้งเตือน"
            className={`p-0.5 rounded shrink-0 ${
              notice.type === 'error'
                ? 'text-red-500 hover:text-red-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
