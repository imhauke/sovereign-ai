import { useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/app'

export function ChatSidebar() {
  const { chats, activeChatId, setActiveChatId, createChat, deleteChat, renameChat } = useAppStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const editRef = useRef<HTMLInputElement>(null)

  function startEdit(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(id)
    setTimeout(() => editRef.current?.select(), 0)
  }

  function commitEdit(id: string) {
    const val = editRef.current?.value.trim()
    if (val) renameChat(id, val)
    setEditingId(null)
  }

  function handleEditKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === 'Enter') commitEdit(id)
    if (e.key === 'Escape') setEditingId(null)
  }

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-border bg-surface overflow-hidden">
      <div className="p-3 border-b border-border">
        <button
          onClick={createChat}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg
                     border border-border2 text-sm text-muted-light hover:text-white
                     hover:border-accent/50 hover:bg-accent/5 transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {chats.map((chat) => {
          const isActive = chat.id === activeChatId
          const isEditing = editingId === chat.id
          const isConfirming = confirmId === chat.id

          return (
            <div
              key={chat.id}
              className={cn(
                'group flex flex-col mx-1 my-0.5 rounded-lg cursor-pointer transition-colors overflow-hidden',
                isActive ? 'bg-surface2' : 'hover:bg-surface2/60',
              )}
              onClick={() => !isEditing && setActiveChatId(chat.id)}
            >
              <div className="flex items-center gap-1.5 px-3 py-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={cn('flex-shrink-0', isActive ? 'opacity-70 text-accent-light' : 'opacity-40 text-muted')}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>

                {isEditing ? (
                  <input
                    ref={editRef}
                    defaultValue={chat.title}
                    className="flex-1 bg-transparent text-[13px] text-white outline-none border-b border-accent/60 min-w-0"
                    onBlur={() => commitEdit(chat.id)}
                    onKeyDown={(e) => handleEditKeyDown(e, chat.id)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className={cn('flex-1 text-[13px] truncate', isActive ? 'text-white' : 'text-muted')}>
                    {chat.title}
                  </span>
                )}

                {!isEditing && !isConfirming && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-opacity">
                    <button onClick={(e) => startEdit(chat.id, e)} title="Rename"
                      className="p-1 rounded hover:text-white text-muted transition-colors">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {chats.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); setConfirmId(chat.id) }} title="Delete"
                        className="p-1 rounded hover:text-err text-muted transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isConfirming && (
                <div className="flex items-center justify-between px-3 pb-2.5 gap-2 animate-fadein"
                  onClick={(e) => e.stopPropagation()}>
                  <span className="text-[11px] text-muted-light">Delete this chat?</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => setConfirmId(null)}
                      className="text-[11px] px-2 py-0.5 rounded border border-border2 text-muted hover:text-white transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => { deleteChat(chat.id); setConfirmId(null) }}
                      className="text-[11px] px-2 py-0.5 rounded bg-err/20 border border-err/40 text-red-300 hover:bg-err/30 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
