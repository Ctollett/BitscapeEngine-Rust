import './PresetSaveModal.css';
import ModalDot from '../../assets/svgs/modal-dot.svg?react';
import Dropdown from '../UI/Dropdown/Dropdown';
import type { Option } from '../../fm-canvas/types';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { colors } from '../../tokens';
import { usePatch } from '../../fm-canvas/patch-context'
import { saveToLibrary } from '../../fm-canvas/patch-storage';

interface PopUpModalProps {
  onClose: () => void
}

interface RenameModalProps {
  initialName: string
  onClose: () => void
  onRename: (name: string) => void
}

export function RenameModal({ initialName, onClose, onRename }: RenameModalProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState(false)

  const handleSave = () => {
    if (!name.trim()) { setError(true); return }
    onRename(name.trim())
  }

  return createPortal(
    <div className="modal">
      <div className="modal-content">
        <div className='modal-dots-top'><span><ModalDot /></span><span><ModalDot /></span></div>
        <div className='modal-form-section'>
          <div className='modal-title'><span>RENAME PRESET</span></div>
          <div className='modal-input'>
            <input autoFocus placeholder="Enter Preset Name" type='text' value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
            {error && <p>Please enter a preset name</p>}
          </div>
          <div className='modal-button-section'>
            <button onClick={onClose} style={{ color: colors.text.secondary, cursor: 'pointer' }}>CANCEL</button>
            <button onClick={handleSave} style={{ color: colors.text.secondary, cursor: 'pointer' }}>RENAME</button>
          </div>
        </div>
        <div className='modal-dots-bottom'><span><ModalDot /></span><span><ModalDot /></span></div>
      </div>
    </div>
  , document.body)
}


export function PopUpModal({ onClose } : PopUpModalProps) {

const { patch } = usePatch()
const [presetName, setPresetName] = useState('')
const [nameError, setNameError] = useState(false)
const [categoryError, setCategoryError] = useState(false)
const [category, setSelectedCategory] = useState<Option | null>(null)

const handleSave = () => {
  console.log('presetName:', presetName, 'category:', category)
  setCategoryError(false)
  setNameError(false)
  if (!presetName) {
    setNameError(true) 
    return
  } else if(!category) {
    setCategoryError(true)
    return
  }
  saveToLibrary(presetName, patch, category.value)
  onClose()
}

const categories: Option[] = [
  { value: 'bass', label: 'Bass' },
  { value: 'lead', label: 'Lead' },
  { value: 'pad', label: 'Pad' },
  { value: 'keys', label: 'Keys' },
  { value: 'pluck', label: 'Pluck' },
  { value: 'bell', label: 'Bell' },
  { value: 'brass', label: 'Brass' },
  { value: 'strings', label: 'Strings' },
  { value: 'arp', label: 'Arp' },
  { value: 'sequence', label: 'Sequence' },
  { value: 'fx', label: 'FX' },
  { value: 'drum', label: 'Drum' },
  { value: 'other', label: 'Other' },
];

const handleSelect = (option:Option) => {
setSelectedCategory(option)
}



  return createPortal(
    <div className="modal">
      <div className="modal-content">
        <div className='modal-dots-top'>
          <span><ModalDot /></span>
          <span><ModalDot /></span>
        </div>
        <div className='modal-form-section'>
          <div className='modal-title'>
            <span>SAVE NEW PRESET</span>
          </div>
          <div className='modal-input'>
            <input placeholder="Enter Preset Name" type='text' value={presetName} onChange={(e) => setPresetName(e.target.value)} />
            {nameError && (
              <p>Please enter a preset name</p>
            )}
            <Dropdown onChange={handleSelect} options={categories} placeholder="Select Category" />
                {categoryError && (
              <p>Please select a category</p>
            )}
          </div>
          <div className='modal-button-section'>
            <button onClick={onClose} style={{color: colors.text.secondary, cursor: 'pointer'}}>CANCEL</button>
            <button onClick={handleSave} style={{color: colors.text.secondary, cursor: 'pointer'}}>SAVE</button>
          </div>
        </div>
        <div className='modal-dots-bottom'>
          <span><ModalDot /></span>
          <span><ModalDot /></span>
        </div>
      </div>
    </div>
  , document.body);
}
