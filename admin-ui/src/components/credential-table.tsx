import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw, ChevronUp, ChevronDown, Wallet, Trash2, Loader2, ChevronRight, Power, PowerOff, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CredentialStatusItem, BalanceResponse } from '@/types/api'
import {
  useSetDisabled,
  useSetPriority,
  useResetFailure,
  useDeleteCredential,
  useSetCurrent,
} from '@/hooks/use-credentials'

interface CredentialTableProps {
  credentials: CredentialStatusItem[]
  selectedIds: Set<number>
  onToggleSelect: (id: number) => void
  onSelectGroup: (ids: number[]) => void
  onDeselectGroup: (ids: number[]) => void
  balanceMap: Map<number, BalanceResponse>
  loadingBalanceIds: Set<number>
  onViewBalance: (id: number) => void
}

function formatLastUsed(lastUsedAt: string | null): string {
  if (!lastUsedAt) return '-'
  const date = new Date(lastUsedAt)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 0) return '刚刚'
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}
/* -- CredentialRow: desktop table row + mobile card -- */
function CredentialRow({
  credential,
  selected,
  onToggleSelect,
  balance,
  loadingBalance,
  onViewBalance,
}: {
  credential: CredentialStatusItem
  selected: boolean
  onToggleSelect: () => void
  balance: BalanceResponse | null
  loadingBalance: boolean
  onViewBalance: (id: number) => void
}) {
  const [editingPriority, setEditingPriority] = useState(false)
  const [priorityValue, setPriorityValue] = useState(String(credential.priority))
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const setDisabled = useSetDisabled()
  const setPriority = useSetPriority()
  const resetFailure = useResetFailure()
  const deleteCredential = useDeleteCredential()
  const setCurrent = useSetCurrent()

  const handleToggleDisabled = () => {
    setDisabled.mutate(
      { id: credential.id, disabled: !credential.disabled },
      {
        onSuccess: (res) => toast.success(res.message),
        onError: (err) => toast.error('操作失败: ' + (err as Error).message),
      }
    )
  }

  const handlePriorityChange = () => {
    const newPriority = parseInt(priorityValue, 10)
    if (isNaN(newPriority) || newPriority < 0) {
      toast.error('优先级必须是非负整数')
      return
    }
    setPriority.mutate(
      { id: credential.id, priority: newPriority },
      {
        onSuccess: (res) => { toast.success(res.message); setEditingPriority(false) },
        onError: (err) => toast.error('操作失败: ' + (err as Error).message),
      }
    )
  }

  const handleSetCurrent = () => {
    setCurrent.mutate(credential.id, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err) => toast.error('操作失败: ' + (err as Error).message),
    })
  }

  const handleDelete = () => {
    if (!credential.disabled) {
      toast.error('请先禁用凭据再删除')
      setShowDeleteDialog(false)
      return
    }
    deleteCredential.mutate(credential.id, {
      onSuccess: (res) => { toast.success(res.message); setShowDeleteDialog(false) },
      onError: (err) => toast.error('删除失败: ' + (err as Error).message),
    })
  }

  const actionButtons = (
    <div className="flex items-center gap-0.5 flex-wrap">
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSetCurrent}
        disabled={setCurrent.isPending || credential.isCurrent || credential.disabled}
        title={credential.isCurrent ? '已是当前' : credential.disabled ? '需先启用' : '设为当前'}>
        <Star className={`h-3 w-3 ${credential.isCurrent ? 'fill-yellow-500 text-yellow-500' : ''}`} />
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleToggleDisabled}
        disabled={setDisabled.isPending} title={credential.disabled ? '启用' : '禁用'}>
        {credential.disabled ? <Power className="h-3 w-3 text-green-500" /> : <PowerOff className="h-3 w-3 text-muted-foreground" />}
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6"
        onClick={() => resetFailure.mutate(credential.id, { onSuccess: (r) => toast.success(r.message), onError: (e) => toast.error((e as Error).message) })}
        disabled={resetFailure.isPending || credential.failureCount === 0} title="重置失败">
        <RefreshCw className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6"
        onClick={() => setPriority.mutate({ id: credential.id, priority: Math.max(0, credential.priority - 1) }, { onSuccess: (r) => toast.success(r.message), onError: (e) => toast.error((e as Error).message) })}
        disabled={setPriority.isPending || credential.priority === 0} title="提高优先级">
        <ChevronUp className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6"
        onClick={() => setPriority.mutate({ id: credential.id, priority: credential.priority + 1 }, { onSuccess: (r) => toast.success(r.message), onError: (e) => toast.error((e as Error).message) })}
        disabled={setPriority.isPending} title="降低优先级">
        <ChevronDown className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onViewBalance(credential.id)} title="查看余额">
        <Wallet className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowDeleteDialog(true)}
        disabled={!credential.disabled} title={!credential.disabled ? '需先禁用' : '删除'}>
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  )

  const usageBar = loadingBalance ? (
    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
  ) : balance ? (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[40px]">
        <div
          className={`h-full rounded-full ${balance.usagePercentage > 80 ? 'bg-red-500' : balance.usagePercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
          style={{ width: `${balance.usagePercentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {balance.remaining.toFixed(1)}/{balance.usageLimit.toFixed(0)}
      </span>
    </div>
  ) : null

  const deleteDialog = (
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除凭据</DialogTitle>
          <DialogDescription>确定要删除凭据 #{credential.id} 吗？此操作无法撤销。</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteCredential.isPending}>取消</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteCredential.isPending || !credential.disabled}>确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
  return (
    <>
      {/* Desktop: table row */}
      <tr className={`hidden md:table-row border-b border-border/50 hover:bg-muted/50 text-sm ${credential.isCurrent ? 'bg-primary/5' : ''}`}>
        <td className="px-2 py-1.5 w-8">
          <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
        </td>
        <td className="px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">#{credential.id}</span>
            <span className="truncate max-w-[140px]" title={credential.email || undefined}>
              {credential.email || '-'}
            </span>
            {credential.isCurrent && <Badge variant="success" className="text-[10px] px-1 py-0">当前</Badge>}
          </div>
        </td>
        <td className="px-2 py-1.5">
          <span className="text-xs text-muted-foreground">{credential.authMethod || '-'}</span>
        </td>
        <td className="px-2 py-1.5 w-16">
          {editingPriority ? (
            <div className="flex items-center gap-0.5">
              <Input
                type="number" value={priorityValue}
                onChange={(e) => setPriorityValue(e.target.value)}
                className="w-12 h-6 text-xs px-1" min="0"
                onKeyDown={(e) => { if (e.key === 'Enter') handlePriorityChange(); if (e.key === 'Escape') { setEditingPriority(false); setPriorityValue(String(credential.priority)) } }}
                autoFocus
              />
            </div>
          ) : (
            <span className="cursor-pointer hover:underline" onClick={() => setEditingPriority(true)}>
              {credential.priority}
            </span>
          )}
        </td>
        <td className="px-2 py-1.5">
          {loadingBalance ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-xs">{balance?.subscriptionTitle || '-'}</span>
          )}
        </td>
        <td className="px-2 py-1.5 w-[150px]">
          {usageBar || <span className="text-xs text-muted-foreground">-</span>}
        </td>
        <td className="px-2 py-1.5 text-xs">
          <span>{credential.successCount}</span>
          <span className="text-muted-foreground">/</span>
          <span className={credential.failureCount > 0 ? 'text-red-500' : ''}>{credential.failureCount}</span>
        </td>
        <td className="px-2 py-1.5 text-xs text-muted-foreground">
          {formatLastUsed(credential.lastUsedAt)}
        </td>
        <td className="px-2 py-1.5">{actionButtons}</td>
      </tr>

      {/* Mobile: card layout */}
      <div className={`md:hidden border-b border-border/50 px-3 py-2 text-sm ${credential.isCurrent ? 'bg-primary/5' : ''}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
          <span className="text-muted-foreground text-xs">#{credential.id}</span>
          <span className="truncate flex-1 font-medium" title={credential.email || undefined}>
            {credential.email || '-'}
          </span>
          {credential.isCurrent && <Badge variant="success" className="text-[10px] px-1 py-0">当前</Badge>}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground ml-6 mb-1.5">
          <span>{credential.authMethod || '-'}</span>
          <span>P:{credential.priority}</span>
          <span>{balance?.subscriptionTitle || '-'}</span>
          <span>{credential.successCount}/{credential.failureCount > 0 ? <span className="text-red-500">{credential.failureCount}</span> : credential.failureCount}</span>
          <span>{formatLastUsed(credential.lastUsedAt)}</span>
        </div>
        {usageBar && <div className="ml-6 mb-1.5 max-w-[200px]">{usageBar}</div>}
        <div className="ml-5">{actionButtons}</div>
      </div>

      {deleteDialog}
    </>
  )
}
export function CredentialTable({
  credentials,
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  onDeselectGroup,
  balanceMap,
  loadingBalanceIds,
  onViewBalance,
}: CredentialTableProps) {
  const [enabledCollapsed, setEnabledCollapsed] = useState(false)
  const [disabledCollapsed, setDisabledCollapsed] = useState(true)

  const enabled = credentials.filter(c => !c.disabled).sort((a, b) => a.priority - b.priority)
  const disabled = credentials.filter(c => c.disabled).sort((a, b) => a.priority - b.priority)

  const enabledIds = enabled.map(c => c.id)
  const disabledIds = disabled.map(c => c.id)
  const allEnabledSelected = enabledIds.length > 0 && enabledIds.every(id => selectedIds.has(id))
  const allDisabledSelected = disabledIds.length > 0 && disabledIds.every(id => selectedIds.has(id))

  const headerCells = (
    <>
      <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground w-8"></th>
      <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">凭据</th>
      <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">认证</th>
      <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground w-16">优先级</th>
      <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">订阅</th>
      <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground w-[150px]">用量</th>
      <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">成功/失败</th>
      <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">最后使用</th>
      <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">操作</th>
    </>
  )

  const renderGroup = (
    label: string,
    items: CredentialStatusItem[],
    groupIds: number[],
    allSelected: boolean,
    collapsed: boolean,
    setCollapsed: (v: boolean) => void,
    variant: 'success' | 'destructive'
  ) => (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronRight className={`h-4 w-4 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
        <Badge variant={variant} className="text-xs">{label}</Badge>
        <span className="text-sm text-muted-foreground">({items.length})</span>
        <div className="flex-1" />
        {items.length > 0 && (
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => {
              if (checked) onSelectGroup(groupIds)
              else onDeselectGroup(groupIds)
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
      {!collapsed && items.length > 0 && (
        <>
          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20">
                <tr>{headerCells}</tr>
              </thead>
              <tbody>
                {items.map(cred => (
                  <CredentialRow
                    key={cred.id}
                    credential={cred}
                    selected={selectedIds.has(cred.id)}
                    onToggleSelect={() => onToggleSelect(cred.id)}
                    balance={balanceMap.get(cred.id) || null}
                    loadingBalance={loadingBalanceIds.has(cred.id)}
                    onViewBalance={onViewBalance}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile: card list */}
          <div className="md:hidden">
            {items.map(cred => (
              <CredentialRow
                key={cred.id}
                credential={cred}
                selected={selectedIds.has(cred.id)}
                onToggleSelect={() => onToggleSelect(cred.id)}
                balance={balanceMap.get(cred.id) || null}
                loadingBalance={loadingBalanceIds.has(cred.id)}
                onViewBalance={onViewBalance}
              />
            ))}
          </div>
        </>
      )}
      {!collapsed && items.length === 0 && (
        <div className="px-4 py-3 text-sm text-muted-foreground text-center">无凭据</div>
      )}
    </div>
  )

  return (
    <div className="space-y-3">
      {renderGroup('启用中', enabled, enabledIds, allEnabledSelected, enabledCollapsed, setEnabledCollapsed, 'success')}
      {renderGroup('已禁用', disabled, disabledIds, allDisabledSelected, disabledCollapsed, setDisabledCollapsed, 'destructive')}
    </div>
  )
}
