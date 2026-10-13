'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Copy, FileSpreadsheet } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import clsx from 'clsx';

export default function CredentialsSpreadsheet() {
  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCells, setVisibleCells] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await fetch('/api/credentials');
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setColumns(data.columns);
      setRows(data.rows);
    } catch (err) {
      toast.error('Failed to load credentials. You might not have Admin access.');
    } finally {
      setIsLoading(false);
    }
  };

  const addColumn = async () => {
    const name = prompt('Enter new column name (e.g. Website, Password):');
    if (!name) return;
    
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_COLUMN', payload: { name } })
      });
      const newCol = await res.json();
      setColumns([...columns, newCol]);
      toast.success(`Column "${name}" added`);
    } catch (e) {
      toast.error('Failed to add column');
    }
  };

  const addRow = async () => {
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_ROW', payload: {} })
      });
      const newRow = await res.json();
      setRows([...rows, newRow]);
      toast.success('Row added');
    } catch (e) {
      toast.error('Failed to add row');
    }
  };

  const updateCell = async (rowId: string, columnId: string, value: string) => {
    try {
      await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_CELL', payload: { rowId, columnId, value } })
      });
      toast.success('Saved', { position: 'bottom-right', duration: 1000 });
    } catch (e) {
      toast.error('Failed to save cell');
    }
  };

  const deleteRow = async (rowId: string) => {
    if (!confirm('Are you sure you want to delete this row?')) return;
    try {
      await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_ROW', payload: { rowId } })
      });
      setRows(rows.filter(r => r.id !== rowId));
      toast.success('Row deleted');
    } catch (e) {
      toast.error('Failed to delete row');
    }
  };

  const toggleVisibility = (cellId: string) => {
    setVisibleCells(prev => ({ ...prev, [cellId]: !prev[cellId] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-[70vh]">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      <Toaster />
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-blue-500" />
            Secure Credentials
          </h1>
          <p className="text-slate-400">Manage encrypted secrets. AES-256-GCM protected.</p>
        </div>
        <div className="space-x-4">
          <button onClick={addColumn} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition shadow">
            + Add Column
          </button>
          <button onClick={addRow} disabled={columns.length === 0} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow disabled:opacity-50">
            + Add Row
          </button>
        </div>
      </div>

      {columns.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
          <Key className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Columns Configured</h3>
          <p className="text-slate-400 mb-6">Create your first column to start building your secure spreadsheet.</p>
          <button onClick={addColumn} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            + Add First Column
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-800/50 text-slate-300 text-sm border-b border-slate-700">
                  <th className="p-4 font-medium w-16 text-center">#</th>
                  {columns.map(col => (
                    <th key={col.id} className="p-4 font-medium border-l border-slate-700/50 min-w-[200px] group relative">
                      {col.name}
                    </th>
                  ))}
                  <th className="p-4 font-medium min-w-[120px] text-center border-l border-slate-700/50">
                    <button onClick={addColumn} className="text-slate-400 hover:text-blue-400 flex items-center justify-center gap-1 mx-auto transition">
                      <Plus className="w-4 h-4" /> Column
                    </button>
                  </th>
                  <th className="p-4 font-medium w-24 text-center border-l border-slate-700/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition">
                    <td className="p-4 text-slate-500 text-center">{index + 1}</td>
                    
                    {columns.map(col => {
                      const cell = row.cells.find((c: any) => c.columnId === col.id);
                      const value = cell ? cell.value : '';
                      const isSecret = ['password', 'pass', 'secret', 'token', 'pin'].some(s => col.name.toLowerCase().includes(s));
                      const cellId = `${row.id}-${col.id}`;
                      const isVisible = !isSecret || visibleCells[cellId];

                      return (
                        <td key={col.id} className="p-2 border-l border-slate-800/50">
                          <div className="relative flex items-center group">
                            <input
                              type={isVisible ? 'text' : 'password'}
                              defaultValue={value}
                              placeholder="..."
                              onBlur={(e) => {
                                if (e.target.value !== value) {
                                  updateCell(row.id, col.id, e.target.value);
                                }
                              }}
                              className="w-full bg-transparent text-slate-200 px-3 py-2 outline-none focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 rounded transition"
                            />
                            {isSecret && value && (
                              <button onClick={() => toggleVisibility(cellId)} className="absolute right-10 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition">
                                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            )}
                            {value && (
                              <button onClick={() => copyToClipboard(value)} className="absolute right-2 text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition">
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    
                    <td className="p-4 text-center border-l border-slate-800/50">
                      <button onClick={() => deleteRow(row.id)} className="text-slate-500 hover:text-red-500 transition p-2 rounded hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {/* Inline Add Row Button at the bottom of the table */}
                <tr className="border-b border-slate-800/50 bg-slate-800/10 hover:bg-slate-800/30 transition">
                  <td colSpan={columns.length + 2} className="p-0">
                    <button onClick={addRow} className="w-full p-4 text-left text-slate-400 hover:text-blue-400 flex items-center gap-2 transition outline-none focus:bg-slate-800/50">
                      <Plus className="w-4 h-4" /> Add Row Below
                    </button>
                  </td>
                  <td className="border-l border-slate-800/50"></td>
                </tr>
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No rows yet. Click "+ Add Row" to begin.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Temporary icon fix since Key is used but not imported
function Key(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/>
      <path d="m21 2-9.6 9.6"/>
      <circle cx="7.5" cy="15.5" r="5.5"/>
    </svg>
  );
}
