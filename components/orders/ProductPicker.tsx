'use client'

import { useState } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProducts, useSections } from '@/hooks/useData'

interface ProductPickerProps {
  value: string
  onChange: (productId: string) => void
  placeholder?: string
}

export function ProductPicker({ value, onChange, placeholder = 'Seleziona prodotto...' }: ProductPickerProps) {
  const { products } = useProducts()
  const { sections } = useSections()

  const selected = products.find(p => p.id === value)

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const sortedSections = [...sections].sort((a, b) => a.order - b.order)
  const q = search.toLowerCase()
  const isSearching = q.length > 0

  const grouped = sortedSections.map(s => ({
    section: s,
    products: products
      .filter(p => p.section === s.name)
      .filter(p => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter(g => g.products.length > 0)

  const handleSelect = (productId: string) => {
    onChange(productId)
    setOpen(false)
    setSearch('')
    setExpandedSection(null)
  }

  const handleOpen = () => {
    // Pre-expand the section of the currently selected product
    setExpandedSection(selected?.section ?? null)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSearch('')
    setExpandedSection(null)
  }

  // Closed state — trigger button
  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-left',
          'flex items-center justify-between gap-2 transition-colors hover:border-slate-300',
          selected ? 'text-slate-900' : 'text-slate-400'
        )}
      >
        <span className="truncate">{selected ? selected.name : placeholder}</span>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
      </button>
    )
  }

  // Open state — inline accordion picker
  return (
    <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-sm">
      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          autoFocus
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca prodotto..."
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
        />
        <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sections */}
      <div className="max-h-60 overflow-y-auto">
        {grouped.length === 0 && (
          <div className="px-4 py-4 text-sm text-slate-400 text-center">Nessun prodotto trovato</div>
        )}

        {grouped.map(({ section, products: sectionProducts }) => {
          const isExpanded = isSearching || expandedSection === section.name

          return (
            <div key={section.id} className="border-b border-slate-100 last:border-0">
              {/* Section header */}
              <button
                type="button"
                onClick={() => setExpandedSection(isExpanded && !isSearching ? null : section.name)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', section.color)}>
                    {section.name}
                  </span>
                  <span className="text-xs text-slate-400">{sectionProducts.length}</span>
                </div>
                {!isSearching && (
                  <ChevronDown className={cn(
                    'h-4 w-4 text-slate-400 transition-transform duration-150',
                    isExpanded && 'rotate-180'
                  )} />
                )}
              </button>

              {/* Products list */}
              {isExpanded && (
                <div className="bg-slate-50/50">
                  {sectionProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelect(product.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-6 py-2.5 text-sm text-left transition-colors',
                        'hover:bg-slate-100',
                        value === product.id && 'bg-emerald-50 hover:bg-emerald-50'
                      )}
                    >
                      <span className={cn(
                        value === product.id ? 'font-semibold text-emerald-800' : 'text-slate-800'
                      )}>
                        {product.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400">
                          {product.unit === 'kg' ? 'kg' : 'pz'}
                        </span>
                        {value === product.id && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
