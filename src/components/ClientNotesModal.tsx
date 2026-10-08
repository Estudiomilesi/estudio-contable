"use client";
import { useState, useEffect } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';

export default function ClientNotesModal({ client, onClose }: { client: any, onClose: () => void }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [client.id]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clientes/${client.id}/notes`);
      if (res.ok) {
        setNotes(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const res = await fetch(`/api/clientes/${client.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() })
      });
      if (res.ok) {
        setNewNote('');
        fetchNotes();
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar la nota');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Seguimiento: {client.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {isLoading ? (
            <p className="text-center text-gray-500">Cargando notas...</p>
          ) : notes.length === 0 ? (
            <p className="text-center text-gray-500 italic">No hay notas de seguimiento registradas.</p>
          ) : (
            notes.map(note => (
              <div key={note.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-800 text-sm whitespace-pre-wrap">{note.content}</p>
                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                  <span className="font-medium text-indigo-700">{note.createdBy.split('@')[0]}</span>
                  <span>{new Date(note.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-white">
          <form onSubmit={handleAddNote} className="flex gap-2">
            <textarea
              className="flex-1 rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-12"
              placeholder="Ej: Reclamé por Whatsapp y dijo que paga el viernes..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
            />
            <button
              type="submit"
              disabled={!newNote.trim()}
              className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
