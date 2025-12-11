import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

export interface DesignConversation {
  designId: string;
  designTitle: string;
  player: string;
  match: string; // "Home vs Away"
  lastMessage: {
    content: string;
    author: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  totalComments: number;
}

export function useAllComments() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<DesignConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 1. Get designs assigned to user OR created by user (optional, depending on requirements)
      // For now, let's focus on designs assigned to the user
      const { data: designs, error: designsError } = await supabase
        .from('designs')
        .select('id, title, player, match_home, match_away')
        .or(`designer_id.eq.${user.id},created_by.eq.${user.id}`);

      if (designsError) throw designsError;
      if (!designs || designs.length === 0) {
        setConversations([]);
        return;
      }

      const designIds = designs.map(d => d.id);

      // 2. Get all comments for these designs
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          design_id,
          user_id,
          profiles:user_id (full_name)
        `)
        .in('design_id', designIds)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // 3. Get read status for these comments by this user
      const { data: readStatus, error: readError } = await supabase
        .from('message_read_status')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', comments?.map(c => c.id) || []);

      if (readError) throw readError;

      const readCommentIds = new Set(readStatus?.map(r => r.comment_id));

      // 4. Group and process
      const grouped = designs.map(design => {
        const designComments = comments?.filter(c => c.design_id === design.id) || [];
        const lastComment = designComments[0];
        
        // Count unread: comments NOT by me AND NOT in readStatus
        const unreadCount = designComments.filter(c => 
          c.user_id !== user.id && !readCommentIds.has(c.id)
        ).length;

        return {
          designId: design.id,
          designTitle: design.title,
          player: design.player,
          match: `${design.match_home} vs ${design.match_away}`,
          lastMessage: lastComment ? {
            content: lastComment.content,
            author: (lastComment.profiles as any)?.full_name || 'Desconocido',
            createdAt: lastComment.created_at
          } : null,
          unreadCount,
          totalComments: designComments.length
        };
      });

      // Filter out designs with no comments? Or keep them?
      // "Comunicaciones" usually implies existing conversations. 
      // Let's keep only those with comments for now, or all?
      // User requested "visualizar el trabajo semanal... junto a metricas".
      // But for "Comunicaciones", probably only active threads.
      // Let's sort by last message date.
      
      const activeConversations = grouped
        .filter(g => g.totalComments > 0)
        .sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return dateB - dateA;
        });

      setConversations(activeConversations);

    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to new comments
    const channel = supabase
      .channel('all-comments-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations, supabase]);

  return { conversations, loading, refresh: fetchConversations };
}
