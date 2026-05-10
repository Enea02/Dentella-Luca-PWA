'use client'

import { useRef, useState } from 'react'
import { useProductionGroups, useSections } from '@/hooks/useData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GripVertical, Pencil, Plus, Trash2, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import type { ProductionGroup } from '@/lib/types'

export function ProductionGroupsManager({ onClose }: { onClose: () => void }) {
  const { groups, create, update, remove, reorder } = useProductionGroups()
  const { sections } = useSections()

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteGroup, setDeleteGroup] = useState<ProductionGroup | null>(null)

  const dragId = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order)
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  const handleCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    try {
      await create(trimmed)
      setNewName('')
      toast.success('Gruppo creato')
    } catch {
      toast.error('Errore durante la creazione')
    }
  }

  const handleRename = async (group: ProductionGroup) => {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === group.name) {
      setEditingId(null)
      return
    }
    try {
      await update(group.id, { name: trimmed })
      toast.success('Gruppo rinominato')
    } catch {
      toast.error("Errore durante la rinomina")
    } finally {
      setEditingId(null)
    }
  }

  const handleToggleSection = async (group: ProductionGroup, sectionId: string) => {
    const isAssigned = group.sectionIds.includes(sectionId)
    const next = isAssigned
      ? group.sectionIds.filter(id => id !== sectionId)
      : [...group.sectionIds, sectionId]
    try {
      await update(group.id, { sectionIds: next })
    } catch {
      toast.error("Errore durante l'aggiornamento")
    }
  }

  const handleDelete = async () => {
    if (!deleteGroup) return
    try {
      await remove(deleteGroup.id)
      toast.success('Gruppo eliminato')
      setDeleteGroup(null)
    } catch {
      toast.error("Errore durante l'eliminazione")
    }
  }

  const handleDragStart = (id: string) => { dragId.current = id }
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    setDragOverId(id)
  }
  const handleDrop = async (targetId: string) => {
    const sourceId = dragId.current
    if (!sourceId || sourceId === targetId) {
      setDragOverId(null)
      return
    }
    const ids = sortedGroups.map(g => g.id)
    const from = ids.indexOf(sourceId)
    const to = ids.indexOf(targetId)
    const reordered = [...ids]
    reordered.splice(from, 1)
    reordered.splice(to, 0, sourceId)
    setDragOverId(null)
    dragId.current = null
    await reorder(reordered)
  }

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Gestione gruppi produzione</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Create */}
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
          placeholder="Nome del nuovo gruppo (es. Dolci, Pane, Salati)"
          className="rounded-xl"
        />
        <Button
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4 mr-1" />
          Aggiungi
        </Button>
      </div>

      {/* Groups list */}
      <div className="space-y-3">
        {sortedGroups.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            Nessun gruppo. Creane uno per organizzare la produzione.
          </div>
        )}

        {sortedGroups.map(group => (
          <div
            key={group.id}
            draggable={editingId !== group.id}
            onDragStart={() => handleDragStart(group.id)}
            onDragOver={(e) => handleDragOver(e, group.id)}
            onDragEnd={() => setDragOverId(null)}
            onDrop={() => handleDrop(group.id)}
            className={cn(
              'rounded-2xl border-2 p-3 transition-colors',
              dragOverId === group.id ? 'border-slate-400 bg-slate-50' : 'border-slate-200'
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <GripVertical className="h-4 w-4 text-slate-300 cursor-grab active:cursor-grabbing shrink-0" />
              {editingId === group.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(group)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                    className="rounded-xl h-8 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-600"
                    onClick={() => handleRename(group)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-900 flex-1">{group.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                    onClick={() => { setEditingId(group.id); setEditName(group.name) }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                    onClick={() => setDeleteGroup(group)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>

            {/* Section toggles */}
            <div className="flex flex-wrap gap-2">
              {sortedSections.length === 0 && (
                <span className="text-xs text-slate-400 italic">Nessuna sezione disponibile</span>
              )}
              {sortedSections.map(section => {
                const active = group.sectionIds.includes(section.id)
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleToggleSection(group, section.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                      active
                        ? cn(section.color, 'ring-2 ring-slate-400')
                        : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100'
                    )}
                  >
                    {section.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteGroup} onOpenChange={() => setDeleteGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il gruppo?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare il gruppo &quot;{deleteGroup?.name}&quot;. Le sezioni assegnate non verranno toccate, solo il raggruppamento in produzione.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
