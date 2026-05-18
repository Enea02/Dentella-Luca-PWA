'use client'

import { useRef, useState } from 'react'
import { useProducts, useSections } from '@/hooks/useData'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, Plus, Pencil, Trash2, GripVertical, FolderInput, FolderPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductEditDialog } from './ProductEditDialog'
import { SectionDialog } from './SectionDialog'
import type { Product, SectionDef } from '@/lib/types'
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

export function ProductsManager() {
  const { products, remove: removeProduct, update: updateProduct } = useProducts()
  const { sections, reorder, remove: removeSection } = useSections()

  const [search, setSearch] = useState('')
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [editSection, setEditSection] = useState<SectionDef | null>(null)
  const [isNewSectionOpen, setIsNewSectionOpen] = useState(false)
  const [deleteSection, setDeleteSection] = useState<SectionDef | null>(null)
  const [movingProduct, setMovingProduct] = useState<string | null>(null)

  // Drag state for section reorder
  const dragSectionId = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const q = search.toLowerCase()
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  const grouped = sortedSections.map(s => ({
    section: s,
    products: products
      .filter(p => p.section === s.name)
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.section.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter(g => !q || g.products.length > 0)

  // --- Drag handlers for section reorder ---
  const handleDragStart = (id: string) => { dragSectionId.current = id }
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    setDragOverId(id)
  }
  const handleDrop = async (targetId: string) => {
    const sourceId = dragSectionId.current
    if (!sourceId || sourceId === targetId) { setDragOverId(null); return }
    const ids = sortedSections.map(s => s.id)
    const from = ids.indexOf(sourceId)
    const to = ids.indexOf(targetId)
    const reordered = [...ids]
    reordered.splice(from, 1)
    reordered.splice(to, 0, sourceId)
    setDragOverId(null)
    dragSectionId.current = null
    await reorder(reordered)
  }

  // --- Move product to another section ---
  const handleMoveProduct = async (product: Product, targetSectionName: string) => {
    setMovingProduct(product.id)
    try {
      await updateProduct(product.id, { section: targetSectionName })
      toast.success(`Spostato in "${targetSectionName}"`)
    } catch {
      toast.error('Errore durante lo spostamento')
    } finally {
      setMovingProduct(null)
    }
  }

  // --- Delete product ---
  const handleDeleteProduct = async () => {
    if (!deleteProduct) return
    try {
      await removeProduct(deleteProduct.id)
      toast.success('Prodotto eliminato')
      setDeleteProduct(null)
    } catch {
      toast.error("Errore durante l'eliminazione")
    }
  }

  // --- Delete section ---
  const handleDeleteSection = async () => {
    if (!deleteSection) return
    const hasProducts = products.some(p => p.section === deleteSection.name)
    if (hasProducts) {
      toast.error('Sposta prima tutti i prodotti di questo gruppo')
      setDeleteSection(null)
      return
    }
    try {
      await removeSection(deleteSection.id)
      toast.success('Gruppo eliminato')
      setDeleteSection(null)
    } catch {
      toast.error("Errore durante l'eliminazione")
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and action buttons */}
      <div className="flex gap-2 md:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cerca prodotto o gruppo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsNewSectionOpen(true)}
          aria-label="Nuovo gruppo"
          title="Nuovo gruppo"
          className="rounded-xl border-dashed shrink-0 px-3 md:px-4"
        >
          <FolderPlus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Nuovo gruppo</span>
        </Button>
        <Button
          onClick={() => setIsNewProductOpen(true)}
          aria-label="Nuovo articolo"
          title="Nuovo articolo"
          className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 shrink-0 px-3 md:px-4"
        >
          <Plus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Nuovo articolo</span>
        </Button>
      </div>

      {/* Grouped list */}
      <ScrollArea className="h-[60vh]">
        <div className="space-y-4 pr-4">
          {grouped.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              {search ? 'Nessun prodotto trovato' : 'Nessun prodotto presente'}
            </div>
          )}

          {grouped.map(({ section, products: sectionProducts }) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(section.id)}
              onDragOver={(e) => handleDragOver(e, section.id)}
              onDragEnd={() => setDragOverId(null)}
              onDrop={() => handleDrop(section.id)}
              className={cn(
                'rounded-2xl border-2 transition-colors',
                dragOverId === section.id
                  ? 'border-slate-400 bg-slate-50'
                  : 'border-transparent'
              )}
            >
              {/* Section header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <GripVertical className="h-4 w-4 text-slate-300 cursor-grab active:cursor-grabbing shrink-0" />
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', section.color)}>
                  {section.name}
                </span>
                <span className="text-xs text-slate-400 flex-1">
                  {sectionProducts.length} {sectionProducts.length === 1 ? 'prodotto' : 'prodotti'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-slate-600"
                  onClick={() => setEditSection(section)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-red-600"
                  onClick={() => setDeleteSection(section)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Products */}
              <div className="space-y-1.5 pl-6">
                {sectionProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white ring-1 ring-slate-200"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-medium text-slate-900 truncate text-sm">
                        {product.name}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {product.unit === 'kg'
                          ? `kg${product.piecesPerKg ? ` · ${product.piecesPerKg}/kg` : ''}`
                          : 'pz'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move to section */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600"
                            disabled={movingProduct === product.id}
                            title="Sposta in un altro gruppo"
                          >
                            <FolderInput className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-1 rounded-xl">
                          <p className="px-2 py-1 text-xs text-slate-400 font-medium">Sposta in...</p>
                          {sortedSections
                            .filter(s => s.name !== product.section)
                            .map(s => (
                              <button
                                key={s.id}
                                onClick={() => handleMoveProduct(product, s.name)}
                                className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium mr-2', s.color)}>
                                  {s.name}
                                </span>
                              </button>
                            ))}
                        </PopoverContent>
                      </Popover>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-600"
                        onClick={() => setEditProduct(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        onClick={() => setDeleteProduct(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {sectionProducts.length === 0 && !q && (
                  <div className="px-4 py-2 text-xs text-slate-400 italic">Nessun prodotto</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Dialogs */}
      <ProductEditDialog
        product={editProduct}
        open={!!editProduct || isNewProductOpen}
        onClose={() => { setEditProduct(null); setIsNewProductOpen(false) }}
      />

      <SectionDialog
        section={editSection}
        open={!!editSection || isNewSectionOpen}
        onClose={() => { setEditSection(null); setIsNewSectionOpen(false) }}
      />

      {/* Delete product confirm */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il prodotto?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare &quot;{deleteProduct?.name}&quot;. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="rounded-xl bg-red-600 hover:bg-red-700">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete section confirm */}
      <AlertDialog open={!!deleteSection} onOpenChange={() => setDeleteSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il gruppo?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare il gruppo &quot;{deleteSection?.name}&quot;. Sposta prima tutti i prodotti contenuti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection} className="rounded-xl bg-red-600 hover:bg-red-700">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
