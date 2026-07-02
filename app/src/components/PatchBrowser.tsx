import { useState, useRef } from 'react';
import { usePatch } from '../fm-canvas/patch-context';
import { createInitialPatch } from '../fm-canvas/constants';
import {
    loadLibrary,
    saveToLibrary,
    deleteFromLibrary,
    renameInLibrary,
    exportPatchFile,
    importPatchFile,
    type SavedPatch,
} from '../fm-canvas/patch-storage';

export function PatchBrowser() {
    const { patch, dispatch } = usePatch();
    const [library, setLibrary] = useState<SavedPatch[]>(() => loadLibrary());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        const name = window.prompt('Patch name:');
        if (!name) return;
        saveToLibrary(name, patch, '');
        setLibrary(loadLibrary());
    };

    const handleLoad = (entry: SavedPatch) => {
        dispatch({ type: 'LOAD_PATCH', patch: entry.patch });
    };

    const handleDelete = (id: string) => {
        deleteFromLibrary(id);
        setLibrary(loadLibrary());
    };

    const handleRename = (id: string, currentName: string) => {
        const name = window.prompt('Rename patch:', currentName);
        if (!name || name === currentName) return;
        renameInLibrary(id, name);
        setLibrary(loadLibrary());
    };

    const handleReset = () => {
        dispatch({ type: 'LOAD_PATCH', patch: createInitialPatch() });
    };

    const handleExport = (entry: SavedPatch) => {
        exportPatchFile(entry.patch, entry.name);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        importPatchFile(file).then(imported => {
            dispatch({ type: 'LOAD_PATCH', patch: imported });
            const name = file.name.replace(/\.json$/i, '');
            saveToLibrary(name, imported, '');
            setLibrary(loadLibrary());
        }).catch(() => {
            alert('Failed to import patch — invalid file.');
        });
        // Reset input so the same file can be re-imported
        e.target.value = '';
    };

    return (
        <div>
            <button onClick={handleReset}>Init Patch</button>
            <button onClick={handleSave}>Save Patch</button>
            <button onClick={handleImportClick}>Import</button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            {library.map((entry) => (
                <div key={entry.id}>
                    <span>{entry.name}</span>
                    <button onClick={() => handleLoad(entry)}>Load</button>
                    <button onClick={() => handleRename(entry.id, entry.name)}>Rename</button>
                    <button onClick={() => handleExport(entry)}>Export</button>
                    <button onClick={() => handleDelete(entry.id)}>Delete</button>
                </div>
            ))}
        </div>
    );
}
