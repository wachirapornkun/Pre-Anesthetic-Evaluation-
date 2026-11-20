import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  Calendar,
  CheckCircle2,
  Download,
  FileCode2,
  FilePlus2,
  FolderOpen,
  LogIn,
  LogOut,
  Printer,
  Save,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { A4PrintSheet } from './components/A4PrintSheet';
import { CaseFolderSidebar } from './components/CaseFolderSidebar';
import { ClinicalSummaryBar } from './components/ClinicalSummaryBar';
import { DashboardView } from './components/DashboardView';
import { ElectiveScheduleView } from './components/ElectiveScheduleView';
import { PreAnestheticForm } from './components/PreAnestheticForm';
import { RegistryView } from './components/RegistryView';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import {
  addDaysToIsoDate,
  compareByDateAndSurgeon,
  createEmptyEvaluation,
  createEmptyOxygenSupport,
  createSampleEvaluations,
  DEFAULT_MEDICATION_GROUPS,
  DEFAULT_OXYGEN_OTHER_PRESETS,
  DEFAULT_SUMMARIZER_LIST,
  DEFAULT_SURGEON_LIST,
  DEFAULT_WARD_LIST,
  formatThaiScheduleDate,
  generateEvaluationId,
  getTodayIsoDate,
  MedicationGroup,
  OR_ROOM_OPTIONS,
  PreAnestheticEvaluation,
  sanitizeEvaluationForFirestore,
  sanitizeMedicationGroups,
  sanitizeOxygenPresets,
  sanitizeSummarizerList,
  sanitizeSurgeonList,
  sanitizeWardList,
  ScheduleType,
} from './types/evaluation';
import { exportEvaluationJson, exportEvaluationsCsv, exportSingleHtmlReport } from './utils/exportReports';

type ActiveTab = 'form' | 'schedule' | 'dashboard' | 'registry' | 'print_preview';

interface NewFormScheduleDraft {
  dateOfOperation: string;
  surgeon: string;
  scheduleType: ScheduleType;
  orRoom: string;
  caseOrder: string;
  operationTime: string;
}

const LOCAL_RECORDS_STORAGE_KEY = 'bph_local_evaluations_v1';

