'use client'

import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/auth/permissions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomersManager } from '@/components/manage/CustomersManager'
import { ProductsManager } from '@/components/manage/ProductsManager'
import { PermissionsManager } from '@/components/manage/PermissionsManager'
import { ShieldAlert } from 'lucide-react'

export default function ManagePage() {
  const { user } = useAuth()

  const canCustomers = can(user, 'customers:write')
  const canProducts = can(user, 'products:write')
  const canPermissions = can(user, 'permissions:manage')

  if (!canCustomers && !canProducts && !canPermissions) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldAlert className="h-12 w-12 text-slate-400" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Accesso negato</h2>
          <p className="text-slate-500">Non hai i permessi per accedere a questa sezione</p>
        </div>
      </div>
    )
  }

  const defaultTab = canCustomers ? 'customers' : canProducts ? 'products' : 'permissions'

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-lg font-semibold text-slate-900 mb-4">Gestione</h1>

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full rounded-xl bg-slate-100 p-1">
            {canCustomers && (
              <TabsTrigger
                value="customers"
                className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Clienti
              </TabsTrigger>
            )}
            {canProducts && (
              <TabsTrigger
                value="products"
                className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Prodotti
              </TabsTrigger>
            )}
            {canPermissions && (
              <TabsTrigger
                value="permissions"
                className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Permessi
              </TabsTrigger>
            )}
          </TabsList>

          {canCustomers && (
            <TabsContent value="customers" className="mt-4">
              <CustomersManager />
            </TabsContent>
          )}

          {canProducts && (
            <TabsContent value="products" className="mt-4">
              <ProductsManager />
            </TabsContent>
          )}

          {canPermissions && (
            <TabsContent value="permissions" className="mt-4">
              <PermissionsManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
