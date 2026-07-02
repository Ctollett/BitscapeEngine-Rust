import {useRef, useState, useEffect} from 'react'
import type { Option } from '../../../fm-canvas/types';
import './Dropdown.css'

interface DropdownProps {
    placeholder?: String, 
    options: Option[],
    onChange?: (option: Option) => void

}


export default function Dropdown({placeholder, options, onChange}: DropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState<Option | null>(null)

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if(dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setIsOpen(false)
        }
        document.addEventListener("mousedown", handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)

    }, [])

    const handleSelect = (option: Option) => {
        setSelected(option)
        setIsOpen(false)
        if(onChange) onChange(option)
    }


    return (
        <div className="dropdown" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)}>
                {selected ? selected.label : placeholder}
            </button>
            {isOpen && (
                <ul className='dropdown-list'>
                    
                   {options.map((option) => (
                    <li id="dropdown-list-item" onClick={() => handleSelect(option)} key={option.value}>{option.label}</li>
                   ))}
                </ul>
            )}

            

        </div>
    )
}