function loadSavedLocalRecords(): PreAnestheticEvaluation[] {
  try {
    const raw = localStorage.getItem(LOCAL_RECORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is PreAnestheticEvaluation => Boolean(item && typeof item === 'object' && item.id))
      .map((item) => sanitizeEvaluationForFirestore(item, 'local'))
      .sort((a, b) => compareByDateAndSurgeon(a, b, 'asc'));
  } catch {
    return [];
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('form');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudRecords, setCloudRecords] = useState<PreAnestheticEvaluation[]>([]);
  const [localRecords, setLocalRecords] = useState<PreAnestheticEvaluation[]>(() =>
    loadSavedLocalRecords(),
  );
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [showFolderSidebar, setShowFolderSidebar] = useState(true);
  const [currentForm, setCurrentForm] = useState<PreAnestheticEvaluation>(() =>
    createEmptyEvaluation('local'),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isNewFormModalOpen, setIsNewFormModalOpen] = useState(false);
  const [newFormDraft, setNewFormDraft] = useState<NewFormScheduleDraft>(() => ({
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
  const [wardOptions, setWardOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bph_ward_list_v1');
      if (saved) return sanitizeWardList(JSON.parse(saved));
    } catch {
      // ignore storage error
    }
    return [...DEFAULT_WARD_LIST];
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
        return [...groups, { id: 'other', label: '10. ยาอื่นๆ', items: [] }];
      }
      if (!migrated) {
        localStorage.setItem('bph_med_other_added_v1', '1');
      }
    } catch {
      // ignore storage error
    }
    return groups;
  };
  const [medicationGroups, setMedicationGroups] = useState<MedicationGroup[]>(() => {
    try {
      const saved = localStorage.getItem('bph_med_groups_v1');
      if (saved) return ensureOtherGroupOnce(sanitizeMedicationGroups(JSON.parse(saved)));
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
    const timer = setTimeout(() => setNotice(null), 3600);
    return () => clearTimeout(timer);
  }, [notice]);

  // Persist local evaluations to browser localStorage so saved pre-visit drafts survive refresh
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_RECORDS_STORAGE_KEY, JSON.stringify(localRecords));
    } catch {
      // ignore storage quota errors
    }
  }, [localRecords]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setCloudRecords([]);
        setIsLoadingRecords(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Attach Firestore listener ONLY when authReady and user is authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    setIsLoadingRecords(true);
    const path = 'evaluations';
    const q = query(collection(db, path), where('ownerId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: PreAnestheticEvaluation[] = [];
        snapshot.forEach((docSnap) => {
          const raw = docSnap.data() as PreAnestheticEvaluation;
          const hist = raw.formData?.history;
          const phys = raw.formData?.physicalExam;
          const emptyOx = createEmptyOxygenSupport();
          const rawOx = phys?.oxygenSupport;
          items.push({
            ...raw,
            operationTime: raw.operationTime ?? '',
            scheduleType:
              raw.scheduleType === 'emergency' ||
              (raw.scheduleType !== 'elective' && raw.asaEmergency)
                ? 'emergency'
                : 'elective',
            orRoom: raw.orRoom ?? '',
            caseOrder: raw.caseOrder ?? '',
            surgeon: raw.surgeon ?? '',
            formData: {
              ...raw.formData,
              history: {
                ...hist,
                dlp: Boolean(hist?.dlp),
                dlpYears: hist?.dlpYears ?? '',
                ckd: Boolean(hist?.ckd),
                ckdYears: hist?.ckdYears ?? '',
                drinkingDaysPerWeek: hist?.drinkingDaysPerWeek ?? '',
                drinkingDurationUnit: hist?.drinkingDurationUnit === 'months' ? 'months' : 'years',
                drinkingQuit: Boolean(hist?.drinkingQuit),
                drinkingQuitDuration: hist?.drinkingQuitDuration ?? '',
                drinkingQuitUnit: hist?.drinkingQuitUnit === 'months' ? 'months' : 'years',
                smokingDurationUnit: hist?.smokingDurationUnit === 'months' ? 'months' : 'years',
                smokingQuit: Boolean(hist?.smokingQuit),
                smokingQuitDuration: hist?.smokingQuitDuration ?? '',
                smokingQuitUnit: hist?.smokingQuitUnit === 'months' ? 'months' : 'years',
                drugAddictionTypes: Array.isArray(hist?.drugAddictionTypes) ? hist.drugAddictionTypes : [],
                drugAddictionOther: hist?.drugAddictionOther ?? '',
                drugAddictionAmount: hist?.drugAddictionAmount ?? '',
                drugAddictionDurationUnit:
                  hist?.drugAddictionDurationUnit === 'months' ? 'months' : 'years',
                drugAddictionQuit: Boolean(hist?.drugAddictionQuit),
                drugAddictionQuitDuration: hist?.drugAddictionQuitDuration ?? '',
                drugAddictionQuitUnit:
                  hist?.drugAddictionQuitUnit === 'months' ? 'months' : 'years',
              },
              physicalExam: {
                ...phys,
                oxygenSupport: rawOx
                  ? {
                      ...emptyOx,
                      ...rawOx,
                      otherItems: Array.isArray(rawOx.otherItems) ? rawOx.otherItems : [],
                    }
                  : emptyOx,
                missingTeeth: Array.isArray(phys?.missingTeeth) ? phys.missingTeeth : [],
                looseTeeth: Array.isArray(phys?.looseTeeth) ? phys.looseTeeth : [],
                mouthOpeningDetail: phys?.mouthOpeningDetail ?? '',
                neckMovementDetail: phys?.neckMovementDetail ?? '',
                thyromentalDistanceDetail: phys?.thyromentalDistanceDetail ?? '',
              },
              laboratory: {
                ...raw.formData?.laboratory,
                prepTs: Boolean(raw.formData?.laboratory?.prepTs),
                prepStatuses: Array.isArray(raw.formData?.laboratory?.prepStatuses)
                  ? raw.formData.laboratory.prepStatuses
                  : [],
                prepStatusDetail: raw.formData?.laboratory?.prepStatusDetail ?? '',
              },
            },
          });
        });
        items.sort((a, b) => compareByDateAndSurgeon(a, b, 'asc'));
        setCloudRecords(items);
        setIsLoadingRecords(false);
      },
      (error) => {
        setIsLoadingRecords(false);
        handleFirestoreError(error, OperationType.LIST, path);
      },
    );

    return () => unsubscribe();
  }, [authReady, user]);

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
                    return [...sanitized, { id: 'other', label: '10. ยาอื่นๆ', items: [] }];
                  }
                } catch {
                  // ignore storage error
                }
                return sanitized;
              })();
          setMedicationGroups(withOther);
          try {
            localStorage.setItem('bph_med_groups_v1', JSON.stringify(withOther));
          } catch {
            // ignore storage error
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

  const records = user ? cloudRecords : localRecords;
  const savedIdSet = useMemo(() => new Set(records.map((r) => r.id)), [records]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showNotice('success', 'เข้าสู่ระบบด้วย Google สำเร็จ พร้อมซิงค์ฐานข้อมูล');
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
    if (!user || localRecords.length === 0) return;
    setIsSyncingLocal(true);
    try {
      const batch = writeBatch(db);
      localRecords.forEach((rec) => {
        const sanitized = sanitizeEvaluationForFirestore(rec, user.uid);
        const ref = doc(db, 'evaluations', sanitized.id);
        batch.set(ref, {
          ...sanitized,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      const count = localRecords.length;
      setLocalRecords([]);
      showNotice('success', `ซิงค์ข้อมูลจากเครื่องขึ้นฐานข้อมูล Cloud เรียบร้อย (${count} ราย)`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'evaluations');
    } finally {
      setIsSyncingLocal(false);
    }
  };

  const countCasesOnDate = (targetDate: string, targetRoom?: string): number =>
    records.filter(
      (r) =>
        (r.dateOfOperation || '').trim() === targetDate.trim() &&
        (!targetRoom || (r.orRoom || '').trim() === targetRoom.trim()),
    ).length;

  const handleCreateNew = () => {
    const defaultDate = currentForm.dateOfOperation?.trim() || getTodayIsoDate();
    setNewFormDraft({
      dateOfOperation: defaultDate,
      surgeon: '',
      scheduleType: 'elective',
      orRoom: '',
      caseOrder: '',
      operationTime: '',
    });
    setIsNewFormModalOpen(true);
  };

  const handleConfirmCreateNew = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const chosenDate = newFormDraft.dateOfOperation.trim();
    if (!chosenDate) {
      showNotice('error', 'กรุณาเลือกวันที่ทำผ่าตัด (Date of Operation)');
      return;
    }
    const created = createEmptyEvaluation(user?.uid || 'local', {
      dateOfOperation: chosenDate,
      dateOfVisit: '',
      surgeon: newFormDraft.surgeon.trim(),
      scheduleType: newFormDraft.scheduleType,
      asaEmergency: newFormDraft.scheduleType === 'emergency',
      orRoom: newFormDraft.orRoom.trim(),
      caseOrder: newFormDraft.caseOrder.trim(),
      operationTime: newFormDraft.operationTime.trim(),
    });
    setCurrentForm(created);
    setIsNewFormModalOpen(false);
    setActiveTab('form');
    const dateMeta = formatThaiScheduleDate(chosenDate);
    showNotice(
      'success',
      `เปิดฟอร์มเต็มสำหรับวันผ่าตัด ${dateMeta.label}${newFormDraft.surgeon.trim() ? ` · ${newFormDraft.surgeon.trim()}` : ''} กรอกข้อมูลบางส่วนแล้วกดบันทึกข้อมูลไว้รอเยี่ยมได้เลย`,
    );
  };

  const handleCreateNewForDate = (
    dateOfOperation: string,
    orRoom?: string,
    surgeon?: string,
  ) => {
    const nextOrder = orRoom
      ? String(countCasesOnDate(dateOfOperation, orRoom) + 1)
      : '';
    setCurrentForm(
      createEmptyEvaluation(user?.uid || 'local', {
        dateOfOperation,
        dateOfVisit: '',
        surgeon: surgeon ?? '',
        scheduleType: 'elective',
        orRoom: orRoom ?? '',
        caseOrder: nextOrder,
      }),
    );
    setActiveTab('form');
    showNotice(
      'success',
      `เปิดฟอร์มเต็มสำหรับวันผ่าตัด ${dateOfOperation}${surgeon ? ` · ${surgeon}` : ''}`,
    );
  };

  const saveEvaluationRecord = async (
    recordToSave: PreAnestheticEvaluation,
  ): Promise<PreAnestheticEvaluation | null> => {
    if (!recordToSave.patientName.trim()) {
      showNotice('error', 'กรุณาระบุชื่อผู้ป่วย (Name) ก่อนบันทึกข้อมูล');
      return null;
    }

    setIsSaving(true);
    try {
      if (!user) {
        const sanitized = sanitizeEvaluationForFirestore(recordToSave, 'local');
        setLocalRecords((prev) => {
          const exists = prev.some((r) => r.id === sanitized.id);
          const next = exists
            ? prev.map((r) => (r.id === sanitized.id ? sanitized : r))
            : [...prev, sanitized];
          return next.sort((a, b) => compareByDateAndSurgeon(a, b, 'asc'));
        });
        if (currentForm.id === sanitized.id) {
          setCurrentForm(sanitized);
        }
        showNotice(
          'success',
          `บันทึกใบเยี่ยมของ ${sanitized.patientName} เก็บไว้ในแฟ้มวันผ่าตัด ${sanitized.dateOfOperation || 'ยังไม่ระบุ'} เรียบร้อย`,
        );
        return sanitized;
      }

      const sanitized = sanitizeEvaluationForFirestore(recordToSave, user.uid);
      const docPath = `evaluations/${sanitized.id}`;
      const docRef = doc(db, 'evaluations', sanitized.id);
      const isExisting = cloudRecords.some((r) => r.id === sanitized.id);

      if (isExisting) {
        try {
          await updateDoc(docRef, {
            status: sanitized.status,
            patientName: sanitized.patientName,
            hn: sanitized.hn,
            an: sanitized.an,
            age: sanitized.age,
            ward: sanitized.ward,
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
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, docPath);
        }
      } else {
        try {
          await setDoc(docRef, {
            ...sanitized,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, docPath);
        }
      }

      if (currentForm.id === sanitized.id) {
        setCurrentForm(sanitized);
      }
      showNotice(
        'success',
        `บันทึกข้อมูลของ ${sanitized.patientName}${sanitized.dateOfOperation ? ` (วันผ่าตัด ${sanitized.dateOfOperation})` : ''} เรียงตามวันที่ผ่าตัดเรียบร้อย`,
      );
      return sanitized;
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
    const saved = await saveEvaluationRecord(currentForm);
    if (saved) {
      setCurrentForm(saved);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!user) {
      setLocalRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (currentForm.id === recordId) {
        setCurrentForm(createEmptyEvaluation('local'));
      }
      showNotice('success', 'ลบข้อมูลเรียบร้อย');
      return;
    }

    const docPath = `evaluations/${recordId}`;
    try {
      await deleteDoc(doc(db, 'evaluations', recordId));
      if (currentForm.id === recordId) {
        setCurrentForm(createEmptyEvaluation(user.uid));
      }
      showNotice('success', 'ลบข้อมูลออกจากฐานข้อมูลเรียบร้อย');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  };

  const handleLoadSamples = async () => {
    const samples = createSampleEvaluations(user?.uid || 'local');
    if (!user) {
      setLocalRecords((prev) =>
        [...samples, ...prev].sort((a, b) => compareByDateAndSurgeon(a, b, 'asc')),
      );
      setCurrentForm(samples[0]);
      showNotice('success', 'โหลดข้อมูลตัวอย่าง 5 เคสเรียบร้อย (เรียงตามวันผ่าตัดและแพทย์ผ่าตัด)');
      return;
    }

    try {
      const batch = writeBatch(db);
      samples.forEach((sample) => {
        const ref = doc(db, 'evaluations', sample.id);
        batch.set(ref, {
          ...sample,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setCurrentForm(samples[0]);
      showNotice('success', 'เพิ่มข้อมูลตัวอย่าง 5 เคสลง Firestore เรียบร้อย');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'evaluations');
    }
  };

  const handleDuplicate = (record: PreAnestheticEvaluation) => {
    const copy: PreAnestheticEvaluation = {
      ...record,
      id: generateEvaluationId(),
      patientName: `${record.patientName} (สำเนา)`,
      status: 'draft',
    };
    setCurrentForm(copy);
    setActiveTab('form');
    showNotice('success', 'คัดลอกแบบฟอร์มเป็นรายการใหม่แล้ว กรุณากดบันทึกเมื่อแก้ไขเสร็จ');
  };

  const handleEditRecord = (record: PreAnestheticEvaluation) => {
    setCurrentForm(record);
    setActiveTab('form');
  };

  const handlePrintRecord = (record: PreAnestheticEvaluation) => {
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

          {/* Zone 2: 5 concise single-line nav links */}
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
              แบบฟอร์มประเมิน
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'schedule'
                  ? 'border-blue-800 text-slate-950 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              แฟ้มวันผ่าตัด
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
              Dashboard สรุปผล
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
              ทะเบียนผู้ป่วย ({records.length})
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
              ตัวอย่างพิมพ์ A4
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
              { key: 'form', label: 'แบบฟอร์ม' },
              { key: 'schedule', label: 'แฟ้มวันผ่าตัด' },
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'registry', label: `ทะเบียน (${records.length})` },
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
              วันผ่าตัด: {currentForm.dateOfOperation || 'ยังไม่ระบุ'}
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
                {localRecords.length > 0 && (
                  <button
                    type="button"
                    disabled={isSyncingLocal}
                    onClick={handleSyncLocalToCloud}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-800 bg-white border border-blue-300 rounded hover:bg-blue-50 disabled:opacity-60"
                  >
                    <UploadCloud className="w-3 h-3" />
                    {isSyncingLocal
                      ? 'กำลังซิงค์...'
                      : `ซิงค์จากเครื่องขึ้น Cloud (${localRecords.length} ราย)`}
                  </button>
                )}
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
            {activeTab === 'form' && (
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
                {showFolderSidebar ? `ซ่อนแฟ้ม (${records.length})` : `แสดงแฟ้มใบเยี่ยม (${records.length})`}
              </button>
            )}

            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-blue-800" />
              สร้างใบเยี่ยมใหม่
            </button>

            {records.length === 0 && (
              <button
                type="button"
                onClick={handleLoadSamples}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-800" />
                โหลดตัวอย่าง 5 เคส
              </button>
            )}

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
                const list = records.length > 0 ? records : [currentForm];
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
        {activeTab === 'form' && (
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
                  records={records}
                  activeId={currentForm.id}
                  surgeonOptions={surgeonOptions}
                  wardOptions={wardOptions}
                  onSelectRecord={handleEditRecord}
                  onCreateNew={handleCreateNew}
                  onCreateNewForDate={handleCreateNewForDate}
                  onClose={() => setShowFolderSidebar(false)}
                />
              </div>
            )}
            <div className="min-w-0 space-y-5">
              <ClinicalSummaryBar evaluation={currentForm} />
              <PreAnestheticForm
                value={currentForm}
                onChange={setCurrentForm}
                medicationGroups={medicationGroups}
                onUpdateMedicationGroups={handleUpdateMedicationGroups}
                wardOptions={wardOptions}
                onUpdateWardOptions={handleUpdateWardOptions}
                surgeonOptions={surgeonOptions}
                onUpdateSurgeonOptions={handleUpdateSurgeonOptions}
                oxygenPresets={oxygenPresets}
                onUpdateOxygenPresets={handleUpdateOxygenPresets}
                summarizerOptions={summarizerOptions}
                onUpdateSummarizerOptions={handleUpdateSummarizerOptions}
                visitorOptions={visitorOptions}
                onUpdateVisitorOptions={handleUpdateVisitorOptions}
              />
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <ElectiveScheduleView
            records={records}
            activeId={currentForm.id}
            wardOptions={wardOptions}
            surgeonOptions={surgeonOptions}
            isLoading={isLoadingRecords}
            onEdit={handleEditRecord}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onPrintRecord={handlePrintRecord}
            onCreateNew={handleCreateNew}
            onCreateNewForDate={handleCreateNewForDate}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            records={records}
            wardOptions={wardOptions}
            isLoading={isLoadingRecords}
            onCreateNew={handleCreateNew}
            onLoadSamples={handleLoadSamples}
            onSelectRecord={handleEditRecord}
          />
        )}

        {activeTab === 'registry' && (
          <RegistryView
            records={records}
            activeId={currentForm.id}
            surgeonOptions={surgeonOptions}
            onEdit={handleEditRecord}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onPrintRecord={handlePrintRecord}
            onCreateNew={handleCreateNew}
            onCreateNewForDate={handleCreateNewForDate}
            onLoadSamples={handleLoadSamples}
          />
        )}

        {activeTab === 'print_preview' && (
          <div className="space-y-4">
            <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  ตัวอย่างแบบฟอร์ม 1 หน้ากระดาษ A4 (ANE-FM-002-03)
                </h2>
                <p className="text-xs text-slate-500">
                  จัดหน้ากระดาษให้ครบทุกหัวข้อใน 1 หน้า A4 พร้อมสั่งพิมพ์หรือบันทึกเป็น PDF ได้ทันที
                </p>
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
            <A4PrintSheet evaluation={currentForm} previewMode />
          </div>
        )}

        {/* Always-present hidden print sheet for 1-page A4 printing from any tab */}
        {activeTab !== 'print_preview' && (
          <A4PrintSheet evaluation={currentForm} previewMode={false} />
        )}
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
                    เลือกวันที่ผ่าตัดและแพทย์ผ่าตัด เพื่อเปิดฟอร์มเต็มกรอกข้อมูลบางส่วนเก็บไว้รอไปเยี่ยมที่หอผู้ป่วย
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
              return (
                <div className="space-y-3">
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

                    <input
                      id="new-form-op-date"
                      type="date"
                      required
                      value={newFormDraft.dateOfOperation}
                      onChange={(e) =>
                        setNewFormDraft((prev) => ({
                          ...prev,
                          dateOfOperation: e.target.value,
                        }))
                      }
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
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                เปิดฟอร์มเต็มเพื่อบันทึกข้อมูล
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Notification */}
      {notice && (
        <div
          role="status"
          className={`no-print fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium shadow-md ${
            notice.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}
    </div>
  );
}
