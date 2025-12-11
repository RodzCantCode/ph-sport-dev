'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  design_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

export function useComments(designId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!designId) return;

    const loadComments = async () => {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            user:profiles(full_name, avatar_url)
          `)
          .eq('design_id', designId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Transformar data para aplanar la estructura si es necesario, 
        // pero Supabase devuelve user como objeto anidado que coincide con nuestra interfaz
        setComments(data as unknown as Comment[]);
      } catch (err) {
        logger.error('Error loading comments:', err);
        toast.error('Error al cargar comentarios');
      } finally {
        setLoading(false);
      }
    };

    loadComments();

    // Realtime subscription
    const channel = supabase
      .channel(`comments-${designId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `design_id=eq.${designId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch user data for the new comment
            const { data: userData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            const newComment: Comment = {
              ...payload.new as any,
              user: userData || { full_name: 'Usuario' },
            };

            setComments((prev) => [...prev, newComment]);
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [designId]);

  const addComment = async (content: string, userId: string) => {
    try {
      const { error } = await supabase.from('comments').insert({
        design_id: designId,
        user_id: userId,
        content,
      });

      if (error) throw error;
      // No need to update state manually, subscription handles it
    } catch (err) {
      logger.error('Error adding comment:', err);
      toast.error('Error al enviar comentario');
      throw err;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);

      if (error) throw error;
    } catch (err) {
      logger.error('Error deleting comment:', err);
      toast.error('Error al eliminar comentario');
      throw err;
    }
  };

  const markViewed = async (userId: string) => {
    if (!comments.length) return;
    
    // Filter comments not by me
    const commentsToMark = comments.filter(c => c.user_id !== userId).map(c => c.id);
    if (!commentsToMark.length) return;

    try {
      // Upsert into message_read_status
      const { error } = await supabase
        .from('message_read_status')
        .upsert(
          commentsToMark.map(commentId => ({
            user_id: userId,
            comment_id: commentId
          })),
          { onConflict: 'user_id,comment_id', ignoreDuplicates: true }
        );

      if (error) console.error('Error marking comments as read:', error);
    } catch (err) {
      console.error('Error in markViewed:', err);
    }
  };

  return { comments, loading, addComment, deleteComment, markViewed };
}
