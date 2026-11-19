import React, { useEffect, useState } from 'react';
import { Check, Edit2, Plus, RotateCcw, Settings2, Trash2, X } from 'lucide-react';
import {
  DEFAULT_MEDICATION_GROUPS,
  detectAutoPremedDrugClass,
  hasMedicationToken,
  MedicationGroup,
  parseMedicationEntry,
  parseMedicationList,
  SelectedMedicationEntry,
  serializeMedicationList,
  toggleMedicationToken,
} from '../types/evaluation';

interface MedicationGroupSelectorProps {
  groups: MedicationGroup[];
  medicationText: string;
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
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3 h-3" />
                เพิ่มกลุ่มยา
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 whitespace-nowrap shrink-0"
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
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Settings2 className="w-3 h-3" />
            {manageMode ? 'เสร็จสิ้นการแก้ไข' : 'แก้ไข / เพิ่มลดรายการยา'}
          </button>
        </div>
      </div>

      {manageMode && showAddGroup && (
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
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
            placeholder="ชื่อกลุ่มยาใหม่ เช่น 10. ยาจิตเวช / สเตียรอยด์"
            className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
          />
          <button
            type="button"
            onClick={handleAddGroup}
            className="px-2.5 py-1 text-xs font-medium text-white bg-blue-800 rounded hover:bg-blue-900 whitespace-nowrap shrink-0"
          >
            เพิ่มกลุ่ม
          </button>
        </div>
      )}

      {/* 9 Grouped Medication Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="border border-slate-200 rounded-lg p-2 bg-white space-y-1.5"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-slate-800 truncate">
                {group.label}
              </span>
              {manageMode && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingToGroupId(addingToGroupId === group.id ? null : group.id);
                      setNewItemText('');
                    }}
                    title={`เพิ่มยาใน ${group.label}`}
                    className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-800 hover:text-blue-900 px-1 py-0.5 rounded hover:bg-blue-50"
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
                      className="p-0.5 text-slate-400 hover:text-red-600"
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
                        className="flex-1 min-w-0 bg-white border border-blue-700 rounded px-1.5 py-0.5 text-[11px] text-slate-900 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditedItem}
                        aria-label="บันทึกชื่อยา"
                        className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
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
                return (
                  <div key={`${group.id}_${idx}_${drug}`} className="inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => handleToggleDrug(drug, group.autoUnderlying)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-blue-50 border-blue-800 text-blue-900'
                          : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
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
                          className="p-0.5 text-slate-400 hover:text-blue-800"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(group.id, idx)}
                          aria-label={`ลบ ${drug}`}
                          className="p-0.5 text-slate-400 hover:text-red-600"
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
                  className="flex-1 min-w-0 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] text-slate-900 focus:outline-none focus:border-blue-800"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleAddItem(group.id)}
                  className="px-2 py-0.5 text-[11px] font-medium text-white bg-blue-800 rounded hover:bg-blue-900 shrink-0"
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
                  className="flex-1 min-w-0 bg-slate-50/70 border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-900 focus:bg-white focus:outline-none focus:border-blue-800"
                />
                <button
                  type="button"
                  onClick={handleQuickAddOther}
                  className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-white bg-blue-800 rounded hover:bg-blue-900 shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  เพิ่ม
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Medications Editor: Strength (mg/unit) & Dosage Regimen */}
      <div className="border border-slate-200 rounded-lg bg-white p-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-slate-700">
            รายการยาที่เลือก (แก้ไขจำนวน mg และปริมาณที่รับประทาน)
          </span>
          <button
            type="button"
            onClick={handleAddBlankRow}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-800 hover:text-blue-900 whitespace-nowrap shrink-0"
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
          <div className="space-y-1.5">
            <div className="hidden sm:grid grid-cols-[1.2fr_0.9fr_1.1fr_24px] gap-1.5 text-[10px] font-medium text-slate-500 px-0.5">
              <span>ชื่อยา</span>
              <span>จำนวน (mg / unit)</span>
              <span>ปริมาณที่รับประทาน / วิธีใช้</span>
              <span />
            </div>

            {rows.map((entry, idx) => {
              const autoClass = detectAutoPremedDrugClass(entry.name);
              return (
              <div
                key={`sel_med_${idx}`}
                className="grid grid-cols-1 sm:grid-cols-[1.2fr_0.9fr_1.1fr_24px] gap-1.5 items-center"
              >
                <div className="space-y-0.5">
                  <input
                    type="text"
                    value={entry.name}
                    onChange={(e) => handleUpdateRow(idx, { name: e.target.value })}
                    placeholder="ชื่อยา"
                    aria-label="ชื่อยา"
                    className="w-full bg-slate-50/70 border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-800"
                  />
                  {autoClass && (
                    <div className="text-[10px] font-medium text-emerald-700 px-0.5">
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
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-800"
                />
                <input
                  type="text"
                  list="bph-regimen-suggestions"
                  value={entry.regimen}
                  onChange={(e) => handleUpdateRow(idx, { regimen: e.target.value })}
                  placeholder="เช่น 1x1 pc, เช้า-เย็น"
                  aria-label="ปริมาณที่รับประทาน"
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-800"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  aria-label={`ลบ ${entry.name || 'รายการยา'}`}
                  className="p-1 text-slate-400 hover:text-red-600 justify-self-end sm:justify-self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
