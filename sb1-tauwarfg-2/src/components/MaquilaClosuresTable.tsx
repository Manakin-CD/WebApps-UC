import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { debounce } from 'lodash';

interface MaquilaClosure {
  id: string;
  maquila_id: string;
  tipo: string;
  cantidad: number;
  precio: number;
  total: number;
}

interface MaquilaClosuresTableProps {
  maquilaId: string;
}

export const MaquilaClosuresTable: React.FC<MaquilaClosuresTableProps> = ({ maquilaId }) => {
  const [closures, setClosures] = useState<MaquilaClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localChanges, setLocalChanges] = useState<{ [key: string]: Partial<MaquilaClosure> }>({});
  const [maquilaAdvanceAmount, setMaquilaAdvanceAmount] = useState(0);
  const savingRef = useRef<{ [key: string]: boolean }>({});
  const initialized = useRef(false);

  const fetchMaquilaData = async () => {
    try {
      const { data, error } = await supabase
        .from('maquilas')
        .select('advance_amount')
        .eq('id', maquilaId)
        .single();

      if (error) throw error;
      setMaquilaAdvanceAmount(data?.advance_amount || 0);
    } catch (err) {
      console.error('Error fetching maquila advance amount:', err);
    }
  };

  const initializeEmptyRows = async () => {
    if (initialized.current) return [];
    
    try {
      // First check if there are any existing rows
      const { data: existingData, error: checkError } = await supabase
        .from('maquila_closures')
        .select('id')
        .eq('maquila_id', maquilaId)
        .limit(1);

      if (checkError) throw checkError;

      // If rows already exist, don't initialize
      if (existingData && existingData.length > 0) {
        initialized.current = true;
        return [];
      }

      const emptyRows = Array(5).fill(null).map(() => ({
        maquila_id: maquilaId,
        tipo: '',
        cantidad: 0,
        precio: 0
      }));

      const { data: newRows, error: insertError } = await supabase
        .from('maquila_closures')
        .insert(emptyRows)
        .select();

      if (insertError) throw insertError;
      initialized.current = true;
      return newRows || [];
    } catch (err) {
      console.error('Error initializing empty rows:', err);
      return [];
    }
  };

  const fetchClosures = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to initialize if needed
      await initializeEmptyRows();

      const { data: existingClosures, error: fetchError } = await supabase
        .from('maquila_closures')
        .select('*')
        .eq('maquila_id', maquilaId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (existingClosures) {
        setClosures(existingClosures);
        initialized.current = true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los cierres';
      setError(errorMessage);
      console.error('Error fetching closures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialized.current = false;
    fetchMaquilaData();
    fetchClosures();

    const channel = supabase
      .channel(`maquila_closures_${maquilaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maquila_closures',
          filter: `maquila_id=eq.${maquilaId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedClosure = payload.new as MaquilaClosure;
            setClosures(prev =>
              prev.map(closure =>
                closure.id === updatedClosure.id ? { ...closure, ...updatedClosure } : closure
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setClosures(prev => prev.filter(closure => closure.id !== deletedId));
          } else if (payload.eventType === 'INSERT') {
            const newClosure = payload.new as MaquilaClosure;
            setClosures(prev => [...prev, newClosure]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [maquilaId]);

  const saveChanges = useCallback(
    debounce(async (id: string, changes: Partial<MaquilaClosure>) => {
      if (savingRef.current[id]) return;
      
      try {
        savingRef.current[id] = true;

        // First verify the row exists and belongs to this maquila
        const { data: existingRow, error: checkError } = await supabase
          .from('maquila_closures')
          .select('id')
          .eq('id', id)
          .eq('maquila_id', maquilaId)
          .single();

        if (checkError || !existingRow) {
          throw new Error('Row not found or unauthorized');
        }

        const { error: updateError } = await supabase
          .from('maquila_closures')
          .update(changes)
          .eq('id', id)
          .eq('maquila_id', maquilaId);

        if (updateError) throw updateError;

        setLocalChanges(prev => {
          const newChanges = { ...prev };
          delete newChanges[id];
          return newChanges;
        });
      } catch (error) {
        console.error('Error saving changes:', error);
      } finally {
        savingRef.current[id] = false;
      }
    }, 500),
    [maquilaId]
  );

  const handleAddRow = async () => {
    try {
      const newRow = {
        maquila_id: maquilaId,
        tipo: '',
        cantidad: 0,
        precio: 0
      };

      const { data, error } = await supabase
        .from('maquila_closures')
        .insert([newRow])
        .select();

      if (error) throw error;
      if (data) {
        setClosures(prev => [...prev, ...data]);
      }
    } catch (err) {
      console.error('Error adding row:', err);
      alert('Error al agregar una nueva fila');
    }
  };

  const handleDeleteRow = async (id: string) => {
    try {
      if (closures.length <= 5) {
        alert('No se puede eliminar la fila. Debe mantener al menos 5 filas.');
        return;
      }

      // First verify the row exists and belongs to this maquila
      const { data: existingRow, error: checkError } = await supabase
        .from('maquila_closures')
        .select('id')
        .eq('id', id)
        .eq('maquila_id', maquilaId)
        .single();

      if (checkError || !existingRow) {
        throw new Error('Row not found or unauthorized');
      }

      const { error: deleteError } = await supabase
        .from('maquila_closures')
        .delete()
        .eq('id', id)
        .eq('maquila_id', maquilaId);

      if (deleteError) throw deleteError;
      setClosures(prev => prev.filter(closure => closure.id !== id));
    } catch (err) {
      console.error('Error deleting row:', err);
      alert('Error al eliminar la fila');
    }
  };

  const handleInputChange = (
    id: string,
    field: keyof MaquilaClosure,
    value: string | number
  ) => {
    let updateValue = value;
    
    if (['cantidad', 'precio'].includes(field)) {
      updateValue = value === '' ? 0 : parseFloat(value.toString());
      if (isNaN(updateValue)) return;
    }

    setClosures(prev =>
      prev.map(closure =>
        closure.id === id
          ? {
              ...closure,
              [field]: updateValue,
              total: field === 'cantidad' || field === 'precio'
                ? (field === 'cantidad' ? updateValue : closure.cantidad) *
                  (field === 'precio' ? updateValue : closure.precio)
                : closure.total
            }
          : closure
      )
    );

    setLocalChanges(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: updateValue }
    }));

    saveChanges(id, { [field]: updateValue });
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-700 dark:text-gray-300">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        {error}
        <button
          onClick={fetchClosures}
          className="ml-4 text-blue-500 hover:text-blue-700 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const calculateTotals = () => {
    const subtotals = closures.reduce(
      (acc, curr) => ({
        cantidad: acc.cantidad + (curr.cantidad || 0),
        precio: acc.precio + (curr.precio || 0),
        total: acc.total + ((curr.cantidad || 0) * (curr.precio || 0))
      }),
      { cantidad: 0, precio: 0, total: 0 }
    );

    return {
      ...subtotals,
      totalFinal: subtotals.total - maquilaAdvanceAmount
    };
  };

  const totals = calculateTotals();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white dark:bg-gray-800 shadow-lg">
        <thead>
          <tr>
            <th className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold">Tipo</th>
            <th className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold">Cantidad</th>
            <th className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold">Precio</th>
            <th className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold">Total</th>
            <th className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {closures.map((closure) => (
            <tr key={closure.id} className={`${localChanges[closure.id] ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}>
              <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2">
                <input
                  type="text"
                  value={closure.tipo}
                  onChange={(e) => handleInputChange(closure.id, 'tipo', e.target.value)}
                  className="w-full p-2 border-2 border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Tipo de cierre"
                />
              </td>
              <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2">
                <input
                  type="number"
                  value={closure.cantidad || ''}
                  onChange={(e) => handleInputChange(closure.id, 'cantidad', e.target.value)}
                  className="w-full p-2 border-2 border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                  min="0"
                  placeholder="0"
                />
              </td>
              <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2">
                <input
                  type="number"
                  value={closure.precio || ''}
                  onChange={(e) => handleInputChange(closure.id, 'precio', e.target.value)}
                  className="w-full p-2 border-2 border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </td>
              <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                {((closure.cantidad || 0) * (closure.precio || 0)).toFixed(2)}
              </td>
              <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2">
                <button
                  onClick={() => handleDeleteRow(closure.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  title="Eliminar fila"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
          <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
            <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-800 dark:text-gray-200">Totales</td>
            <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-800 dark:text-gray-200">{totals.cantidad}</td>
            <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-800 dark:text-gray-200">-</td>
            <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-gray-800 dark:text-gray-200">{totals.total.toFixed(2)}</td>
            <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3"></td>
          </tr>
          {maquilaAdvanceAmount > 0 && (
            <>
              <tr className="bg-yellow-50 dark:bg-yellow-900/20">
                <td colSpan={3} className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-medium text-gray-800 dark:text-gray-200">
                  Monto de adelanto de la maquila:
                </td>
                <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-red-600 dark:text-red-400 font-bold">
                  -{maquilaAdvanceAmount.toFixed(2)}
                </td>
                <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3"></td>
              </tr>
              <tr className="bg-blue-50 dark:bg-blue-900/20">
                <td colSpan={3} className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-bold text-gray-800 dark:text-gray-200">
                  Total Final:
                </td>
                <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-bold text-gray-800 dark:text-gray-200">
                  {totals.totalFinal.toFixed(2)}
                </td>
                <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3"></td>
              </tr>
            </>
          )}
        </tbody>
      </table>
      <div className="mt-4">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          <Plus size={18} />
          Agregar fila
        </button>
      </div>
    </div>
  );
};