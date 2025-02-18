import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import type { Maquila } from './types';
import { MaquilaCard } from './components/MaquilaCard';
import { AdminPanel } from './components/AdminPanel';
import { supabase, retryOperation } from './lib/supabase';
import { Auth } from './components/Auth';

function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [maquilas, setMaquilas] = useState<Maquila[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Record<Maquila['status'], boolean>>({
    'available': false,
    'in-progress': false,
    'near-deadline': false,
    'ready': false,
    'overdue': false
  });

  const statusConfig = {
    'available': { color: 'bg-green-500', label: 'Disponible' },
    'in-progress': { color: 'bg-yellow-500', label: 'En Proceso' },
    'near-deadline': { color: 'bg-orange-500', label: 'Tiene pendientes' },
    'ready': { color: 'bg-blue-500', label: 'Listo' },
    'overdue': { color: 'bg-red-500', label: 'Atrasado' }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setMaquilas([]);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchMaquilas();
    }
  }, [session]);

  const fetchMaquilas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await retryOperation(async () => 
        supabase
          .from('maquilas')
          .select('*')
          .order('created_at', { ascending: false })
      );

      if (supabaseError) throw supabaseError;

      const formattedData = data?.map(maquila => {
        return {
          ...maquila,
          startDate: maquila.start_date,
          endDate: maquila.end_date,
          paymentDate: maquila.payment_date,
          assignedPieces: maquila.assigned_pieces || 0,
          advanceAmount: maquila.advance_amount || 0,
          comments: maquila.comments || '[]'
        };
      }) || [];

      setMaquilas(formattedData);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al cargar las maquilas. Por favor, verifica tu conexión a internet.';
      setError(errorMessage);
      console.error('Error fetching maquilas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMaquila = async (updatedMaquila: Maquila) => {
    try {
      const { error: updateError } = await retryOperation(async () =>
        supabase
          .from('maquilas')
          .update({
            name: updatedMaquila.name,
            capacity: updatedMaquila.capacity,
            assigned_pieces: updatedMaquila.assignedPieces,
            start_date: updatedMaquila.startDate,
            end_date: updatedMaquila.endDate,
            payment_date: updatedMaquila.paymentDate,
            advance_amount: updatedMaquila.advanceAmount,
            status: updatedMaquila.status,
            comments: updatedMaquila.comments
          })
          .eq('id', updatedMaquila.id)
      );

      if (updateError) throw updateError;
      setMaquilas(maquilas.map((m) => (m.id === updatedMaquila.id ? updatedMaquila : m)));
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al actualizar la maquila. Por favor, intenta de nuevo.';
      console.error('Error updating maquila:', err);
      alert(errorMessage);
    }
  };

  const handleAddMaquila = async (newMaquila: Omit<Maquila, 'id'>) => {
    try {
      const { data, error: addError } = await retryOperation(async () =>
        supabase
          .from('maquilas')
          .insert([
            {
              name: newMaquila.name,
              capacity: newMaquila.capacity,
              assigned_pieces: newMaquila.assignedPieces,
              start_date: newMaquila.startDate,
              end_date: newMaquila.endDate,
              payment_date: newMaquila.paymentDate,
              advance_amount: newMaquila.advanceAmount,
              status: newMaquila.status,
              comments: newMaquila.comments || '[]'
            }
          ])
          .select()
          .single()
      );

      if (addError) throw addError;
      if (data) {
        const formattedMaquila = {
          ...data,
          startDate: data.start_date,
          endDate: data.end_date,
          paymentDate: data.payment_date,
          assignedPieces: data.assigned_pieces,
          advanceAmount: data.advance_amount,
          comments: data.comments || '[]'
        };
        setMaquilas([formattedMaquila, ...maquilas]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al agregar la maquila. Por favor, intenta de nuevo.';
      console.error('Error adding maquila:', err);
      alert(errorMessage);
    }
  };

  const handleDeleteMaquila = async (id: string) => {
    try {
      const { error: deleteError } = await retryOperation(async () =>
        supabase
          .from('maquilas')
          .delete()
          .eq('id', id)
      );

      if (deleteError) throw deleteError;
      setMaquilas(maquilas.filter((m) => m.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al eliminar la maquila. Por favor, intenta de nuevo.';
      console.error('Error deleting maquila:', err);
      alert(errorMessage);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setMaquilas([]);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al cerrar sesión. Por favor, intenta de nuevo.';
      console.error('Error signing out:', err);
      alert(errorMessage);
    }
  };

  const getFilteredMaquilas = () => {
    if (!searchTerm.trim()) return [];

    return maquilas.filter(maquila => {
      try {
        const comments = JSON.parse(maquila.comments || '[]');
        return Array.isArray(comments) && comments.some((comment: any) => 
          comment.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } catch {
        return false;
      }
    });
  };

  const handleStatusFilterChange = (status: Maquila['status']) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const getVisibleMaquilas = () => {
    const activeFilters = Object.entries(statusFilters).filter(([_, isActive]) => isActive);
    if (activeFilters.length === 0) return maquilas;
    
    return maquilas.filter(maquila => statusFilters[maquila.status]);
  };

  const filteredMaquilas = getFilteredMaquilas();
  const visibleMaquilas = getVisibleMaquilas();

  if (!session) {
    return <Auth />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-red-500 text-xl mb-4">Error: {error}</p>
          <button
            onClick={fetchMaquilas}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Uniformes Centroamericanos
              </h1>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar en comentarios..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSearchResults(!!e.target.value.trim());
                    }}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {showSearchResults && searchTerm.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                      {filteredMaquilas.length > 0 ? (
                        filteredMaquilas.map(maquila => {
                          const comments = JSON.parse(maquila.comments || '[]');
                          const matchingComments = comments.filter((comment: any) =>
                            comment.content.toLowerCase().includes(searchTerm.toLowerCase())
                          );

                          return (
                            <div key={maquila.id} className="p-4 border-b hover:bg-gray-50">
                              <h3 className="font-bold text-lg mb-2">{maquila.name}</h3>
                              {matchingComments.map((comment: any) => (
                                <div key={comment.id} className="mb-2 last:mb-0 pl-4 border-l-2 border-blue-500">
                                  <p className="text-gray-800">{comment.content}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(comment.created_at).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              ))}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No se encontraron comentarios
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title={isAdminOpen ? "Cerrar panel de administración" : "Abrir panel de administración"}
                >
                  <Settings className="w-6 h-6" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
              <div className="flex gap-4">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statusFilters[status as Maquila['status']]}
                      onChange={() => handleStatusFilterChange(status as Maquila['status'])}
                      className="sr-only peer"
                    />
                    <div className={`w-6 h-6 ${config.color} rounded-md peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-blue-500 transition-all duration-200 flex items-center justify-center`}>
                      {statusFilters[status as Maquila['status']] && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{config.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {isAdminOpen ? (
          <AdminPanel
            maquilas={maquilas}
            onUpdateMaquila={handleUpdateMaquila}
            onAddMaquila={handleAddMaquila}
            onDeleteMaquila={handleDeleteMaquila}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleMaquilas.map((maquila) => (
              <MaquilaCard key={maquila.id} maquila={maquila} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;