'use client'

import { useEffect, useState } from 'react'
import { useProducts } from '@/hooks/useData'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useSections } from '@/hooks/useData'
import type { Product } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface ProductEditDialogProps {
  product: Product | null
  open: boolean
  onClose: () => void
}

export function ProductEditDialog({ product, open, onClose }: ProductEditDialogProps) {
  const { create, update } = useProducts()
  const { sections } = useSections()
  const [name, setName] = useState('')
  const [section, setSection] = useState('Dolci')
  const [isKg, setIsKg] = useState(false)
  const [piecesPerKg, setPiecesPerKg] = useState('1')
  const [isLoading, setIsLoading] = useState(false)

  const isNew = !product

  useEffect(() => {
    if (product) {
      setName(product.name)
      setSection(product.section)
      setIsKg(product.unit === 'kg')
      setPiecesPerKg(product.piecesPerKg?.toString() || '1')
    } else {
      setName('')
      setSection('Dolci')
      setIsKg(false)
      setPiecesPerKg('1')
    }
  }, [product, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Inserisci un nome')
      return
    }

    setIsLoading(true)
    try {
      const productData = {
        name: name.trim(),
        section,
        unit: (isKg ? 'kg' : 'pieces') as 'kg' | 'pieces',
        ...(isKg && piecesPerKg ? { piecesPerKg: parseInt(piecesPerKg, 10) } : {}),
      }

      if (isNew) {
        await create(productData)
        toast.success('Prodotto creato')
      } else {
        await update(product.id, productData)
        toast.success('Prodotto aggiornato')
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
      <DialogContent
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="rounded-3xl"
      >
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Nuovo Prodotto' : 'Modifica Prodotto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome del prodotto"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Sezione</Label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sections.map(s => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="unit">Venduto a peso (kg)</Label>
            <Switch
              id="unit"
              checked={isKg}
              onCheckedChange={setIsKg}
            />
          </div>

          {isKg && (
            <div className="space-y-2">
              <Label htmlFor="piecesPerKg">Pezzi per kg</Label>
              <Input
                id="piecesPerKg"
                type="number"
                value={piecesPerKg}
                onChange={(e) => setPiecesPerKg(e.target.value)}
                min={1}
                className="rounded-xl"
              />
            </div>
          )}

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
