import React, { useState } from 'react';
import { X, Plus, Trash2, FileDown } from 'lucide-react';
import type { Maquila } from '../types';
import { generateDispatchSheet } from '../utils/dispatchSheetGenerator';

interface DispatchRow {
  id: string;
  cantidad: string;
  descripcion: string;
  cliente: string;
}

interface DispatchSheetModalProps {
  maquila: Maquila;
  onClose: () => void;
}

export const DispatchSheetModal: React.FC<DispatchSheetModalProps> = ({
  maquila,
  onClose
}) => {
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [rows, setRows] = useState<DispatchRow[]>(() => 
    Array(5).fill(null).map(() => ({
      id: crypto.randomUUID(),
      cantidad: '',
      descripcion: '',
      cliente: ''
    }))
  );
  const [generating, setGenerating] = useState(false);

  const handleAddRow = () => {
    setRows(prev => [...prev, {
      id: crypto.randomUUID(),
      cantidad: '',
      descripcion: '',
      cliente: ''
    }]);
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 5) {
      alert('Debe mantener al menos 5 filas');
      return;
    }
    setRows(prev => prev.filter(row => row.id !== id));
  };

  const handleRowChange = (
    id: string,
    field: keyof Omit<DispatchRow, 'id'>,
    value: string
  ) => {
    setRows(prev =>
      prev.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const handleGenerate = async () => {
    if (!fechaEntrega) {
      alert('Por favor, seleccione una fecha de entrega');
      return;
    }

    try {
      setGenerating(true);
      await generateDispatchSheet(maquila, {
        fechaEntrega,
        comentarios,
        rows: rows.map(({ cantidad, descripcion, cliente }) => ({
          cantidad,
          descripcion,
          cliente
        }))
      });
      onClose();
    } catch (error) {
      console.error('Error generating dispatch sheet:', error);
      alert('Error al generar la hoja de despacho');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Hoja de Despacho - {maquila.name}
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Entrega
            </label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comentarios
            </label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={4}
              maxLength={1000}
              placeholder="Ingrese comentarios adicionales..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Detalle de Despacho
              </h3>
              <button
                onClick={handleAddRow}
                className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                <Plus size={16} />
                Agregar línea
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-left">Cantidad</th>
                    <th className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-left">Descripción</th>
                    <th className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-left">Cliente</th>
                    <th className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2">
                        <input
                          type="text"
                          value={row.cantidad}
                          onChange={(e) => handleRowChange(row.id, 'cantidad', e.target.value)}
                          className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2">
                        <input
                          type="text"
                          value={row.descripcion}
                          onChange={(e) => handleRowChange(row.id, 'descripcion', e.target.value)}
                          className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2">
                        <input
                          type="text"
                          value={row.cliente}
                          onChange={(e) => handleRowChange(row.id, 'cliente', e.target.value)}
                          className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar fila"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 disabled:opacity-50"
            >
              <FileDown size={18} />
              {generating ? 'Generando...' : 'Generar PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};