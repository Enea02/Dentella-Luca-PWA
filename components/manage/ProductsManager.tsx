'use client'

import { useState } from 'react'
import { useProducts } from '@/hooks/useData'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductEditDialog } from './ProductEditDialog'
import { SECTION_COLORS } from '@/lib/constants'
import type { Product } from '@/lib/types'
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
  const { products, remove } = useProducts()
  const [search, setSearch] = useState('')
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)

  const filteredProducts = products
    .filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.section.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  const handleDelete = async () => {
    if (!deleteProduct) return
    try {
      await remove(deleteProduct.id)
      toast.success('Prodotto eliminato')
      setDeleteProduct(null)
    } catch {
      toast.error('Errore durante l\'eliminazione')
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cerca prodotto..."
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

      {/* Product list */}
      <ScrollArea className="h-[60vh]">
        <div className="space-y-2 pr-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-white ring-1 ring-slate-200"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="font-medium text-slate-900 truncate">
                  {product.name}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                  SECTION_COLORS[product.section]
                )}>
                  {product.section}
                </span>
                <span className="text-xs text-slate-500 shrink-0">
                  {product.unit === 'kg' ? 'kg' : 'pezzi'}
                  {product.unit === 'kg' && product.piecesPerKg && (
                    <span className="ml-1">({product.piecesPerKg}/kg)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
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

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              {search ? 'Nessun prodotto trovato' : 'Nessun prodotto presente'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Edit/New Dialog */}
      <ProductEditDialog
        product={editProduct}
        open={!!editProduct || isNewOpen}
        onClose={() => {
          setEditProduct(null)
          setIsNewOpen(false)
        }}
      />

      {/* Delete Confirmation */}
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
