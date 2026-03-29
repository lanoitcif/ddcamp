import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Sword, Heart, Trophy, Scroll, Star, Plus, Trash2, Save, Upload, Download,
  Eye, X, ChevronDown, ChevronUp, FileJson, FolderOpen, Sparkles, Shield,
  Map, BookOpen, AlertCircle, Check, Copy
} from 'lucide-react';
import {
  validateCampaign, createScene, createCharacter, createMonster, createQuest,
  createAction, createEmptyCampaign, importCampaignJSON,
  downloadCampaignFile
} from './campaignSchema';
import defaultCampaignData from './campaign_data.json';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'characters', label: 'Characters', icon: Shield },
  { id: 'scenes', label: 'Scenes', icon: Map },
  { id: 'monsters', label: 'Monsters', icon: Sword },
  { id: 'quests', label: 'Quests', icon: Trophy },
];

const DAMAGE_PATTERN = /^\d+d\d+([+-]\d+)?$/;

// generateId not needed — factories in campaignSchema.js handle ID creation

// --- Reusable UI Primitives ---

function SectionHeader({ icon: SectionIcon, title, count, children }) { // eslint-disable-line no-unused-vars
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-dnd-gold flex items-center gap-2">
        <SectionIcon size={22} />
        {title}
        {count !== undefined && (
          <span className="text-sm font-normal text-gray-400 ml-1">({count})</span>
        )}
      </h2>
      {children}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, className = '', large }) {
  return (
    <label className="block">
      {label && <span className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">{label}</span>}
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white
          placeholder-gray-500 focus:border-dnd-gold focus:outline-none focus:ring-1
          focus:ring-dnd-gold/50 transition-colors ${large ? 'text-xl font-bold' : 'text-sm'} ${className}`}
      />
    </label>
  );
}

function NumberInput({ label, value, onChange, min = 0, max }) {
  return (
    <label className="block">
      {label && <span className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">{label}</span>}
      <input
        type="number"
        value={value ?? ''}
        onChange={e => onChange(parseInt(e.target.value, 10) || 0)}
        min={min}
        max={max}
        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm
          focus:border-dnd-gold focus:outline-none focus:ring-1 focus:ring-dnd-gold/50 transition-colors"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="block">
      {label && <span className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">{label}</span>}
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm
          placeholder-gray-500 focus:border-dnd-gold focus:outline-none focus:ring-1
          focus:ring-dnd-gold/50 transition-colors resize-y"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      {label && <span className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">{label}</span>}
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm
          focus:border-dnd-gold focus:outline-none focus:ring-1 focus:ring-dnd-gold/50 transition-colors"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

function DamageInput({ value, onChange }) {
  const isValid = !value || DAMAGE_PATTERN.test(value);
  return (
    <label className="block relative">
      <span className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Damage</span>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="1d6+2"
        className={`w-full bg-gray-800 border rounded px-3 py-2 text-white text-sm
          focus:outline-none focus:ring-1 transition-colors
          ${isValid
            ? 'border-gray-600 focus:border-dnd-gold focus:ring-dnd-gold/50'
            : 'border-red-500 focus:border-red-400 focus:ring-red-400/50'}`}
      />
      {!isValid && (
        <span className="absolute right-2 top-7 text-red-400" title="Format: NdN or NdN+N or NdN-N">
          <AlertCircle size={16} />
        </span>
      )}
    </label>
  );
}

function ConfirmButton({ onConfirm, icon: ConfirmIcon = Trash2, label = 'Delete', className = '' }) { // eslint-disable-line no-unused-vars
  const [confirming, setConfirming] = useState(false);
  return confirming ? (
    <span className="inline-flex gap-1 items-center">
      <button
        onClick={() => { onConfirm(); setConfirming(false); }}
        className="text-xs px-2 py-1 bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
      >
        Confirm
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
      >
        Cancel
      </button>
    </span>
  ) : (
    <button
      onClick={() => setConfirming(true)}
      className={`text-gray-400 hover:text-red-400 transition-colors ${className}`}
      title={label}
    >
      <ConfirmIcon size={16} />
    </button>
  );
}

// --- Action List Editor ---

function ActionListEditor({ actions, onChange }) {
  const update = (idx, field, val) => {
    const next = actions.map((a, i) => i === idx ? { ...a, [field]: val } : a);
    onChange(next);
  };
  const remove = idx => onChange(actions.filter((_, i) => i !== idx));
  const add = () => onChange([...actions, createAction()]);

  return (
    <div className="mt-3 border-t border-gray-700 pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-dnd-gold uppercase tracking-wide font-semibold">Actions</span>
        <button onClick={add} className="text-xs text-dnd-gold hover:text-yellow-300 flex items-center gap-1 transition-colors">
          <Plus size={12} /> Add Action
        </button>
      </div>
      {actions.length === 0 && (
        <p className="text-xs text-gray-500 italic">No actions defined</p>
      )}
      {actions.map((action, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_80px_120px_auto] gap-2 items-end mb-2">
          <TextInput label={idx === 0 ? 'Name' : undefined} value={action.name}
            onChange={v => update(idx, 'name', v)} placeholder="Attack name" />
          <NumberInput label={idx === 0 ? 'Bonus' : undefined} value={action.bonus}
            onChange={v => update(idx, 'bonus', v)} />
          <DamageInput value={action.damage} onChange={v => update(idx, 'damage', v)} />
          <button onClick={() => remove(idx)} className="text-gray-500 hover:text-red-400 transition-colors pb-2"
            title="Remove action">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// --- JSON Preview Modal ---

function JsonPreviewModal({ data, onClose }) {
  const json = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [json]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-gray-900 border-2 border-dnd-gold rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h3 className="text-dnd-gold font-bold flex items-center gap-2">
            <FileJson size={18} /> Campaign JSON Preview
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy}
              className="text-xs px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600
                flex items-center gap-1 transition-colors">
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        <pre className="flex-1 overflow-auto p-5 text-xs text-green-300 font-mono leading-relaxed">
          {json}
        </pre>
      </div>
    </div>
  );
}

// --- Tab: Overview ---

function OverviewTab({ campaign, setCampaign, onPreviewJSON, onNewCampaign }) {
  return (
    <div className="space-y-6">
      <TextInput
        label="Campaign Name"
        value={campaign.campaignName}
        onChange={v => setCampaign(prev => ({ ...prev, campaignName: v }))}
        placeholder="Enter campaign name…"
        large
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Shield, label: 'Characters', count: campaign.characters?.length || 0, color: 'text-blue-400' },
          { icon: Map, label: 'Scenes', count: campaign.scenes?.length || 0, color: 'text-green-400' },
          { icon: Sword, label: 'Monsters', count: campaign.monsters?.length || 0, color: 'text-red-400' },
          { icon: Trophy, label: 'Quests', count: campaign.quests?.length || 0, color: 'text-yellow-400' },
        ].map(stat => (
          <div key={stat.label} className="dnd-card flex items-center gap-3 hover:border-dnd-gold/70 transition-colors">
            <stat.icon size={28} className={stat.color} />
            <div>
              <div className="text-2xl font-bold text-white">{stat.count}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onPreviewJSON} className="dnd-button flex items-center gap-2">
          <Eye size={16} /> Preview JSON
        </button>
        <button onClick={onNewCampaign}
          className="px-4 py-2 bg-gray-700 text-white font-bold rounded border-2 border-gray-500
            hover:bg-gray-600 transition-colors shadow-lg active:scale-95 flex items-center gap-2">
          <Sparkles size={16} /> New Campaign
        </button>
      </div>
    </div>
  );
}

// --- Tab: Characters ---

function CharacterCard({ character, onChange, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);

  const update = (field, value) => onChange({ ...character, [field]: value });

  return (
    <div className="dnd-card mb-4 hover:border-dnd-gold/70 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {character.image && (
            <img src={character.image} alt="" className="w-10 h-10 rounded-full border border-dnd-gold object-cover" />
          )}
          <span className="font-bold text-dnd-gold">{character.name || 'Unnamed Character'}</span>
          <span className="text-xs text-gray-400">{character.class}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(c => !c)}
            className="text-gray-400 hover:text-white transition-colors" title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <ConfirmButton onConfirm={onDelete} />
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <TextInput label="Name" value={character.name} onChange={v => update('name', v)} placeholder="Character name" />
            <TextInput label="Class" value={character.class} onChange={v => update('class', v)} placeholder="e.g. Fighter" />
            <TextInput label="Image URL" value={character.image} onChange={v => update('image', v)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumberInput label="HP" value={character.hp} onChange={v => update('hp', v)} />
            <NumberInput label="Max HP" value={character.maxHp} onChange={v => update('maxHp', v)} />
            <NumberInput label="Attack Bonus" value={character.bonus} onChange={v => update('bonus', v)} />
          </div>
          <ActionListEditor
            actions={character.actions || []}
            onChange={actions => update('actions', actions)}
          />
        </>
      )}
    </div>
  );
}

function CharactersTab({ campaign, setCampaign }) {
  const updateChar = (idx, char) => {
    setCampaign(prev => ({
      ...prev,
      characters: prev.characters.map((c, i) => i === idx ? char : c),
    }));
  };
  const deleteChar = idx => {
    setCampaign(prev => ({
      ...prev,
      characters: prev.characters.filter((_, i) => i !== idx),
    }));
  };
  const addChar = () => {
    setCampaign(prev => ({
      ...prev,
      characters: [...prev.characters, createCharacter()],
    }));
  };

  return (
    <div>
      <SectionHeader icon={Shield} title="Characters" count={campaign.characters?.length || 0}>
        <button onClick={addChar} className="dnd-button text-sm flex items-center gap-1">
          <Plus size={14} /> Add Character
        </button>
      </SectionHeader>
      {(!campaign.characters || campaign.characters.length === 0) && (
        <div className="dnd-card text-center text-gray-400 py-8">
          <Shield size={36} className="mx-auto mb-2 opacity-30" />
          <p>No characters yet. Add one to get started!</p>
        </div>
      )}
      {campaign.characters?.map((char, idx) => (
        <CharacterCard
          key={char.id || idx}
          character={char}
          onChange={c => updateChar(idx, c)}
          onDelete={() => deleteChar(idx)}
        />
      ))}
    </div>
  );
}

// --- Tab: Scenes ---

function SceneCard({ scene, index, total, onChange, onDelete, onMove }) {
  const [collapsed, setCollapsed] = useState(false);

  const update = (field, value) => onChange({ ...scene, [field]: value });
  const updateNote = (field, value) => onChange({ ...scene, dmNotes: { ...scene.dmNotes, [field]: value } });

  return (
    <div className="dnd-card mb-4 hover:border-dnd-gold/70 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-mono">
            {scene.chapter || 'No Chapter'}
          </span>
          <span className="font-bold text-dnd-gold">{scene.title || 'Untitled Scene'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={index === 0}
            className="text-gray-400 hover:text-white disabled:opacity-20 transition-colors" title="Move up">
            <ChevronUp size={16} />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1}
            className="text-gray-400 hover:text-white disabled:opacity-20 transition-colors" title="Move down">
            <ChevronDown size={16} />
          </button>
          <button onClick={() => setCollapsed(c => !c)}
            className="text-gray-400 hover:text-white transition-colors ml-1">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <ConfirmButton onConfirm={onDelete} />
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <TextInput label="Title" value={scene.title} onChange={v => update('title', v)} placeholder="Scene title" />
            <TextInput label="ID" value={scene.id} onChange={v => update('id', v)} placeholder="scene-id" />
            <TextInput label="Chapter" value={scene.chapter} onChange={v => update('chapter', v)} placeholder="Ch 1 · ..." />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            <TextArea label="Description" value={scene.description} onChange={v => update('description', v)}
              placeholder="What the players see and hear…" rows={3} />
            <TextArea label="Intro Narration" value={scene.introNarration} onChange={v => update('introNarration', v)}
              placeholder="Read-aloud text for the players…" rows={3} />
          </div>
          <TextInput label="Image URL" value={scene.image} onChange={v => update('image', v)}
            placeholder="https://..." className="mb-3" />

          <div className="border-t border-gray-700 pt-3 mt-3">
            <span className="text-xs text-dnd-gold uppercase tracking-wide font-semibold block mb-2">DM Notes & AI Options</span>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
              <TextInput label="NPCs" value={scene.dmNotes?.npcs} onChange={v => updateNote('npcs', v)}
                placeholder="Key NPCs in this scene" />
              <TextInput label="Tactics" value={scene.dmNotes?.tactics} onChange={v => updateNote('tactics', v)}
                placeholder="Combat/social tactics" />
              <TextInput label="Quest Hints" value={scene.dmNotes?.questHints} onChange={v => updateNote('questHints', v)}
                placeholder="Related quests" />
              <TextInput label="DM Tip" value={scene.dmNotes?.tip} onChange={v => updateNote('tip', v)}
                placeholder="Gameplay tips" />
            </div>
            <div className="bg-gray-800 p-3 rounded border border-gray-700">
              <TextInput label="AI Narrator Voice ID" value={scene.aiNarratorVoiceId} onChange={v => update('aiNarratorVoiceId', v)}
                placeholder="e.g., narrator_deep (Optional)" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ScenesTab({ campaign, setCampaign }) {
  const updateScene = (idx, scene) => {
    setCampaign(prev => ({
      ...prev,
      scenes: prev.scenes.map((s, i) => i === idx ? scene : s),
    }));
  };
  const deleteScene = idx => {
    setCampaign(prev => ({
      ...prev,
      scenes: prev.scenes.filter((_, i) => i !== idx),
    }));
  };
  const addScene = () => {
    setCampaign(prev => ({
      ...prev,
      scenes: [...prev.scenes, createScene()],
    }));
  };
  const moveScene = (idx, dir) => {
    setCampaign(prev => {
      const scenes = [...prev.scenes];
      const target = idx + dir;
      if (target < 0 || target >= scenes.length) return prev;
      [scenes[idx], scenes[target]] = [scenes[target], scenes[idx]];
      return { ...prev, scenes };
    });
  };

  const chapters = useMemo(() => {
    const map = {};
    (campaign.scenes || []).forEach((scene, idx) => {
      const ch = scene.chapter || 'Uncategorized';
      if (!map[ch]) map[ch] = [];
      map[ch].push({ scene, idx });
    });
    return map;
  }, [campaign.scenes]);

  return (
    <div>
      <SectionHeader icon={Map} title="Scenes" count={campaign.scenes?.length || 0}>
        <button onClick={addScene} className="dnd-button text-sm flex items-center gap-1">
          <Plus size={14} /> Add Scene
        </button>
      </SectionHeader>
      {(!campaign.scenes || campaign.scenes.length === 0) && (
        <div className="dnd-card text-center text-gray-400 py-8">
          <Map size={36} className="mx-auto mb-2 opacity-30" />
          <p>No scenes yet. Add one to build your adventure!</p>
        </div>
      )}
      {Object.entries(chapters).map(([chapter, entries]) => (
        <div key={chapter} className="mb-6">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Scroll size={14} className="text-dnd-gold" />
            {chapter}
          </h3>
          {entries.map(({ scene, idx }) => (
            <SceneCard
              key={scene.id || idx}
              scene={scene}
              index={idx}
              total={campaign.scenes.length}
              onChange={s => updateScene(idx, s)}
              onDelete={() => deleteScene(idx)}
              onMove={dir => moveScene(idx, dir)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Tab: Monsters ---

function MonsterCard({ monster, scenes, onChange, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);

  const update = (field, value) => onChange({ ...monster, [field]: value });

  const sceneOptions = [
    { value: '', label: '— Select Scene —' },
    ...(scenes || []).map(s => ({ value: s.id, label: s.title || s.id })),
  ];

  return (
    <div className="dnd-card mb-4 hover:border-dnd-gold/70 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {monster.image && (
            <img src={monster.image} alt="" className="w-10 h-10 rounded-full border border-dnd-gold object-cover" />
          )}
          <span className="font-bold text-dnd-gold">{monster.name || 'Unnamed Monster'}</span>
          <span className="text-xs text-gray-500">
            {scenes?.find(s => s.id === monster.sceneId)?.title || monster.sceneId || 'No scene'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(c => !c)}
            className="text-gray-400 hover:text-white transition-colors">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <ConfirmButton onConfirm={onDelete} />
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <TextInput label="Name" value={monster.name} onChange={v => update('name', v)} placeholder="Monster name" />
            <SelectInput label="Scene" value={monster.sceneId} onChange={v => update('sceneId', v)} options={sceneOptions} />
            <TextInput label="Image URL" value={monster.image} onChange={v => update('image', v)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <NumberInput label="HP" value={monster.hp} onChange={v => update('hp', v)} />
            <NumberInput label="Max HP" value={monster.maxHp} onChange={v => update('maxHp', v)} />
          </div>
          <div className="bg-gray-800 p-3 rounded border border-gray-700 mb-3">
            <span className="text-xs text-dnd-gold uppercase tracking-wide font-semibold block mb-2">AI Persona (Optional)</span>
            <div className="mb-2">
              <TextInput label="AI Voice ID" value={monster.aiVoiceId} onChange={v => update('aiVoiceId', v)} placeholder="e.g., gruff_dwarf" />
            </div>
            <TextArea label="AI Prompt" value={monster.aiPrompt} onChange={v => update('aiPrompt', v)}
              placeholder="System prompt for how this monster behaves..." rows={2} />
          </div>
          <ActionListEditor
            actions={monster.actions || []}
            onChange={actions => update('actions', actions)}
          />
        </>
      )}
    </div>
  );
}

function MonstersTab({ campaign, setCampaign }) {
  const updateMonster = (idx, monster) => {
    setCampaign(prev => ({
      ...prev,
      monsters: prev.monsters.map((m, i) => i === idx ? monster : m),
    }));
  };
  const deleteMonster = idx => {
    setCampaign(prev => ({
      ...prev,
      monsters: prev.monsters.filter((_, i) => i !== idx),
    }));
  };
  const addMonster = () => {
    setCampaign(prev => ({
      ...prev,
      monsters: [...prev.monsters, createMonster()],
    }));
  };

  const groupedByScene = useMemo(() => {
    const map = {};
    (campaign.monsters || []).forEach((monster, idx) => {
      const sceneId = monster.sceneId || '_unassigned';
      if (!map[sceneId]) map[sceneId] = [];
      map[sceneId].push({ monster, idx });
    });
    return map;
  }, [campaign.monsters]);

  const sceneTitle = sceneId => {
    if (sceneId === '_unassigned') return 'Unassigned';
    return campaign.scenes?.find(s => s.id === sceneId)?.title || sceneId;
  };

  return (
    <div>
      <SectionHeader icon={Sword} title="Monsters" count={campaign.monsters?.length || 0}>
        <button onClick={addMonster} className="dnd-button text-sm flex items-center gap-1">
          <Plus size={14} /> Add Monster
        </button>
      </SectionHeader>
      {(!campaign.monsters || campaign.monsters.length === 0) && (
        <div className="dnd-card text-center text-gray-400 py-8">
          <Sword size={36} className="mx-auto mb-2 opacity-30" />
          <p>No monsters yet. Add one to challenge your heroes!</p>
        </div>
      )}
      {Object.entries(groupedByScene).map(([sceneId, entries]) => (
        <div key={sceneId} className="mb-6">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Map size={14} className="text-dnd-gold" />
            {sceneTitle(sceneId)}
          </h3>
          {entries.map(({ monster, idx }) => (
            <MonsterCard
              key={monster.id || idx}
              monster={monster}
              scenes={campaign.scenes || []}
              onChange={m => updateMonster(idx, m)}
              onDelete={() => deleteMonster(idx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Tab: Quests ---

function QuestCard({ quest, onChange, onDelete }) {
  const update = (field, value) => onChange({ ...quest, [field]: value });

  return (
    <div className="dnd-card mb-3 flex items-start gap-4 hover:border-dnd-gold/70 transition-colors">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <TextInput label="Title" value={quest.title} onChange={v => update('title', v)} placeholder="Quest title" />
        <TextInput label="Reward" value={quest.reward} onChange={v => update('reward', v)} placeholder="Reward item" />
        <div>
          <span className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Type</span>
          <div className="flex gap-1">
            <button
              onClick={() => update('type', 'main')}
              className={`flex-1 text-xs px-3 py-2 rounded font-bold transition-colors border
                ${quest.type === 'main'
                  ? 'bg-dnd-red text-white border-dnd-gold'
                  : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400'}`}
            >
              <Star size={12} className="inline mr-1" />Main
            </button>
            <button
              onClick={() => update('type', 'side')}
              className={`flex-1 text-xs px-3 py-2 rounded font-bold transition-colors border
                ${quest.type === 'side'
                  ? 'bg-dnd-red text-white border-dnd-gold'
                  : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400'}`}
            >
              <Scroll size={12} className="inline mr-1" />Side
            </button>
          </div>
        </div>
      </div>
      <ConfirmButton onConfirm={onDelete} className="mt-6" />
    </div>
  );
}

function QuestsTab({ campaign, setCampaign }) {
  const updateQuest = (idx, quest) => {
    setCampaign(prev => ({
      ...prev,
      quests: prev.quests.map((q, i) => i === idx ? quest : q),
    }));
  };
  const deleteQuest = idx => {
    setCampaign(prev => ({
      ...prev,
      quests: prev.quests.filter((_, i) => i !== idx),
    }));
  };
  const addQuest = () => {
    setCampaign(prev => ({
      ...prev,
      quests: [...prev.quests, createQuest()],
    }));
  };

  const mainQuests = (campaign.quests || [])
    .map((q, idx) => ({ quest: q, idx }))
    .filter(({ quest }) => quest.type === 'main');
  const sideQuests = (campaign.quests || [])
    .map((q, idx) => ({ quest: q, idx }))
    .filter(({ quest }) => quest.type !== 'main');

  return (
    <div>
      <SectionHeader icon={Trophy} title="Quests" count={campaign.quests?.length || 0}>
        <button onClick={addQuest} className="dnd-button text-sm flex items-center gap-1">
          <Plus size={14} /> Add Quest
        </button>
      </SectionHeader>

      {(!campaign.quests || campaign.quests.length === 0) && (
        <div className="dnd-card text-center text-gray-400 py-8">
          <Trophy size={36} className="mx-auto mb-2 opacity-30" />
          <p>No quests yet. Add one to give your heroes purpose!</p>
        </div>
      )}

      {mainQuests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Star size={14} /> Main Quests
          </h3>
          {mainQuests.map(({ quest, idx }) => (
            <QuestCard key={quest.id || idx} quest={quest}
              onChange={q => updateQuest(idx, q)} onDelete={() => deleteQuest(idx)} />
          ))}
        </div>
      )}

      {sideQuests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Scroll size={14} className="text-gray-400" /> Side Quests
          </h3>
          {sideQuests.map(({ quest, idx }) => (
            <QuestCard key={quest.id || idx} quest={quest}
              onChange={q => updateQuest(idx, q)} onDelete={() => deleteQuest(idx)} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main CampaignBuilder ---

export default function CampaignBuilder() {
  const [campaign, setCampaign] = useState(() => structuredClone(defaultCampaignData));
  const [activeTab, setActiveTab] = useState('overview');
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleExport = useCallback(() => {
    try {
      downloadCampaignFile(campaign);
      showToast('Campaign exported!');
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error');
    }
  }, [campaign, showToast]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = importCampaignJSON(text);
      const errors = validateCampaign(data);
      if (errors && errors.length > 0) {
        showToast(`Validation warnings: ${errors.length}`, 'error');
      }
      setCampaign(data);
      showToast('Campaign imported!');
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
    e.target.value = '';
  }, [showToast]);

  const handleLoadCurrent = useCallback(() => {
    setCampaign(structuredClone(defaultCampaignData));
    showToast('Loaded current campaign');
  }, [showToast]);

  const handleNewCampaign = useCallback(() => {
    setCampaign(createEmptyCampaign());
    showToast('New campaign created');
  }, [showToast]);

  const tabContent = {
    overview: (
      <OverviewTab
        campaign={campaign}
        setCampaign={setCampaign}
        onPreviewJSON={() => setShowJsonPreview(true)}
        onNewCampaign={handleNewCampaign}
      />
    ),
    characters: <CharactersTab campaign={campaign} setCampaign={setCampaign} />,
    scenes: <ScenesTab campaign={campaign} setCampaign={setCampaign} />,
    monsters: <MonstersTab campaign={campaign} setCampaign={setCampaign} />,
    quests: <QuestsTab campaign={campaign} setCampaign={setCampaign} />,
  };

  return (
    <div className="h-screen flex bg-dnd-dark text-white overflow-hidden">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />

      {/* Left Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700">
          <h1 className="text-lg font-bold text-dnd-gold flex items-center gap-2">
            <Scroll size={20} />
            Campaign Builder
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {campaign.campaignName || 'Untitled Campaign'}
          </p>
        </div>

        {/* Tab Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors
                  ${isActive
                    ? 'bg-dnd-red/20 text-dnd-gold border-r-2 border-dnd-gold'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                <Icon size={18} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Import/Export Section */}
        <div className="border-t border-gray-700 p-4 space-y-2">
          <button onClick={handleExport}
            className="w-full dnd-button text-sm flex items-center justify-center gap-2">
            <Download size={14} /> Export JSON
          </button>
          <button onClick={handleImport}
            className="w-full px-4 py-2 bg-gray-700 text-white font-bold rounded border-2 border-gray-500
              hover:bg-gray-600 transition-colors shadow-lg active:scale-95 text-sm flex items-center justify-center gap-2">
            <Upload size={14} /> Import JSON
          </button>
          <button onClick={handleLoadCurrent}
            className="w-full px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded border border-gray-600
              hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-center gap-2">
            <FolderOpen size={14} /> Load Current
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {tabContent[activeTab]}
        </div>
      </main>

      {/* JSON Preview Modal */}
      {showJsonPreview && (
        <JsonPreviewModal data={campaign} onClose={() => setShowJsonPreview(false)} />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-2xl font-bold text-sm
          flex items-center gap-2 animate-bounce-slow
          ${toast.type === 'error'
            ? 'bg-red-800 text-white border border-red-600'
            : 'bg-green-800 text-white border border-green-600'}`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
