'use client'

import { useState } from 'react'
import { useCustomers } from '@/hooks/useData'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Plus, Pencil, Trash2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CustomerEditDialog } from './CustomerEditDialog'
import type { Customer } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export function CustomersManager() {
  const { customers, remove } = useCustomers()
  const [search, setSearch] = useState('')
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null)
  const [copyFromCustomerId, setCopyFromCustomerId] = useState<string | null>(null)

  const filteredCustomers = customers
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const handleDelete = async () => {
    if (!deleteCustomer) return
    try {
      await remove(deleteCustomer.id)
      toast.success('Cliente eliminato')
      setDeleteCustomer(null)
    } catch {
      toast.error('Errore durante l\'eliminazione')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cerca cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Button
          onClick={() => setIsNewOpen(true)}
          className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuovo
        </Button>
      </div>

      <ScrollArea className="h-[60vh]">
        <div className="space-y-2 pr-4">
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-white ring-1 ring-slate-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium text-slate-900 truncate">
                  {customer.name}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                  customer.type === 'fixed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                )}>
                  {customer.type === 'fixed' ? 'Fisso' : 'Giornaliero'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {customer.type === 'fixed' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    onClick={() => {
                      setCopyFromCustomerId(customer.id)
                      setIsNewOpen(true)
                    }}
                    title="Duplica ordine fisso"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-600"
                  onClick={() => setEditCustomer(customer)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600"
                  onClick={() => setDeleteCustomer(customer)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              {search ? 'Nessun cliente trovato' : 'Nessun cliente presente'}
            </div>
          )}
        </div>
      </ScrollArea>

      <CustomerEditDialog
        customer={editCustomer}
        open={!!editCustomer || isNewOpen}
        onClose={() => {
          setEditCustomer(null)
          setIsNewOpen(false)
          setCopyFromCustomerId(null)
        }}
        copyFromCustomerId={copyFromCustomerId}
      />

      <AlertDialog open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare &quot;{deleteCustomer?.name}&quot;. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
