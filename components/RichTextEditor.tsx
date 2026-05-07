import React, { useEffect, useRef } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react';
import { sanitizeRichText } from '../utils/richText';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const toolbarButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700';

export const RichTextEditor = ({ label, value, onChange, required }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;

    const cleanValue = sanitizeRichText(value);
    if (editor.innerHTML !== cleanValue) {
      editor.innerHTML = cleanValue;
    }
  }, [value]);

  const syncValue = () => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(sanitizeRichText(editor.innerHTML));
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <div className="text-xs font-medium text-slate-500">Le format copié est conservé au collage.</div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700"
            onChange={(event) => {
              if (!event.target.value) return;
              runCommand('formatBlock', event.target.value);
              event.target.value = '';
            }}
            defaultValue=""
            title="Style de paragraphe"
          >
            <option value="">Style</option>
            <option value="p">Paragraphe</option>
            <option value="h2">Titre</option>
            <option value="h3">Sous-titre</option>
            <option value="blockquote">Citation</option>
          </select>

          <button type="button" className={toolbarButtonClass} onClick={() => runCommand('bold')} title="Gras">
            <Bold size={16} />
          </button>
          <button type="button" className={toolbarButtonClass} onClick={() => runCommand('italic')} title="Italique">
            <Italic size={16} />
          </button>
          <button type="button" className={toolbarButtonClass} onClick={() => runCommand('underline')} title="Souligner">
            <Underline size={16} />
          </button>
          <button type="button" className={toolbarButtonClass} onClick={() => runCommand('insertUnorderedList')} title="Liste">
            <List size={16} />
          </button>
          <button type="button" className={toolbarButtonClass} onClick={() => runCommand('insertOrderedList')} title="Liste numérotée">
            <ListOrdered size={16} />
          </button>
          <button type="button" className={toolbarButtonClass} onClick={() => runCommand('justifyLeft')} title="Aligner à gauche">
            <AlignLeft size={16} />
          </button>
          <button type="button" className={toolbarButtonClass} onClick={() => runCommand('justifyCenter')} title="Centrer">
            <AlignCenter size={16} />
          </button>
          <button type="button" className={toolbarButtonClass} onClick={() => runCommand('justifyRight')} title="Aligner à droite">
            <AlignRight size={16} />
          </button>

          <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600" title="Couleur du texte">
            Texte
            <input type="color" className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0" onChange={(event) => runCommand('foreColor', event.target.value)} />
          </label>
          <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600" title="Surlignage">
            Fond
            <input type="color" className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0" onChange={(event) => runCommand('backColor', event.target.value)} />
          </label>

          <button type="button" className={toolbarButtonClass} onClick={() => runCommand('removeFormat')} title="Nettoyer le format">
            <Eraser size={16} />
          </button>
          <button type="button" className={toolbarButtonClass} onClick={() => runCommand('undo')} title="Annuler">
            <Undo2 size={16} />
          </button>
          <button type="button" className={toolbarButtonClass} onClick={() => runCommand('redo')} title="Rétablir">
            <Redo2 size={16} />
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-label={label}
          aria-required={required}
          onInput={syncValue}
          onBlur={syncValue}
          className="rich-text-editor min-h-48 w-full bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none"
          suppressContentEditableWarning
        />
      </div>

      {required && !value.trim() && <div className="text-xs font-medium text-red-600">Description obligatoire.</div>}
    </div>
  );
};
