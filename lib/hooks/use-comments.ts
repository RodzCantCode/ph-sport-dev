'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

/**
 * Hook for managing comments with real-time synchronization.
 * 
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Real-time sync via Supabase Realtime
 * - Editing with 15-minute time limit (enforced in DB)
 * 
 * Known Workarounds:
 * - UUID filter: Supabase Realtime UUID column filters don't work reliably,
 *   so filtering is done in code instead of the subscription config.
 * - Reconnection: On websocket reconnect, comments are reloaded to catch
 *   any missed events during the disconnection.
 */

export interface Comment {
  id: string;
  design_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

export function useComments(designId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  // Track IDs of comments we've optimistically added to avoid duplicates from realtime
  const pendingRealIdsRef = useRef<Set<string>>(new Set());
  // Track if initial load has completed to avoid duplicate loads on SUBSCRIBED
  const hasInitialLoadRef = useRef(false);

  const supabase = createClient();

  useEffect(() => {
    if (!designId) return;
    
    // Reset on designId change
    hasInitialLoadRef.current = false;

    const loadComments = async () => {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            id,
            design_id,
            user_id,
            content,
            created_at,
            updated_at,
            user:profiles!user_id(full_name, avatar_url)
          `)
          .eq('design_id', designId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Transformar data para aplanar la estructura si es necesario, 
        // pero Supabase devuelve user como objeto anidado que coincide con nuestra interfaz
        setComments(data as unknown as Comment[]);
        hasInitialLoadRef.current = true;
      } catch (err) {
        logger.error('Error loading comments:', err);
        toast.error('Error al cargar comentarios');
      } finally {
        setLoading(false);
      }
    };

    loadComments();

    // Realtime subscription
    // Note: Supabase filter with UUID columns has issues, so we filter in code instead
    const channel = supabase
      .channel(`comments-${designId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        async (payload) => {
          // Filter in code since Supabase UUID filter doesn't work reliably
          const payloadDesignId = payload.new?.design_id || payload.old?.design_id;
          if (payloadDesignId !== designId) {
            return; // Ignore events from other designs
          }
          
          if (payload.eventType === 'INSERT') {
            const newId = payload.new.id as string;
            
            // Skip if we already added this comment optimistically
            if (pendingRealIdsRef.current.has(newId)) {
              pendingRealIdsRef.current.delete(newId);
              return;
            }
            
            // Fetch user data for the new comment (from another user)
            const { data: userData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            const newComment: Comment = {
              ...(payload.new as Omit<Comment, 'user'>),
              user: userData || { full_name: 'Usuario' },
            };

            setComments((prev) => [...prev, newComment]);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing comment in-place
            setComments((prev) =>
              prev.map((c) =>
                c.id === payload.new.id
                  ? { ...c, content: payload.new.content, updated_at: payload.new.updated_at }
                  : c
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        // Only reload on reconnection (not initial connection)
        // This catches any messages missed during a websocket disconnect
        if (status === 'SUBSCRIBED' && hasInitialLoadRef.current) {
          loadComments();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  // supabase is a singleton from createClient(), won't cause extra re-renders
  }, [designId, supabase]);

  const addComment = async (content: string, userId: string, userProfile?: { full_name: string; avatar_url?: string }) => {
    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      design_id: designId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      user: userProfile || { full_name: 'Tú' },
    };

    // Optimistic update - add immediately
    setComments((prev) => [...prev, optimisticComment]);

    try {
      const { data, error } = await supabase.from('comments').insert({
        design_id: designId,
        user_id: userId,
        content,
      }).select('id, created_at').single();

      if (error) throw error;

      // Update with real ID and timestamp from server
      if (data) {
        // Register this ID so realtime INSERT won't duplicate it
        pendingRealIdsRef.current.add(data.id);
        
        setComments((prev) =>
          prev.map((c) =>
            c.id === tempId ? { ...c, id: data.id, created_at: data.created_at } : c
          )
        );
      }
    } catch (err) {
      // Revert optimistic update on error
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      logger.error('Error adding comment:', err);
      toast.error('Error al enviar comentario');
      throw err;
    }
  };

  const deleteComment = async (commentId: string) => {
    // Store for rollback
    const previousComments = comments;
    
    // Optimistic delete
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);

      if (error) throw error;
    } catch (err) {
      // Rollback on error
      setComments(previousComments);
      logger.error('Error deleting comment:', err);
      toast.error('Error al eliminar comentario');
      throw err;
    }
  };

  const editComment = async (commentId: string, newContent: string) => {
    // Store for rollback
    const previousComments = comments;
    
    // Optimistic update
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, content: newContent, updated_at: new Date().toISOString() }
          : c
      )
    );

    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: newContent })
        .eq('id', commentId);

      if (error) {
        // Rollback on error
        setComments(previousComments);
        if (error.code === '42501') {
          toast.error('No puedes editar este comentario (límite de 15 minutos)');
        } else {
          throw error;
        }
        return false;
      }
      return true;
    } catch (err) {
      // Rollback on error
      setComments(previousComments);
      logger.error('Error editing comment:', err);
      toast.error('Error al editar comentario');
      return false;
    }
  };

  // Helper to check if a comment can be edited (15 min limit)
  const canEdit = (comment: Comment, userId: string) => {
    if (comment.user_id !== userId) return false;
    const createdAt = new Date(comment.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffMinutes <= 15;
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

  return { comments, loading, addComment, deleteComment, editComment, canEdit, markViewed };
}
