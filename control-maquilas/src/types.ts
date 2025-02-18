export interface Maquila {
  id: string;
  name: string;
  capacity: number;
  assignedPieces: number;
  startDate: string;
  endDate: string;
  paymentDate: string | null;
  advanceAmount: number;
  status: 'available' | 'in-progress' | 'near-deadline' | 'ready' | 'overdue';
  comments: string | null;
}

export const getStatusColor = (status: Maquila['status']): string => {
  const colors = {
    'available': 'bg-green-500',
    'in-progress': 'bg-yellow-500',
    'near-deadline': 'bg-orange-500',
    'ready': 'bg-blue-500',
    'overdue': 'bg-red-500'
  };
  return colors[status];
};