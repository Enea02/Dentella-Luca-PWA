'use client'

import { useEffect, useState } from 'react'
import { useBakery, useUsers } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/auth/permissions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Pencil, Trash2, UserPlus, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'
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

interface BakeryDialogProps {
  open: boolean
  onClose: () => void
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  owner: 'Titolare',
  staff: 'Staff',
}

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-purple-600 text-white',
  owner: 'bg-slate-900 text-white',
  staff: 'bg-slate-100 text-slate-700',
}

export function BakeryDialog({ open, onClose }: BakeryDialogProps) {
  const { user } = useAuth()
  const { bakery, update: updateBakery } = useBakery()
  const { users, create: createUser, update: updateUserRole, remove: removeUser } = useUsers()

  // Authorization: these mirror the API permission checks (withAuth `require`).
  // The endpoints already reject unauthorized calls (403); this hides controls
  // the user can't use so the UI doesn't mislead them.
  const canManageUsers = can(user, 'users:manage')
  const canEditBakery = can(user, 'bakery:edit')

  // Bakery name editing
  const [bakeryName, setBakeryName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [savingName, setSavingName] = useState(false)

  // New user form
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<Role>('staff')
  const [addingUser, setAddingUser] = useState(false)
  const [savingUser, setSavingUser] = useState(false)

  // Delete confirm
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  useEffect(() => {
    if (bakery) setBakeryName(bakery.name)
  }, [bakery])

  async function handleSaveName() {
    if (!bakeryName.trim()) return
    setSavingName(true)
    try {
      await updateBakery(bakeryName.trim())
      setEditingName(false)
      toast.success('Nome aggiornato')
    } catch {
      toast.error('Errore durante il salvataggio')
    } finally {
      setSavingName(false)
    }
  }

  async function handleAddUser() {
    if (!newEmail.trim() || newPassword.length < 8) return
    setSavingUser(true)
    try {
      await createUser(newEmail.trim(), newRole, newPassword)
      setNewEmail('')
      setNewPassword('')
      setNewRole('staff')
      setAddingUser(false)
      toast.success('Utente aggiunto')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore durante l'aggiunta")
    } finally {
      setSavingUser(false)
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserId) return
    try {
      await removeUser(deleteUserId)
      setDeleteUserId(null)
      toast.success('Utente rimosso')
    } catch {
      toast.error('Errore durante la rimozione')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent aria-describedby={undefined} className="flex flex-col gap-0 p-0 rounded-3xl sm:max-w-md max-h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {bakery?.name ?? '—'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
            {/* Bakery info section */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Panetteria
              </p>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">Nome</span>
                  {editingName ? (
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <Input
                        value={bakeryName}
                        onChange={(e) => setBakeryName(e.target.value)}
                        className="h-10 md:h-8 rounded-lg text-sm max-w-[180px]"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 md:h-8 md:w-8 text-emerald-600 hover:text-emerald-700"
                        onClick={handleSaveName}
                        disabled={savingName}
                      >
                        {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 md:h-8 md:w-8 text-slate-400"
                        onClick={() => { setEditingName(false); setBakeryName(bakery?.name ?? '') }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{bakery?.name}</span>
                      {canEditBakery && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 md:h-7 md:w-7 text-slate-400 hover:text-slate-600"
                          onClick={() => setEditingName(true)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {canEditBakery && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">ID</span>
                    <span className="text-xs font-mono text-slate-400">{bakery?.id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Users section — management controls require the users:manage permission */}
            {canManageUsers && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Utenti ({users.length})
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 md:h-7 text-xs text-slate-600 gap-1"
                  onClick={() => setAddingUser(true)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Aggiungi
                </Button>
              </div>

              <div className="space-y-2">
                {users.map((u) => {
                  const isSelf = u.id === user?.id
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{u.email}</p>
                        {isSelf && (
                          <p className="text-xs text-slate-400">Tu</p>
                        )}
                      </div>

                      <Select
                        value={u.role}
                        onValueChange={(v) => updateUserRole(u.id, v as Role)}
                        disabled={isSelf}
                      >
                        <SelectTrigger className={cn('h-9 md:h-7 w-24 text-xs rounded-lg border-0', ROLE_COLORS[u.role])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Titolare</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 md:h-7 md:w-7 text-slate-300 hover:text-red-500 shrink-0"
                        onClick={() => setDeleteUserId(u.id)}
                        disabled={isSelf}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}

                {/* Add user form */}
                {addingUser && (
                  <div className="rounded-xl border border-dashed border-slate-300 px-3 py-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="email"
                        placeholder="email@esempio.it"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="h-10 md:h-7 flex-1 rounded-lg text-sm md:text-xs border-slate-200"
                        autoFocus
                      />
                      <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                        <SelectTrigger className="h-10 md:h-7 w-24 text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Titolare</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        placeholder="Password (min 8 caratteri)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-10 md:h-7 flex-1 rounded-lg text-sm md:text-xs border-slate-200"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 md:h-7 md:w-7 text-emerald-600 hover:text-emerald-700 shrink-0"
                        onClick={handleAddUser}
                        disabled={savingUser || !newEmail.trim() || newPassword.length < 8}
                      >
                        {savingUser ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 md:h-7 md:w-7 text-slate-400 shrink-0"
                        onClick={() => { setAddingUser(false); setNewEmail(''); setNewPassword('') }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rimuovere l&apos;utente?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;utente perderà l&apos;accesso alla panetteria. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="rounded-xl bg-red-600 hover:bg-red-700">
              Rimuovi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
