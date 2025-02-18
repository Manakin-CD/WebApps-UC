import React, { useState } from 'react';
import type { Maquila } from '../types';
import { getStatusColor } from '../types';
import { supabase } from '../lib/supabase';
import { MessageCircle } from 'lucide-react';

interface MaquilaCardProps {
  maquila: Maquila;
}

export const MaquilaCard: React.FC<MaquilaCardProps> = ({ maquila }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const remainingCapacity = Math.max(0, (maquila.capacity || 0) - (maquila.assignedPieces || 0));
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No establecida';
    
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      
      if (isNaN(date.getTime())) {
        return 'Fecha no disponible';
      }

      const formatter = new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      });

      return formatter.format(date);
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₡${amount.toFixed(2)}`;
  };

  const generateUniqueId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      let currentComments = [];
      try {
        currentComments = JSON.parse(maquila.comments || '[]');
        if (!Array.isArray(currentComments)) {
          currentComments = [];
        }
      } catch {
        currentComments = [];
      }

      const newCommentObj = {
        id: generateUniqueId(),
        content: newComment.trim(),
        created_at: new Date().toISOString()
      };
      
      const updatedComments = JSON.stringify([newCommentObj, ...currentComments]);

      const { error } = await supabase
        .from('maquilas')
        .update({ comments: updatedComments })
        .eq('id', maquila.id);

      if (error) throw error;
      
      maquila.comments = updatedComments;
      setNewComment('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al agregar el comentario: ${errorMessage}`);
    } finally {
      setLoading(false);
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

  const getComments = () => {
    try {
      if (!maquila.comments) return [];
      const comments = JSON.parse(maquila.comments);
      return Array.isArray(comments) ? comments : [];
    } catch {
      return [];
    }
  };

  const hasComments = getComments().length > 0;

  const infoItems = [
    { id: 'capacity', label: 'Capacidad', value: maquila.capacity || 0 },
    { id: 'assigned', label: 'Asignadas', value: maquila.assignedPieces || 0 },
    { id: 'endDate', label: 'Fecha entrega', value: formatDate(maquila.endDate) },
    { id: 'paymentDate', label: 'Fecha de pago', value: formatDate(maquila.paymentDate) },
    { id: 'advance', label: 'Adelanto', value: formatCurrency(maquila.advanceAmount) }
  ];
  
  return (
    <div className={`${getStatusColor(maquila.status)} p-6 rounded-lg shadow-lg relative`}>
      <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full text-black font-medium">
        {remainingCapacity.toString()}
      </div>
      <h3 className="text-black text-xl font-bold mb-2">{maquila.name}</h3>
      <div className="text-black font-medium">
        {infoItems.map(item => (
          <p key={item.id} className="bg-white bg-opacity-80 px-2 py-1 rounded mb-1">
            {item.label}: {item.value}
          </p>
        ))}
        <button
          onClick={() => setShowComments(!showComments)}
          className="mt-2 flex items-center gap-2 bg-white bg-opacity-90 px-3 py-2 rounded-full hover:bg-opacity-100 transition-all"
        >
          <MessageCircle 
            size={18} 
            className={hasComments ? "text-green-500" : ""}
          />
          {showComments ? 'Ocultar comentarios' : 'Ver comentarios'}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 bg-white bg-opacity-90 p-4 rounded-lg">
          <form onSubmit={handleAddComment} className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Agregar un comentario..."
              className="w-full p-2 border rounded resize-none"
              rows={3}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Agregando...' : 'Agregar comentario'}
            </button>
          </form>

          <div className="space-y-3">
            {getComments().map((comment: any) => (
              <div key={comment.id} className="bg-white p-3 rounded shadow">
                <p className="text-gray-800">{comment.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCommentDate(comment.created_at)}
                </p>
              </div>
            ))}
            {!getComments().length && (
              <p className="text-center text-gray-500">No hay comentarios aún</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};