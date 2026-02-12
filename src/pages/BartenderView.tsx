import { useApp } from '@/contexts/AppContext';
import { useActiveOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { OrderQueueCard } from '@/components/pos/OrderQueueCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, Clock, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';

const BartenderView = () => {
  const { t, currentUser, language } = useApp();
  const { data: orders = [], isLoading } = useActiveOrders();
  const updateStatusMutation = useUpdateOrderStatus();

  const userRole = currentUser?.role;
  const canManageStatus = userRole === 'admin' || userRole === 'bartender';

  const newOrders = orders.filter((o) => o.status === 'new');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  const handleMarkPreparing = (orderId: string) => {
    updateStatusMutation.mutate({ orderId, status: 'preparing' });
  };

  const handleMarkReady = (orderId: string) => {
    updateStatusMutation.mutate({ orderId, status: 'ready' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t('Preparation Queue', 'File de préparation', 'إدارة الطلبات')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('Manage incoming orders', 'Gérer les commandes entrantes', 'إدارة الطلبات الواردة')}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="new" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="new" className="gap-2">
              <Clock className="h-4 w-4" />
              {t('New', 'Nouvelles', 'جديدة')}
              {newOrders.length > 0 && (
                <span className={cn(
                  "rounded-full bg-status-ordered px-2 py-0.5 text-xs text-status-ordered-foreground",
                  "ms-2"
                )}>
                  {newOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing" className="gap-2">
              <ChefHat className="h-4 w-4" />
              {t('Preparing', 'En cours', 'قيد التحضير')}
              {preparingOrders.length > 0 && (
                <span className={cn(
                  "rounded-full bg-status-preparing px-2 py-0.5 text-xs text-status-preparing-foreground",
                  "ms-2"
                )}>
                  {preparingOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {t('Ready', 'Prêtes', 'جاهزة')}
              {readyOrders.length > 0 && (
                <span className={cn(
                  "rounded-full bg-status-ready px-2 py-0.5 text-xs text-status-ready-foreground",
                  "ms-2"
                )}>
                  {readyOrders.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            {newOrders.length === 0 ? (
              <EmptyState
                icon={Clock}
                title={t('No new orders', 'Aucune nouvelle commande', 'لا توجد طلبات جديدة')}
                description={t('New orders will appear here', 'Les nouvelles commandes apparaîtront ici', 'ستظهر الطلبات الجديدة هنا')}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {newOrders.map((order) => (
                  <OrderQueueCard
                    key={order.id}
                    order={order}
                    onMarkPreparing={canManageStatus ? () => handleMarkPreparing(order.id) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preparing" className="mt-6">
            {preparingOrders.length === 0 ? (
              <EmptyState
                icon={ChefHat}
                title={t('Nothing in preparation', 'Rien en préparation', 'لا يوجد طلبات في التحضير')}
                description={t('Orders being prepared will appear here', 'Les commandes en préparation apparaîtront ici', 'ستظهر الطلبات التي تتم التحضير هنا')}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {preparingOrders.map((order) => (
                  <OrderQueueCard
                    key={order.id}
                    order={order}
                    onMarkReady={canManageStatus ? () => handleMarkReady(order.id) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ready" className="mt-6">
            {readyOrders.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title={t('No ready orders', 'Aucune commande prête', 'لا توجد طلبات جاهزة')}
                description={t('Ready orders will appear here', 'Les commandes prêtes apparaîtront ici', 'ستظهر الطلبات الجاهزة هنا')}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {readyOrders.map((order) => (
                  <OrderQueueCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    <p className="mt-1 text-muted-foreground">{description}</p>
  </div>
);

export default BartenderView;
