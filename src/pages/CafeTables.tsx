import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCafeTables, useCreateTable, useUpdateTable, useDeleteTable } from '@/hooks/useCafeTables';
import { TableCard } from '@/components/pos/TableCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TableStatus, CafeTable } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { AddTableDialog } from '@/components/pos/AddTableDialog';
import { EditTableDialog } from '@/components/pos/EditTableDialog';
import { DeleteTableDialog } from '@/components/pos/DeleteTableDialog';
import { toast } from 'sonner';

const statusFilters: { status: 'all' | 'free' | 'occupied'; labelEn: string; labelFr: string; labelAr: string }[] = [
  { status: 'all', labelEn: 'All', labelFr: 'Tout', labelAr: 'الكل' },
  { status: 'free', labelEn: 'Free', labelFr: 'Libre', labelAr: 'متاح' },
  { status: 'occupied', labelEn: 'Occupied', labelFr: 'Occupé', labelAr: 'مشغول' },
];

const CafeTables = () => {
  const { t, currentUser } = useApp();
  const navigate = useNavigate();
  const { data: cafeTables = [], isLoading, error } = useCafeTables();
  const [filter, setFilter] = useState<'all' | 'free' | 'occupied'>('all');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<CafeTable | null>(null);
  const [tableToEdit, setTableToEdit] = useState<CafeTable | null>(null);

  const createTableMutation = useCreateTable();
  const updateTableMutation = useUpdateTable();
  const deleteTableMutation = useDeleteTable();
  const isAdmin = currentUser?.role === 'admin';

  const filteredTables = filter === 'all'
    ? cafeTables
    : filter === 'free'
      ? cafeTables.filter((tbl) => tbl.status === 'free')
      : cafeTables.filter((tbl) => tbl.status !== 'free');

  const statusCounts = cafeTables.reduce((acc, table) => {
    if (table.status === 'free') {
      acc.free = (acc.free || 0) + 1;
    } else {
      acc.occupied = (acc.occupied || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const handleCreateTable = async (data: { number: number; name: string; capacity?: number }) => {
    try {
      await createTableMutation.mutateAsync(data);
      toast.success(t('Table created successfully', 'Table créée avec succès', 'تم إنشاء الطاولة بنجاح'));
      setAddDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to create table', 'Échec de la création de la table', 'فشل إنشاء الطاولة'));
    }
  };

  const handleUpdateTable = async (data: { id: string; number: number; name: string; capacity?: number }) => {
    try {
      await updateTableMutation.mutateAsync({ id: data.id, data: { number: data.number, name: data.name, capacity: data.capacity } });
      toast.success(t('Table updated successfully', 'Table mise à jour avec succès', 'تم تحديث الطاولة بنجاح'));
      setEditDialogOpen(false);
      setTableToEdit(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to update table', 'Échec de la mise à jour de la table', 'فشل تحديث الطاولة'));
    }
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;
    try {
      await deleteTableMutation.mutateAsync(tableToDelete.id);
      toast.success(t('Table deleted successfully', 'Table supprimée avec succès', 'تم حذف الطاولة بنجاح'));
      setDeleteDialogOpen(false);
      setTableToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to delete table', 'Échec de la suppression de la table', 'فشل حذف الطاولة'));
    }
  };

  const confirmEdit = (e: React.MouseEvent, table: CafeTable) => {
    e.stopPropagation();
    setTableToEdit(table);
    setEditDialogOpen(true);
  };

  const confirmDelete = (e: React.MouseEvent, table: CafeTable) => {
    e.stopPropagation();
    setTableToDelete(table);
    setDeleteDialogOpen(true);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-destructive">{t('Failed to load tables', 'Échec du chargement des tables', 'فشل تحميل الطاولات')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('Café Tables', 'Tables Café', 'الطاولات')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('Manage café table orders', 'Gérer les commandes des tables', 'إدارة طلبات الطاولات')}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('Add Table', 'Ajouter une table', 'إضافة طاولة')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map(({ status, labelEn, labelFr, labelAr }) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            className="touch-target"
          >
            {t(labelEn, labelFr, labelAr)}
            {status !== 'all' && statusCounts[status] !== undefined && (
              <span
                className={cn(
                  'ms-2 rounded-full px-2 py-0.5 text-xs',
                  filter === status
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {statusCounts[status]}
              </span>
            )}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onClick={() => {
                // Smart Navigation:
                // If table is free but has unpaid orders -> Go to Table Detail (to pay/view old orders)
                // If table is free and clean -> Go to New Order
                if (table.status === 'free' && !table.hasUnpaidOrders) {
                  navigate('/order/new?table=' + table.id);
                } else {
                  navigate('/tables/' + table.id);
                }
              }}
              onDelete={isAdmin ? (e) => confirmDelete(e, table) : undefined}
              onEdit={isAdmin ? (e) => confirmEdit(e, table) : undefined}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredTables.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-muted-foreground">
            {t('No tables with this status', 'Aucune table avec ce statut', 'لا يوجد طاولات بهذه الحالة')}
          </p>
        </div>
      )}

      {/* Dialogs */}
      <AddTableDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleCreateTable}
        isLoading={createTableMutation.isPending}
      />

      <EditTableDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        table={tableToEdit}
        onSubmit={handleUpdateTable}
        isLoading={updateTableMutation.isPending}
      />

      <DeleteTableDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        table={tableToDelete}
        onConfirm={handleDeleteTable}
        isLoading={deleteTableMutation.isPending}
      />
    </div>
  );
};

export default CafeTables;
