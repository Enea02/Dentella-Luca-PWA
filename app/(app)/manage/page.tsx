'use client'

import { useAuth } from '@/hooks/useAuth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomersManager } from '@/components/manage/CustomersManager'
import { ProductsManager } from '@/components/manage/ProductsManager'
import { ShieldAlert } from 'lucide-react'

export default function ManagePage() {
  const { role } = useAuth()

  // Only owner can access this page
  if (role !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldAlert className="h-12 w-12 text-slate-400" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Accesso negato</h2>
          <p className="text-slate-500">Solo i titolari possono accedere a questa sezione</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-lg font-semibold text-slate-900 mb-4">Gestione</h1>

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <Tabs defaultValue="customers">
          <TabsList className="w-full rounded-xl bg-slate-100 p-1">
            <TabsTrigger 
              value="customers" 
              className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Clienti
            </TabsTrigger>
            <TabsTrigger 
              value="products"
              className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Prodotti
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="mt-4">
            <CustomersManager />
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <ProductsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
