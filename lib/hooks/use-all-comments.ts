import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
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

const fetchConversations = async ([, userId]: [string, string]): Promise<DesignConversation[]> => {
  const supabase = createClient();

  // 1. Get all designs - "mini Slack" approach where everyone sees all team activity
  const { data: designs, error: designsError } = await supabase
    .from('designs')
    .select('id, title, player, match_home, match_away');

  if (designsError) throw designsError;
  if (!designs || designs.length === 0) {
    return [];
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
    .eq('user_id', userId)
    .in('comment_id', comments?.map(c => c.id) || []);

  if (readError) throw readError;

  const readCommentIds = new Set(readStatus?.map(r => r.comment_id));

  // 4. Group and process
  const grouped = designs.map(design => {
    const designComments = comments?.filter(c => c.design_id === design.id) || [];
    const lastComment = designComments[0];

    // Count unread: comments NOT by me AND NOT in readStatus
    const unreadCount = designComments.filter(c =>
      c.user_id !== userId && !readCommentIds.has(c.id)
    ).length;

    return {
      designId: design.id,
      designTitle: design.title,
      player: design.player,
      match: `${design.match_home} vs ${design.match_away}`,
      lastMessage: lastComment ? {
        content: lastComment.content,
        author: (lastComment.profiles as { full_name: string } | null)?.full_name || 'Desconocido',
        createdAt: lastComment.created_at
      } : null,
      unreadCount,
      totalComments: designComments.length
    };
  });

  // Filter to only active conversations and sort by last message date
  const activeConversations = grouped
    .filter(g => g.totalComments > 0)
    .sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  return activeConversations;
};

export function useAllComments() {
  const { user, status } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const { data, error, isLoading, mutate } = useSWR<DesignConversation[]>(
    // Only fetch when authenticated
    status === 'AUTHENTICATED' && user?.id ? ['all-comments', user.id] : null,
    fetchConversations,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  // Subscribe to new comments for realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('all-comments-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        () => {
          // Revalidate SWR cache when a new comment arrives
          mutate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase, mutate]);

  return {
    conversations: data ?? [],
    loading: isLoading,
    error: error ?? null,
    refresh: mutate,
  };
}
