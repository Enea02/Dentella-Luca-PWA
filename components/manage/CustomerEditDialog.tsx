'use client'

import { useEffect, useState } from 'react'
import { useCustomers } from '@/hooks/useData'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import type { Customer } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface CustomerEditDialogProps {
  customer: Customer | null
  open: boolean
  onClose: () => void
}

export function CustomerEditDialog({ customer, open, onClose }: CustomerEditDialogProps) {
  const { create, update } = useCustomers()
  const [name, setName] = useState('')
  const [isFixed, setIsFixed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isNew = !customer

  useEffect(() => {
    if (customer) {
      setName(customer.name)
      setIsFixed(customer.type === 'fixed')
    } else {
      setName('')
      setIsFixed(false)
    }
  }, [customer, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Inserisci un nome')
      return
    }

    setIsLoading(true)
    try {
      if (isNew) {
        await create({
          name: name.trim(),
          type: isFixed ? 'fixed' : 'single',
        })
        toast.success('Cliente creato')
      } else {
        await update(customer.id, {
          name: name.trim(),
          type: isFixed ? 'fixed' : 'single',
        })
        toast.success('Cliente aggiornato')
      }
      onClose()
    } catch {
      toast.error('Errore durante il salvataggio')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Nuovo Cliente' : 'Modifica Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome del cliente"
              className="rounded-xl"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="fixed">Cliente fisso</Label>
            <Switch
              id="fixed"
              checked={isFixed}
              onCheckedChange={setIsFixed}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-slate-900 hover:bg-slate-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                'Salva'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
