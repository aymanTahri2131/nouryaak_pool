import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useCafeTable, usePayAllOrders } from '@/hooks/useCafeTables';
import { useUpdateOrderStatus, useCancelOrder, useTableOrders, useArchiveOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/pos/StatusBadge';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UnpaidOrders } from '@/components/pos/UnpaidOrders';

const TableDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, currentUser } = useApp();
  const userRole = currentUser?.role;
  const { data: tableData, isLoading: tableLoading, error } = useCafeTable(id ?? null);
  const { data: allOrders = [], isLoading: ordersLoading } = useTableOrders(id ?? null);

  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();
  const payAllMutation = usePayAllOrders();
  const archiveOrderMutation = useArchiveOrder();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  // Filter for active orders (not paid and not archived)
  // Archived orders should only appear in the unpaid section
  const activeOrders = allOrders.filter(o => o.status !== 'paid' && !o.isArchived);

  // Unpaid orders include both active served orders AND archived served orders
  const unpaidOrders = allOrders.filter(o => o.status === 'served');

  const handleStatusChange = async (orderId: string, status: 'preparing' | 'ready' | 'served' | 'paid') => {
    try {
      await updateStatusMutation.mutateAsync({ orderId, status });
      toast.success(t('Status updated', 'Statut mis à jour', 'تم تحديث الحالة'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to update', 'Échec', 'فشل التحديث'));
    }
  };

  const handlePayAll = async () => {
    if (!id) return;
    try {
      await payAllMutation.mutateAsync(id);
      toast.success(t('All orders paid', 'Toutes les commandes payées', 'تم دفع جميع الطلبات'));
      navigate('/tables');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to pay all', 'Échec du paiement groupé', 'فشل دفع جميع الطلبات'));
    }
  };

  const handleArchiveOrder = async (orderId: string) => {
    try {
      await archiveOrderMutation.mutateAsync(orderId);
      toast.success(t('Order archived', 'Commande archivée', 'تم أرشفة الطلب'));
      navigate('/tables');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to archive order', 'Échec de l\'archivage', 'فشل أرشفة الطلب'));
    }
  };

  const confirmCancel = (orderId: string) => {
    setOrderToCancel(orderId);
    setShowCancelDialog(true);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      await cancelOrderMutation.mutateAsync(orderToCancel);
      toast.success(t('Order cancelled', 'Commande annulée', 'تم إلغاء الطلب'));
      setShowCancelDialog(false);
      setOrderToCancel(null);
      // If no orders left, navigate back? No, stay on table.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to cancel', 'Échec de l\'annulation', 'فشل الإلغاء'));
    }
  };

  if (error || (!tableLoading && !tableData)) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t('Table not found', 'Table non trouvée', 'الطاولة غير موجودة')}</p>
        <Button variant="link" onClick={() => navigate('/tables')} className="mt-2">
          {t('Back to tables', 'Retour aux tables', 'العودة إلى الطاولات')}
        </Button>
      </div>
    );
  }

  if (tableLoading || !tableData || ordersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { table } = tableData;
  const hasNewOrder = activeOrders.some(o => o.status === 'new');

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tables')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('Table', 'Table', 'طاولة')} #{table.number}
          </h1>
          <p className="text-muted-foreground">
            {table.waiterName && `${t('Waiter', 'Serveur', 'النادل')}: ${table.waiterName}`}
          </p>
        </div>

        {/* Global Actions (Top Right) */}
        <div className="ml-auto flex gap-2">


          {/* New Order Button - Allow if no order is 'New' */}
          {(!hasNewOrder || activeOrders.length === 0) && (
            <Button
              onClick={() => navigate('/order/new?table=' + table.id)}
            >
              {t('+ New Order', '+ Nouvelle commande', '+ طلب جديد')}
            </Button>
          )}
        </div>
      </div>

      {activeOrders.length > 0 ? (
        <div className="space-y-6">
          {activeOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden border-l-4 border-l-primary">
              <CardHeader className="bg-muted/40 pb-4">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <span>{t('Order', 'Commande', 'طلب')} #{order.orderNumber}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <StatusBadge status={order.status} size="sm" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm py-2 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground min-w-[24px]">{item.quantity}x</span>
                          <span className="font-medium text-foreground">{item.productName}</span>
                        </div>
                        {(item.selectedOptions && item.selectedOptions.length > 0) || (item.sugar !== undefined && item.sugar > 0) ? (
                          <div className="flex flex-wrap gap-1 mt-1.5 ms-8">
                            {item.selectedOptions?.map(opt => (
                              <span key={opt} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase font-bold tracking-tight">
                                {opt}
                              </span>
                            ))}
                            {item.sugar !== undefined && item.sugar > 0 && (
                              <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-tight">
                                {t('Sugar', 'Sucre', 'سكر')}: {item.sugar}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <span className="text-muted-foreground font-medium ms-4">{(item.unitPrice * item.quantity).toFixed(2)} DH</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-lg font-bold">{t('Total', 'Total', 'المجموع')}:</p>
                  <p className="text-lg font-bold text-primary">{order.total.toFixed(2)} DH</p>
                </div>

                <div className="flex gap-2 pt-2 flex-wrap justify-end">
                  {/* Add Items Button (Only for NEW orders) */}
                  {order.status === 'new' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/order/new?table=${table.id}&orderId=${order.id}`)}
                    >
                      {t('+ Add Items', '+ Ajouter articles', '+ إضافة أصناف')}
                    </Button>
                  )}

                  {order.status === 'new' && (userRole === 'admin' || userRole === 'bartender') && (
                    <Button size="sm" onClick={() => handleStatusChange(order.id, 'preparing')}>
                      {t('Mark Preparing', 'Préparer', 'تحضير')}
                    </Button>
                  )}
                  {order.status === 'preparing' && (userRole === 'admin' || userRole === 'bartender') && (
                    <Button size="sm" onClick={() => handleStatusChange(order.id, 'ready')}>
                      {t('Mark Ready', 'Prêt', 'جاهز')}
                    </Button>
                  )}
                  {order.status === 'ready' && (userRole === 'admin' || userRole === 'waiter') && (
                    <Button size="sm" onClick={() => handleStatusChange(order.id, 'served')}>
                      {t('Mark Served', 'Servi', 'تقديم')}
                    </Button>
                  )}


                  {/* Release Table Button - Keep order unpaid but free the table */}
                  {['served'].includes(order.status) && (userRole === 'admin' || userRole === 'waiter') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                      onClick={() => handleArchiveOrder(order.id)}
                    >
                      {t('Archive Order', 'Archiver Commande', 'أرشفة الطلب')}
                    </Button>
                  )}

                  {/* Cancel Order Button */}
                  {['new', 'preparing', 'ready'].includes(order.status) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmCancel(order.id)}
                      className="ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('No active orders for this table', 'Aucune commande active', 'لا توجد طلبات نشطة لهذه الطاولة')}</p>
            <Button className="mt-4" onClick={() => navigate('/order/new?table=' + table.id)}>
              {t('Create Order', 'Créer une commande', 'إنشاء طلب')}
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Cancel Order?', 'Annuler la commande ?', 'إلغاء الطلب؟')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'Are you sure you want to cancel this order? This action cannot be undone.',
                'Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.',
                'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrderToCancel(null)}>{t('Keep Order', 'Garder la commande', 'لا، احتفظ بالطلب')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('Yes, Cancel', 'Oui, annuler', 'نعم، ألغِ')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(userRole === 'admin' || userRole === 'waiter') && (
        <UnpaidOrders
          orders={unpaidOrders}
          isLoading={ordersLoading}
          onMarkPaid={(orderId) => handleStatusChange(orderId, 'paid')}
        />
      )}

    </div>
  );
};

export default TableDetail;
