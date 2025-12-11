'use client';

import { useState, useRef, useEffect } from 'react';
import { useComments } from '@/lib/hooks/use-comments';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader } from '@/components/ui/loader';
import { Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CommentsSectionProps {
  designId: string;
}

export function CommentsSection({ designId }: CommentsSectionProps) {
  const { comments, loading, addComment, deleteComment, markViewed } = useComments(designId);
  const { user, profile } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    
    // Mark as read when comments are loaded
    if (comments.length > 0 && user) {
      markViewed(user.id);
    }
  }, [comments, user, markViewed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSending(true);
    try {
      await addComment(newComment, user.id);
      setNewComment('');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('¿Estás seguro de eliminar este comentario?')) {
      await deleteComment(commentId);
    }
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader /></div>;

  return (
    <div className="flex flex-col h-full max-h-[500px] border-t border-gray-100 dark:border-white/10 mt-6 pt-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 px-1">Comentarios</h3>
      
      {/* Messages List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 min-h-[200px]"
      >
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
            No hay comentarios aún. ¡Sé el primero!
          </div>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.user_id === user?.id;
            const isAdmin = profile?.role === 'ADMIN';
            const canDelete = isOwn || isAdmin;

            return (
              <div key={comment.id} className={cn("flex gap-3", isOwn ? "flex-row-reverse" : "")}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={comment.user?.avatar_url} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                    {comment.user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className={cn(
                  "group relative max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                  isOwn 
                    ? "bg-orange-500 text-white rounded-tr-none" 
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-tl-none"
                )}>
                  <div className="flex justify-between items-start gap-2">
                    <span className={cn("font-semibold text-xs mb-1 block opacity-90", isOwn ? "text-orange-100" : "text-gray-500 dark:text-gray-400")}>
                      {comment.user?.full_name}
                    </span>
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:text-red-500"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  
                  <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                  
                  <span className={cn(
                    "text-[10px] mt-1 block text-right opacity-70",
                    isOwn ? "text-orange-100" : "text-gray-400"
                  )}>
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe un comentario..."
          className="min-h-[40px] max-h-[120px] resize-none py-2"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!newComment.trim() || sending}
          className="bg-orange-500 hover:bg-orange-600 text-white shrink-0 h-10 w-10"
        >
          {sending ? <Loader className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
