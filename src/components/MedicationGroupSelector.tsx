import React, { useEffect, useState } from 'react';
import { Check, Clock, Edit2, Plus, RotateCcw, Settings2, Trash2, X } from 'lucide-react';
import {
  DEFAULT_MEDICATION_GROUPS,
  detectAntithromboticDrugClass,
  detectAutoPremedDrugClass,
  hasMedicationToken,
  MedicationGroup,
  parseMedicationEntry,
  parseMedicationList,
  SelectedMedicationEntry,
  serializeMedicationList,
  toggleMedicationToken,
} from '../types/evaluation';
import { ThaiDateInput } from './ThaiDateInput';

interface MedicationGroupSelectorProps {
  groups: MedicationGroup[];
  medicationText: string;
  dateOfOperation?: string;
  onChangeMedicationText: (
    nextText: string,
    autoUnderlying?: 'ht' | 'dm' | 'dlp' | 'heartDisease',
  ) => void;
  onUpdateGroups: (nextGroups: MedicationGroup[]) => void;
}

const REGIMEN_SUGGESTIONS = [
  '1x1 pc เช้า',
  '1x1 hs',
  '1x2 pc',
  '1x3 pc',
  '1x1 ac',
  'เช้า-เย็น',
  'PRN',
];

export function MedicationGroupSelector({
  groups,
  medicationText,
  onChangeMedicationText,
  onUpdateGroups,
}: MedicationGroupSelectorProps) {
  const [manageMode, setManageMode] = useState(false);
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [editingItem, setEditingItem] = useState<{
    groupId: string;
    index: number;
    text: string;
  } | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [quickOtherText, setQuickOtherText] = useState('');

  const [rows, setRows] = useState<SelectedMedicationEntry[]>(() =>
    parseMedicationList(medicationText),
  );

  // Sync from external medicationText changes (switching patient, clicking preset button, reset)
  useEffect(() => {
    setRows((prevRows) => {
      if (serializeMedicationList(prevRows) === medicationText.trim()) {
        return prevRows;
      }
      return parseMedicationList(medicationText);
    });
  }, [medicationText]);

  const handleToggleDrug = (
    drug: string,
    autoUnderlying?: 'ht' | 'dm' | 'dlp' | 'heartDisease',
  ) => {
    const currentlyActive = hasMedicationToken(medicationText, drug);
    const nextText = toggleMedicationToken(medicationText, drug);
    setRows(parseMedicationList(nextText));
    onChangeMedicationText(nextText, !currentlyActive ? autoUnderlying : undefined);
  };

  const handleUpdateRow = (
    index: number,
    patch: Partial<SelectedMedicationEntry>,
  ) => {
    const nextRows = rows.map((row, idx) => (idx === index ? { ...row, ...patch } : row));
    setRows(nextRows);
    onChangeMedicationText(serializeMedicationList(nextRows));
  };

  const handleRemoveRow = (index: number) => {
    const nextRows = rows.filter((_, idx) => idx !== index);
    setRows(nextRows);
    onChangeMedicationText(serializeMedicationList(nextRows));
  };

  const handleAddBlankRow = () => {
    setRows((prev) => [...prev, { name: '', dose: '', regimen: '' }]);
  };

  const handleQuickAddOther = () => {
    const trimmed = quickOtherText.trim();
    if (!trimmed) return;
    const parsed = parseMedicationEntry(trimmed);
    const nextRows = [...rows.filter((r) => r.name.trim()), parsed];
    setRows(nextRows);
    onChangeMedicationText(serializeMedicationList(nextRows));
    setQuickOtherText('');
  };

  const handleAddItem = (groupId: string) => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    const nextGroups = groups.map((g) => {
      if (g.id !== groupId) return g;
      if (g.items.some((it) => it.toLowerCase() === trimmed.toLowerCase())) return g;
      return { ...g, items: [...g.items, trimmed] };
    });
    onUpdateGroups(nextGroups);
    setNewItemText('');
    setAddingToGroupId(null);
  };

  const handleSaveEditedItem = () => {
    if (!editingItem) return;
    const trimmed = editingItem.text.trim();
    if (!trimmed) return;
    const nextGroups = groups.map((g) => {
      if (g.id !== editingItem.groupId) return g;
      const nextItems = [...g.items];
      nextItems[editingItem.index] = trimmed;
      return { ...g, items: nextItems };
    });
    onUpdateGroups(nextGroups);
    setEditingItem(null);
  };

  const handleDeleteItem = (groupId: string, index: number) => {
    const nextGroups = groups.map((g) => {
      if (g.id !== groupId) return g;
      return { ...g, items: g.items.filter((_, idx) => idx !== index) };
    });
    onUpdateGroups(nextGroups);
  };

  const handleAddGroup = () => {
    const trimmed = newGroupLabel.trim();
    if (!trimmed) return;
    const nextGroups: MedicationGroup[] = [
      ...groups,
      {
        id: `grp_${Date.now().toString(36)}`,
        label: trimmed,
        items: [],
      },
    ];
    onUpdateGroups(nextGroups);
    setNewGroupLabel('');
    setShowAddGroup(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    onUpdateGroups(groups.filter((g) => g.id !== groupId));
  };

  const handleResetDefaults = () => {
    onUpdateGroups(DEFAULT_MEDICATION_GROUPS.map((g) => ({ ...g, items: [...g.items] })));
    setEditingItem(null);
    setAddingToGroupId(null);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">
          Medication : (เลือกตามกลุ่มยา)
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {manageMode && (
            <>
              <button
                type="button"
                onClick={() => setShowAddGroup((v) => !v)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-pblue-800 bg-pblue-50 border border-pblue-200 rounded hover:bg-pblue-100 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3 h-3" />
                เพิ่มกลุ่มยา
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white border border-pborder rounded hover:bg-pblue-50 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                รีเซ็ตค่าเริ่มต้น
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setManageMode((v) => !v);
              setEditingItem(null);
              setAddingToGroupId(null);
              setShowAddGroup(false);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              manageMode
                ? 'bg-pblue-600 border-pblue-600 text-white'
                : 'bg-white border-pborder text-slate-700 hover:bg-pblue-50'
            }`}
          >
            <Settings2 className="w-3 h-3" />
            {manageMode ? 'เสร็จสิ้นการแก้ไข' : 'แก้ไข / เพิ่มลดรายการยา'}
          </button>
        </div>
      </div>

      {manageMode && showAddGroup && (
        <div className="flex items-center gap-2 p-2 bg-pblue-50/50 border border-pblue-200 rounded-lg">
          <input
            type="text"
            value={newGroupLabel}
            onChange={(e) => setNewGroupLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddGroup();
              }
            }}
            placeholder="ชื่อกลุ่มยาใหม่ เช่น 12. ยาจิตเวช / สเตียรอยด์"
            className="flex-1 bg-white border border-pborder rounded px-2 py-1 text-xs text-[#243040] focus:outline-none focus:border-pblue-400"
          />
          <button
            type="button"
            onClick={handleAddGroup}
            className="px-2.5 py-1 text-xs font-medium text-white bg-pblue-600 rounded hover:bg-pblue-700 whitespace-nowrap shrink-0"
          >
            เพิ่มกลุ่ม
          </button>
        </div>
      )}

      {/* Grouped Medication Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {groups.map((group) => {
          const isAntithromboticGroup =
            group.id === 'anticoag' || group.id === 'antiplatelet';
          return (
            <div
              key={group.id}
              className={`border rounded-lg p-2 space-y-1.5 ${
                group.id === 'anticoag'
                  ? 'border-prose-200 bg-prose-50/35'
                  : group.id === 'antiplatelet'
                    ? 'border-pyellow-200 bg-pyellow-50/35'
                    : 'border-pborder bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[11px] font-semibold truncate ${
                    group.id === 'anticoag'
                      ? 'text-prose-800'
                      : group.id === 'antiplatelet'
                        ? 'text-pyellow-800'
                        : 'text-[#243040]'
                  }`}
                >
                  {group.label}
                </span>
                {isAntithromboticGroup && !manageMode && (
                  <span className="text-[10px] font-medium text-slate-500 shrink-0">
                    ระบุวันหยุดยาได้
                  </span>
                )}
                {manageMode && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingToGroupId(addingToGroupId === group.id ? null : group.id);
                        setNewItemText('');
                      }}
                      title={`เพิ่มยาใน ${group.label}`}
                      className="inline-flex items-center gap-0.5 text-[10px] font-medium text-pblue-800 hover:text-pblue-900 px-1 py-0.5 rounded hover:bg-pblue-50"
                    >
                      <Plus className="w-3 h-3" />
                      เพิ่ม
                    </button>
                    {groups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group.id)}
                        title={`ลบกลุ่ม ${group.label}`}
                        aria-label={`ลบกลุ่ม ${group.label}`}
                        className="p-0.5 text-slate-400 hover:text-prose-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {group.items.length === 0 && !manageMode && group.id !== 'other' && (
                  <span className="text-[11px] text-slate-400">
                    ไม่มีรายการ (กดแก้ไขเพื่อเพิ่ม)
                  </span>
                )}
                {group.items.map((drug, idx) => {
                  const isEditingThis =
                    editingItem?.groupId === group.id && editingItem.index === idx;
                  if (isEditingThis) {
                    return (
                      <div key={`${group.id}_edit_${idx}`} className="flex items-center gap-1 w-full">
                        <input
                          type="text"
                          value={editingItem.text}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, text: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditedItem();
                            } else if (e.key === 'Escape') {
                              setEditingItem(null);
                            }
                          }}
                          className="flex-1 min-w-0 bg-white border border-pblue-500 rounded px-1.5 py-0.5 text-[11px] text-[#243040] focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveEditedItem}
                          aria-label="บันทึกชื่อยา"
                          className="p-1 text-pgreen-700 hover:bg-pgreen-50 rounded"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem(null)}
                          aria-label="ยกเลิก"
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  }

                  const active = hasMedicationToken(medicationText, drug);
                  const activeCls =
                    group.id === 'anticoag'
                      ? 'bg-prose-100 border-prose-400 text-prose-800'
                      : group.id === 'antiplatelet'
                        ? 'bg-pyellow-100 border-pyellow-400 text-pyellow-800'
                        : 'bg-pblue-100 border-pblue-400 text-pblue-800';
                  return (
                    <div key={`${group.id}_${idx}_${drug}`} className="inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => handleToggleDrug(drug, group.autoUnderlying)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? activeCls
                            : 'bg-white/80 border-pborder text-slate-700 hover:bg-pblue-50/70'
                        }`}
                      >
                        <span className="font-mono text-[10px]">{active ? '☑' : '☐'}</span>
                        <span>{drug}</span>
                      </button>
                      {manageMode && (
                        <span className="inline-flex items-center ml-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingItem({ groupId: group.id, index: idx, text: drug })
                            }
                            aria-label={`แก้ไข ${drug}`}
                            className="p-0.5 text-slate-400 hover:text-pblue-800"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(group.id, idx)}
                            aria-label={`ลบ ${drug}`}
                            className="p-0.5 text-slate-400 hover:text-prose-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {manageMode && addingToGroupId === group.id && (
                <div className="flex items-center gap-1 pt-1">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem(group.id);
                      }
                    }}
                    placeholder="ชื่อยา + ขนาด"
                    className="flex-1 min-w-0 bg-white border border-pborder rounded px-1.5 py-0.5 text-[11px] text-[#243040] focus:outline-none focus:border-pblue-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem(group.id)}
                    className="px-2 py-0.5 text-[11px] font-medium text-white bg-pblue-600 rounded hover:bg-pblue-700 shrink-0"
                  >
                    เพิ่ม
                  </button>
                </div>
              )}
              {group.id === 'other' && !manageMode && (
                <div className="flex items-center gap-1 pt-0.5">
                  <input
                    type="text"
                    value={quickOtherText}
                    onChange={(e) => setQuickOtherText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickAddOther();
                      }
                    }}
                    placeholder="ระบุยาอื่นๆ เช่น Omeprazole (20) 1x1"
                    aria-label="เพิ่มยาอื่นๆ"
                    className="flex-1 min-w-0 bg-pcanvas border border-pborder rounded px-2 py-1 text-[11px] text-[#243040] focus:bg-white focus:outline-none focus:border-pblue-400"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddOther}
                    className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-white bg-pblue-600 rounded hover:bg-pblue-700 shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    เพิ่ม
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Medications Editor: Strength (mg/unit), Regimen & Pre-op Hold Status/Date for Anticoag/Antiplatelet */}
      <div className="border border-pborder rounded-lg bg-white p-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-slate-700">
            รายการยาที่เลือก (แก้ไขจำนวน mg, ปริมาณที่รับประทาน และวันที่หยุดยาก่อนผ่าตัด)
          </span>
          <button
            type="button"
            onClick={handleAddBlankRow}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-pblue-800 hover:text-prose-800 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3 h-3" />
            เพิ่มยาอื่นๆ
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-[11px] text-slate-400 py-1">
            คลิกเลือกยาจากกลุ่มด้านบน หรือกด &quot;+ เพิ่มยาอื่นๆ&quot; เพื่อระบุจำนวน mg และปริมาณที่รับประทาน
          </p>
        ) : (
          <div className="space-y-2">
            <div className="hidden sm:grid grid-cols-[20px_1.2fr_0.9fr_1.1fr_24px] gap-1.5 text-[10px] font-medium text-slate-500 px-0.5">
              <span>#</span>
              <span>ชื่อยา</span>
              <span>จำนวน (mg / unit)</span>
              <span>ปริมาณที่รับประทาน / วิธีใช้</span>
              <span />
            </div>

            {rows.map((entry, idx) => {
              const autoClass = detectAutoPremedDrugClass(entry.name);
              const antiClass = detectAntithromboticDrugClass(entry.name, groups);
              const isAnticoag = antiClass === 'anticoagulant';
              const holdStatus =
                entry.holdStatus ?? (entry.stopped ? 'stopped' : '');
              const isStopped = holdStatus === 'stopped';
              const isNotStopped = holdStatus === 'not_stopped';
              const isAntithrombotic = Boolean(antiClass) || Boolean(holdStatus);

              return (
                <div
                  key={`sel_med_${idx}`}
                  className={
                    isAntithrombotic
                      ? `rounded-lg border p-2 space-y-2 ${
                          isAnticoag
                            ? 'bg-prose-50/55 border-prose-200'
                            : 'bg-pyellow-50/55 border-pyellow-200'
                        }`
                      : ''
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[20px_1.2fr_0.9fr_1.1fr_24px] gap-1.5 items-center">
                    <span className="hidden sm:inline-block font-mono text-[11px] text-slate-400 text-right pr-0.5">
                      {idx + 1}.
                    </span>
                    <div className="space-y-0.5">
                      <input
                        type="text"
                        value={entry.name}
                        onChange={(e) => handleUpdateRow(idx, { name: e.target.value })}
                        placeholder="ชื่อยา"
                        aria-label="ชื่อยา"
                        className="w-full bg-white border border-pborder rounded px-2 py-1 text-xs font-medium text-[#243040] focus:outline-none focus:border-pblue-400"
                      />
                      {autoClass && (
                        <div className="text-[10px] font-medium text-pgreen-800 px-0.5">
                          {autoClass} · สั่งเป็นยา Pre-med อัตโนมัติ
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={entry.dose}
                      onChange={(e) => handleUpdateRow(idx, { dose: e.target.value })}
                      placeholder="เช่น 5 mg, 20 u"
                      aria-label="จำนวน mg"
                      className="bg-white border border-pborder rounded px-2 py-1 text-xs font-mono tabular-nums text-[#243040] focus:outline-none focus:border-pblue-400"
                    />
                    <input
                      type="text"
                      list="bph-regimen-suggestions"
                      value={entry.regimen}
                      onChange={(e) => handleUpdateRow(idx, { regimen: e.target.value })}
                      placeholder="เช่น 1x1 pc, เช้า-เย็น"
                      aria-label="ปริมาณที่รับประทาน"
                      className="bg-white border border-pborder rounded px-2 py-1 text-xs text-[#243040] focus:outline-none focus:border-pblue-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      aria-label={`ลบ ${entry.name || 'รายการยา'}`}
                      className="p-1 text-slate-400 hover:text-prose-700 justify-self-end sm:justify-self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pre-op Hold Status & Stop Date Row for Anticoagulant & Antiplatelet */}
                  {isAntithrombotic && (
                    <div className="sm:pl-[26px] pt-1.5 border-t border-black/5 flex flex-wrap items-center gap-2 text-[11px]">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                          isAnticoag
                            ? 'bg-prose-100 text-prose-800'
                            : 'bg-pyellow-100 text-pyellow-800'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {isAnticoag ? 'Anticoagulant' : 'Antiplatelet'}
                      </span>

                      {/* Explicit 2-choice status: ไม่หยุดยา / หยุดยาก่อนผ่าตัด */}
                      <div className="inline-flex items-center gap-1.5">
                        <label
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border cursor-pointer select-none font-medium transition-colors ${
                            isNotStopped
                              ? 'bg-prose-100 border-prose-400 text-prose-800 font-semibold'
                              : 'bg-white border-pborder text-slate-700 hover:bg-prose-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isNotStopped}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              handleUpdateRow(idx, {
                                holdStatus: checked ? 'not_stopped' : '',
                                stopped: false,
                                stopDate: '',
                                stopDuration: '',
                              });
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 accent-prose-600"
                          />
                          <span>ไม่หยุดยา</span>
                        </label>

                        <label
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border cursor-pointer select-none font-medium transition-colors ${
                            isStopped
                              ? 'bg-pgreen-100 border-pgreen-400 text-pgreen-800 font-semibold'
                              : 'bg-white border-pborder text-slate-700 hover:bg-pgreen-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isStopped}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              handleUpdateRow(idx, {
                                holdStatus: checked ? 'stopped' : '',
                                stopped: checked,
                                stopDate: checked ? entry.stopDate ?? '' : '',
                                stopDuration: '',
                              });
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 accent-pblue-600"
                          />
                          <span>หยุดยาก่อนผ่าตัด</span>
                        </label>
                      </div>

                      {!isNotStopped && (
                        <div className="inline-flex items-center gap-1">
                          <span className="text-[11px] font-medium text-slate-600">วันที่หยุด:</span>
                          <ThaiDateInput
                            value={entry.stopDate ?? ''}
                            onChange={(nextIso) => {
                              if (!nextIso) {
                                handleUpdateRow(idx, {
                                  stopDate: '',
                                  stopDuration: '',
                                  holdStatus: isStopped ? 'stopped' : '',
                                  stopped: isStopped,
                                });
                                return;
                              }
                              handleUpdateRow(idx, {
                                holdStatus: 'stopped',
                                stopped: true,
                                stopDate: nextIso,
                                stopDuration: '',
                              });
                            }}
                            ariaLabel={`วันที่หยุดยา ${entry.name || 'ยา'}`}
                            placeholder="วว/ดด/ปปปป"
                            className="w-[126px] bg-white border border-pborder rounded px-2 py-0.5 text-xs font-mono tabular-nums text-[#243040] focus:outline-none focus:border-pblue-400"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <datalist id="bph-regimen-suggestions">
          {REGIMEN_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
