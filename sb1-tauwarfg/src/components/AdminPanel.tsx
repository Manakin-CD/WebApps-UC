{/* Full corrected file content will be provided here, fixing the e.target.target.value typo to e.target.value */}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, MessageCircle, FileDown, CheckSquare } from 'lucide-react';
import type { Maquila } from '../types';
import { getStatusColor } from '../types';
import { supabase } from '../lib/supabase';
import { MaquilaClosuresTable } from './MaquilaClosuresTable';
import { generateMaquilaClosurePDF, generateGlobalClosurePDF } from '../utils/pdfGenerator';
import { debounce } from 'lodash';

interface AdminPanelProps {
  maquilas: Maquila[];
  onUpdateMaquila: (maquila: Maquila) => void;
  onAddMaquila: (maquila: Omit<Maquila, 'id'>) => void;
  onDeleteMaquila: (id: string) => void;
}

interface EditingValues {
  assignedPieces: { [key: string]: number };
  advanceAmount: { [key: string]: number };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  maquilas,
  onUpdateMaquila,
  onAddMaquila,
  onDeleteMaquila,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMaquilaId, setSelectedMaquilaId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingValues, setEditingValues] = useState<EditingValues>({
    assignedPieces: {},
    advanceAmount: {},
  });
  const [showClosures, setShowClosures] = useState<{ [key: string]: boolean }>({});
  const [newMaquila, setNewMaquila] = useState({
    name: '',
    capacity: 0,
    assignedPieces: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    paymentDate: null as string | null,
    advanceAmount: 0,
    status: 'available' as const,
    comments: null as string | null,
  });
  const [generatingPDF, setGeneratingPDF] = useState<{ [key: string]: boolean }>({});
  const [isGlobalClosureMode, setIsGlobalClosureMode] = useState(false);
  const [selectedMaquilas, setSelectedMaquilas] = useState<Set<string>>(new Set());
  const [generatingGlobalPDF, setGeneratingGlobalPDF] = useState(false);

  useEffect(() => {
    const initialValues: EditingValues = {
      assignedPieces: {},
      advanceAmount: {},
    };
    
    maquilas.forEach(maquila => {
      initialValues.assignedPieces[maquila.id] = maquila.assignedPieces;
      initialValues.advanceAmount[maquila.id] = maquila.advanceAmount;
    });
    
    setEditingValues(initialValues);
  }, [maquilas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMaquila({
      ...newMaquila,
      endDate: newMaquila.endDate || null,
    });
    setIsAdding(false);
    setNewMaquila({
      name: '',
      capacity: 0,
      assignedPieces: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      paymentDate: null,
      advanceAmount: 0,
      status: 'available',
      comments: null,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar esta maquila?')) {
      onDeleteMaquila(id);
      if (selectedMaquilaId === id) {
        setSelectedMaquilaId(null);
      }
    }
  };

  const handleAddComment = async (maquila: Maquila) => {
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const currentComments = maquila.comments ? JSON.parse(maquila.comments) : [];
      const newCommentObj = {
        id: crypto.randomUUID(),
        content: newComment.trim(),
        created_at: new Date().toISOString()
      };
      
      const updatedComments = JSON.stringify([newCommentObj, ...currentComments]);

      const { error } = await supabase
        .from('maquilas')
        .update({ comments: updatedComments })
        .eq('id', maquila.id);

      if (error) throw error;
      
      onUpdateMaquila({
        ...maquila,
        comments: updatedComments
      });
      
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error al agregar el comentario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (maquila: Maquila, commentId: string) => {
    if (!window.confirm('¿Está seguro que desea eliminar este comentario?')) return;

    try {
      setLoading(true);
      const currentComments = JSON.parse(maquila.comments || '[]');
      const updatedComments = currentComments.filter((comment: any) => comment.id !== commentId);
      
      const { error } = await supabase
        .from('maquilas')
        .update({ comments: JSON.stringify(updatedComments) })
        .eq('id', maquila.id);

      if (error) throw error;
      
      onUpdateMaquila({
        ...maquila,
        comments: JSON.stringify(updatedComments)
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error al eliminar el comentario');
    } finally {
      setLoading(false);
    }
  };

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value));
    setNewMaquila({ ...newMaquila, capacity: value });
  };

  const handleAssignedPiecesChange = (maquila: Maquila, value: string) => {
    const parsedValue = value === '' ? 0 : Math.min(maquila.capacity, Math.max(0, parseInt(value) || 0));
    setEditingValues(prev => ({
      ...prev,
      assignedPieces: {
        ...prev.assignedPieces,
        [maquila.id]: parsedValue
      }
    }));
  };

  const handleAssignedPiecesBlur = async (maquila: Maquila) => {
    const newValue = editingValues.assignedPieces[maquila.id];
    if (newValue === maquila.assignedPieces) return;

    try {
      const { error } = await supabase
        .from('maquilas')
        .update({ assigned_pieces: newValue })
        .eq('id', maquila.id);

      if (error) throw error;
      
      onUpdateMaquila({
        ...maquila,
        assignedPieces: newValue
      });
    } catch (error) {
      console.error('Error updating assigned pieces:', error);
      setEditingValues(prev => ({
        ...prev,
        assignedPieces: {
          ...prev.assignedPieces,
          [maquila.id]: maquila.assignedPieces
        }
      }));
      alert('Error al actualizar las piezas asignadas');
    }
  };

  const handleAdvanceAmountChange = (maquila: Maquila, value: string) => {
    const parsedValue = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
    setEditingValues(prev => ({
      ...prev,
      advanceAmount: {
        ...prev.advanceAmount,
        [maquila.id]: parsedValue
      }
    }));
  };

  const handleAdvanceAmountBlur = async (maquila: Maquila) => {
    const newValue = editingValues.advanceAmount[maquila.id];
    if (newValue === maquila.advanceAmount) return;

    try {
      const { error } = await supabase
        .from('maquilas')
        .update({ advance_amount: newValue })
        .eq('id', maquila.id);

      if (error) throw error;
      
      onUpdateMaquila({
        ...maquila,
        advanceAmount: newValue
      });
    } catch (error) {
      console.error('Error updating advance amount:', error);
      setEditingValues(prev => ({
        ...prev,
        advanceAmount: {
          ...prev.advanceAmount,
          [maquila.id]: maquila.advanceAmount
        }
      }));
      alert('Error al actualizar el monto de adelanto');
    }
  };

  const handleEndDateChange = async (maquila: Maquila, value: string) => {
    try {
      const { error } = await supabase
        .from('maquilas')
        .update({ end_date: value || null })
        .eq('id', maquila.id);

      if (error) throw error;
      
      onUpdateMaquila({
        ...maquila,
        endDate: value || null
      });
    } catch (error) {
      console.error('Error updating end date:', error);
      alert('Error al actualizar la fecha de entrega');
    }
  };

  const handleStartDateChange = async (maquila: Maquila, value: string) => {
    try {
      const { error } = await supabase
        .from('maquilas')
        .update({ start_date: value })
        .eq('id', maquila.id);

      if (error) throw error;
      
      onUpdateMaquila({
        ...maquila,
        startDate: value
      });
    } catch (error) {
      console.error('Error updating dispatch date:', error);
      alert('Error al actualizar la fecha de despacho');
    }
  };

  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return 'No establecida';
    
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      
      if (isNaN(date.getTime())) {
        return 'Fecha no disponible';
      }

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const formatCommentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha no disponible';
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const getComments = (maquila: Maquila) => {
    try {
      if (!maquila.comments) return [];
      const comments = JSON.parse(maquila.comments);
      return Array.isArray(comments) ? comments : [];
    } catch {
      return [];
    }
  };

  const hasComments = (maquila: Maquila) => {
    return getComments(maquila).length > 0;
  };

  const getStatusLabel = (status: Maquila['status']): string => {
    const labels = {
      'available': 'Disponible',
      'in-progress': 'En Proceso',
      'near-deadline': 'Tiene pendientes',
      'ready': 'Listo',
      'overdue': 'Atrasado'
    };
    return labels[status];
  };

  const toggleClosures = (maquilaId: string) => {
    setShowClosures(prev => ({
      ...prev,
      [maquilaId]: !prev[maquilaId]
    }));
  };

  const handleExecuteClosure = async (maquila: Maquila) => {
    if (!window.confirm(`¿Está seguro que desea ejecutar el cierre de la maquila "${maquila.name}"?`)) {
      return;
    }

    try {
      setGeneratingPDF(prev => ({ ...prev, [maquila.id]: true }));
      
      // Obtener los datos de cierre de la maquila
      const { data: closureData, error: closureError } = await supabase
        .from('maquila_closures')
        .select('*')
        .eq('maquila_id', maquila.id)
        .order('created_at', { ascending: true });

      if (closureError) throw closureError;

      // Generar y descargar el PDF
      await generateMaquilaClosurePDF(maquila, closureData || [], maquila.advanceAmount);
      
    } catch (error) {
      console.error('Error executing maquila closure:', error);
      alert('Error al ejecutar el cierre de maquila. Por favor, intente de nuevo.');
    } finally {
      setGeneratingPDF(prev => ({ ...prev, [maquila.id]: false }));
    }
  };

  const toggleMaquilaSelection = (maquilaId: string) => {
    setSelectedMaquilas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(maquilaId)) {
        newSet.delete(maquilaId);
      } else {
        newSet.add(maquilaId);
      }
      return newSet;
    });
  };

  const handleExecuteGlobalClosure = async () => {
    if (selectedMaquilas.size === 0) {
      alert('Por favor, seleccione al menos una maquila para el cierre global.');
      return;
    }

    if (!window.confirm('¿Está seguro que desea ejecutar el cierre global de las maquilas seleccionadas?')) {
      return;
    }

    try {
      setGeneratingGlobalPDF(true);
      
      const maquilasData = await Promise.all(
        Array.from(selectedMaquilas).map(async (maquilaId) => {
          const maquila = maquilas.find(m => m.id === maquilaId);
          if (!maquila) throw new Error(`Maquila ${maquilaId} no encontrada`);

          const { data: closureData, error: closureError } = await supabase
            .from('maquila_closures')
            .select('*')
            .eq('maquila_id', maquilaId)
            .order('created_at', { ascending: true });

          if (closureError) throw closureError;

          const total = (closureData || []).reduce((acc, curr) => 
            acc + (curr.cantidad * curr.precio), 0
          ) - maquila.advanceAmount;

          return { maquila, total };
        })
      );

      await generateGlobalClosurePDF(maquilasData);
      
      setIsGlobalClosureMode(false);
      setSelectedMaquilas(new Set());
    } catch (error) {
      console.error('Error executing global closure:', error);
      alert('Error al ejecutar el cierre global. Por favor, intente de nuevo.');
    } finally {
      setGeneratingGlobalPDF(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administración</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isAdding ? 'Cancelar' : 'Agregar Maquila'}
          </button>
          <button
            onClick={() => {
              setIsGlobalClosureMode(!isGlobalClosureMode);
              if (!isGlobalClosureMode) {
                setSelectedMaquilas(new Set());
              }
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            {isGlobalClosureMode ? 'Cancelar Cierre Global' : 'Cierre Global'}
          </button>
        </div>
      </div>

      {isGlobalClosureMode && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-blue-700 dark:text-blue-300">
              Seleccione las maquilas para el cierre global
            </p>
            <button
              onClick={handleExecuteGlobalClosure}
              disabled={selectedMaquilas.size === 0 || generatingGlobalPDF}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckSquare size={18} />
              {generatingGlobalPDF ? 'Generando PDF...' : 'Ejecutar Cierre Global'}
            </button>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre</label>
            <input
              type="text"
              value={newMaquila.name}
              onChange={(e) => setNewMaquila({ ...newMaquila, name: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Capacidad</label>
            <input
              type="number"
              value={newMaquila.capacity || ''}
              onChange={handleCapacityChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Monto de Adelanto</label>
            <input
              type="number"
              step="0.01"
              value={newMaquila.advanceAmount || ''}
              onChange={(e) => setNewMaquila({ ...newMaquila, advanceAmount: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Fecha de Despacho</label>
            <input
              type="date"
              value={newMaquila.startDate}
              onChange={(e) => setNewMaquila({ ...newMaquila, startDate: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Fecha de Entrega</label>
            <input
              type="date"
              value={newMaquila.endDate}
              onChange={(e) => setNewMaquila({ ...newMaquila, endDate: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Fecha de Pago</label>
            <input
              type="date"
              value={newMaquila.paymentDate || ''}
              onChange={(e) => setNewMaquila({ ...newMaquila, paymentDate: e.target.value || null })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Guardar
          </button>
        </form>
      )}

      <div className="space-y-4">
        {maquilas.map((maquila) => (
          <div
            key={maquila.id}
            className="border p-4 rounded-lg dark:border-gray-700"
          >
            <div className="mb-4">
              {isGlobalClosureMode && (
                <label className="inline-flex items-center mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMaquilas.has(maquila.id)}
                    onChange={() => toggleMaquilaSelection(maquila.id)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Seleccionar para cierre global</span>
                </label>
              )}
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{maquila.name}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">Capacidad: {maquila.capacity}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Fecha de despacho: {formatDateForDisplay(maquila.startDate)}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Fecha de entrega: {formatDateForDisplay(maquila.endDate)}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Fecha de pago: {formatDateForDisplay(maquila.paymentDate)}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Estado</label>
                <select
                  value={maquila.status}
                  onChange={(e) =>
                    onUpdateMaquila({
                      ...maquila,
                      status: e.target.value as Maquila['status'],
                    })
                  }
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="available">Disponible</option>
                  <option value="in-progress">En Proceso</option>
                  <option value="near-deadline">Tiene pendientes</option>
                  <option value="ready">Listo</option>
                  <option value="overdue">Atrasado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Piezas Asignadas</label>
                <input
                  type="number"
                  value={editingValues.assignedPieces[maquila.id] || ''}
                  onChange={(e) => handleAssignedPiecesChange(maquila, e.target.value)}
                  onBlur={() => handleAssignedPiecesBlur(maquila)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  max={maquila.capacity}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Monto de Adelanto</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingValues.advanceAmount[maquila.id] || ''}
                  onChange={(e) => handleAdvanceAmountChange(maquila, e.target.value)}
                  onBlur={() => handleAdvanceAmountBlur(maquila)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha de Despacho</label>
                <input
                  type="date"
                  value={maquila.startDate || ''}
                  onChange={(e) => handleStartDateChange(maquila, e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha de Entrega</label>
                <input
                  type="date"
                  value={maquila.endDate || ''}
                  onChange={(e) => handleEndDateChange(maquila, e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha de Pago</label>
                <input
                  type="date"
                  value={maquila.paymentDate || ''}
                  onChange={(e) => onUpdateMaquila({ ...maquila, paymentDate: e.target.value || null })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="lg:col-span-6 flex flex-wrap justify-between items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedMaquilaId(selectedMaquilaId === maquila.id ? null : maquila.id)}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                  >
                    <MessageCircle 
                      size={18} className={hasComments(maquila) ? "text-green-500" : ""}
                    />
                    {selectedMaquilaId === maquila.id ? 'Ocultar comentarios' : 'Ver comentarios'}
                  </button>
                  <button
                    onClick={() => toggleClosures(maquila.id)}
                    className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-800 dark:text-blue-300"
                  >
                    {showClosures[maquila.id] ? 'Ocultar tabla de cierre' : 'Ver tabla de cierre'}
                  </button>
                  <button
                    onClick={() => handleExecuteClosure(maquila)}
                    disabled={generatingPDF[maquila.id]}
                    className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded hover:bg-green-200 dark:hover:bg-green-800/50 text-green-800 dark:text-green-300 disabled:opacity-50"
                  >
                    <FileDown size={18} />
                    {generatingPDF[maquila.id] ? 'Generando PDF...' : 'Ejecutar cierre de maquila'}
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(maquila.id)}
                  className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {showClosures[maquila.id] && (
              <div className="mt-6 border-t pt-4 dark:border-gray-700">
                <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Tabla de Cierre</h4>
                <MaquilaClosuresTable maquilaId={maquila.id} />
              </div>
            )}

            {selectedMaquilaId === maquila.id && (
              <div className="mt-4 border-t pt-4 dark:border-gray-700">
                <h4 className="font-semib old mb-3 text-gray-900 dark:text-white">Comentarios</h4>
                <div className="mb-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Agregar un comentario..."
                    className="w-full p-2 border rounded resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    rows={3}
                  />
                  <button
                    onClick={() => handleAddComment(maquila)}
                    disabled={loading || !newComment.trim()}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Agregando...' : 'Agregar comentario'}
                  </button>
                </div>

                <div className="space-y-3">
                  {getComments(maquila).map((comment: any) => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded shadow-sm relative group">
                      <p className="text-gray-800 dark:text-gray-200 pr-8">{comment.content}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatCommentDate(comment.created_at)}
                      </p>
                      <button
                        onClick={() => handleDeleteComment(maquila, comment.id)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar comentario"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {!getComments(maquila).length && (
                    <p className="text-center text-gray-500 dark:text-gray-400">No hay comentarios aún</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};