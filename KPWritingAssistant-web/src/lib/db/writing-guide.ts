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
}

export async function getWritingGuideTree(userId: string): Promise<WritingGuideNodeTree[]> {
  const supabase = await createClient();

  // Fetch both user nodes and system nodes (user_id is null)
  const { data, error } = await supabase
    .from('writing_guide_nodes')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get writing guide tree: ${error.message}`);
  }

  const nodes = (data ?? []) as WritingGuideNode[];

  // Build tree structure
  const nodeMap = new Map<string, WritingGuideNodeTree>();
  const rootNodes: WritingGuideNodeTree[] = [];

  // First pass: create map of all nodes
  for (const node of nodes) {
    nodeMap.set(node.id, {
      ...node,
      children: [],
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
