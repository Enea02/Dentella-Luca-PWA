'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSections } from '@/hooks/useData'
import type { SectionDef } from '@/lib/types'

interface SectionDialogProps {
  section: SectionDef | null  // null = new section
  open: boolean
  onClose: () => void
}

export function SectionDialog({ section, open, onClose }: SectionDialogProps) {
  const { create, rename } = useSections()
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isNew = !section

  useEffect(() => {
    setName(section?.name ?? '')
  }, [section, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Inserisci un nome')
      return
    }
    setIsLoading(true)
    try {
      if (isNew) {
        await create(name.trim())
        toast.success('Gruppo creato')
      } else {
        await rename(section.id, name.trim())
        toast.success('Gruppo rinominato')
      }
      onClose()
    } catch {
      toast.error('Errore durante il salvataggio')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined} className="rounded-3xl max-w-sm">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Nuovo gruppo' : 'Rinomina gruppo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">Nome</Label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Croissant, Pane speciale..."
              className="rounded-xl"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl bg-slate-900 hover:bg-slate-800">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
