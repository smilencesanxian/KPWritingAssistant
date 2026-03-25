import { createClient } from '@/lib/supabase/server';
import type { WritingGuideNode, Highlight } from '@/types/database';

export interface WritingGuideNodeInput {
  id?: string;
  user_id: string;
  parent_id?: string | null;
  node_type: 'essay_type' | 'topic' | 'highlight';
  label: string;
  highlight_id?: string | null;
  source?: 'user' | 'system';
  sort_order?: number;
}

export interface WritingGuideNodeTree extends WritingGuideNode {
  children: WritingGuideNodeTree[];
  highlight?: {
    text: string;
    type: string;
  };
}

export async function getWritingGuideTree(userId: string): Promise<WritingGuideNodeTree[]> {
  const supabase = await createClient();

  // Fetch both user nodes and system nodes (user_id is null) with highlight details
  const { data, error } = await supabase
    .from('writing_guide_nodes')
    .select(`
      *,
      highlight:highlights_library!highlight_id(text, type)
    `)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get writing guide tree: ${error.message}`);
  }

  const nodes = (data ?? []) as (WritingGuideNode & { highlight?: { text: string; type: string } | null })[];

  // Build tree structure
  const nodeMap = new Map<string, WritingGuideNodeTree>();
  const rootNodes: WritingGuideNodeTree[] = [];

  // First pass: create map of all nodes
  for (const node of nodes) {
    nodeMap.set(node.id, {
      ...node,
      children: [],
      highlight: node.highlight ?? undefined,
    });
  }

  // Second pass: build parent-child relationships
  for (const node of nodes) {
    const treeNode = nodeMap.get(node.id)!;
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      const parent = nodeMap.get(node.parent_id)!;
      parent.children.push(treeNode);
    } else {
      // Root node
      rootNodes.push(treeNode);
    }
  }

  return rootNodes;
}

export async function upsertUserNode(
  node: WritingGuideNodeInput
): Promise<WritingGuideNode> {
  const supabase = await createClient();

  const nodeData = {
    user_id: node.user_id,
    parent_id: node.parent_id ?? null,
    node_type: node.node_type,
    label: node.label,
    highlight_id: node.highlight_id ?? null,
    source: node.source ?? 'user',
    sort_order: node.sort_order ?? 0,
  };

  if (node.id) {
    // Update existing node
    const { data, error } = await supabase
      .from('writing_guide_nodes')
      .update(nodeData)
      .eq('id', node.id)
      .eq('user_id', node.user_id) // Ensure user can only update their own nodes
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update writing guide node: ${error.message}`);
    }

    return data as WritingGuideNode;
  } else {
    // Create new node
    const { data, error } = await supabase
      .from('writing_guide_nodes')
      .insert(nodeData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create writing guide node: ${error.message}`);
    }

    return data as WritingGuideNode;
  }
}

export async function getUserPhrasesByTopic(
  userId: string,
  topicLabel: string
): Promise<Highlight[]> {
  const supabase = await createClient();

  // First, find the topic node
  const { data: topicNode, error: topicError } = await supabase
    .from('writing_guide_nodes')
    .select('id')
    .eq('user_id', userId)
    .eq('node_type', 'topic')
    .ilike('label', topicLabel)
    .maybeSingle();

  if (topicError) {
    throw new Error(`Failed to get topic node: ${topicError.message}`);
  }

  if (!topicNode) {
    return [];
  }

  // Get all highlight nodes under this topic
  const { data: highlightNodes, error: nodesError } = await supabase
    .from('writing_guide_nodes')
    .select('highlight_id')
    .eq('user_id', userId)
    .eq('parent_id', topicNode.id)
    .eq('node_type', 'highlight')
    .not('highlight_id', 'is', null);

  if (nodesError) {
    throw new Error(`Failed to get highlight nodes: ${nodesError.message}`);
  }

  const highlightIds = (highlightNodes ?? [])
    .map((n) => n.highlight_id)
    .filter((id): id is string => id !== null);

  if (highlightIds.length === 0) {
    return [];
  }

  // Get the actual highlights
  const { data: highlights, error: highlightsError } = await supabase
    .from('highlights_library')
    .select('*')
    .in('id', highlightIds)
    .eq('user_id', userId);

  if (highlightsError) {
    throw new Error(`Failed to get highlights: ${highlightsError.message}`);
  }

  return (highlights ?? []) as Highlight[];
}

/**
 * Sync writing guide from correction results
 * Creates topic node and attaches highlights under the appropriate essay type
 */
export async function syncWritingGuideFromCorrection(
  userId: string,
  essayTopic: string | null,
  highlightIds: string[]
): Promise<void> {
  if (!essayTopic || highlightIds.length === 0) {
    return;
  }

  const supabase = await createClient();

  // Determine essay type node parent based on topic keywords
  const topicLower = essayTopic.toLowerCase();
  let parentLabel: string;

  // Simple keyword matching to categorize
  if (topicLower.includes('email') || topicLower.includes('letter') || topicLower.includes('mail')) {
    parentLabel = '邮件 (Part 1)';
  } else {
    parentLabel = '文章 (Part 2)';
  }

  // Find or create the essay type node
  let { data: essayTypeNode } = await supabase
    .from('writing_guide_nodes')
    .select('id')
    .eq('user_id', userId)
    .eq('node_type', 'essay_type')
    .ilike('label', parentLabel)
    .maybeSingle();

  if (!essayTypeNode) {
    // Check for system essay type node
    const { data: systemEssayTypeNode } = await supabase
      .from('writing_guide_nodes')
      .select('id')
      .is('user_id', null)
      .eq('node_type', 'essay_type')
      .ilike('label', parentLabel)
      .maybeSingle();

    if (systemEssayTypeNode) {
      essayTypeNode = systemEssayTypeNode;
    } else {
      // Create user essay type node
      const { data: newNode } = await supabase
        .from('writing_guide_nodes')
        .insert({
          user_id: userId,
          parent_id: null,
          node_type: 'essay_type',
          label: parentLabel,
          source: 'user',
          sort_order: 0,
        })
        .select()
        .single();
      essayTypeNode = newNode;
    }
  }

  if (!essayTypeNode) {
    throw new Error('Failed to find or create essay type node');
  }

  // Find or create the topic node
  let { data: topicNode } = await supabase
    .from('writing_guide_nodes')
    .select('id')
    .eq('user_id', userId)
    .eq('node_type', 'topic')
    .eq('parent_id', essayTypeNode.id)
    .ilike('label', essayTopic)
    .maybeSingle();

  if (!topicNode) {
    const { data: newNode } = await supabase
      .from('writing_guide_nodes')
      .insert({
        user_id: userId,
        parent_id: essayTypeNode.id,
        node_type: 'topic',
        label: essayTopic,
        source: 'user',
        sort_order: 0,
      })
      .select()
      .single();
    topicNode = newNode;
  }

  if (!topicNode) {
    throw new Error('Failed to find or create topic node');
  }

  // Get existing highlight nodes under this topic to avoid duplicates
  const { data: existingHighlightNodes } = await supabase
    .from('writing_guide_nodes')
    .select('highlight_id')
    .eq('user_id', userId)
    .eq('parent_id', topicNode.id)
    .eq('node_type', 'highlight');

  const existingHighlightIds = new Set(
    (existingHighlightNodes ?? []).map((n) => n.highlight_id)
  );

  // Create highlight nodes for new highlights only
  const newHighlightIds = highlightIds.filter((id) => !existingHighlightIds.has(id));

  if (newHighlightIds.length > 0) {
    // Get highlight texts for labels
    const { data: highlights } = await supabase
      .from('highlights_library')
      .select('id, text')
      .in('id', newHighlightIds)
      .eq('user_id', userId);

    const highlightMap = new Map(
      (highlights ?? []).map((h) => [h.id, h.text])
    );

    const highlightNodes = newHighlightIds.map((highlightId, index) => ({
      user_id: userId,
      parent_id: topicNode!.id,
      node_type: 'highlight' as const,
      label: highlightMap.get(highlightId) ?? 'Highlight',
      highlight_id: highlightId,
      source: 'user' as const,
      sort_order: index,
    }));

    const { error } = await supabase
      .from('writing_guide_nodes')
      .insert(highlightNodes);

    if (error) {
      throw new Error(`Failed to create highlight nodes: ${error.message}`);
    }
  }
}

/**
 * Delete a user writing guide node and its children
 */
export async function deleteUserNode(nodeId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  // Verify ownership - can only delete user nodes, not system nodes
  const { data: existing } = await supabase
    .from('writing_guide_nodes')
    .select('user_id, source')
    .eq('id', nodeId)
    .single();

  if (!existing || existing.user_id !== userId) {
    throw new Error('Cannot delete node owned by another user or system node');
  }

  const { error } = await supabase
    .from('writing_guide_nodes')
    .delete()
    .eq('id', nodeId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete writing guide node: ${error.message}`);
  }
}
