import { axiosClient, resolveApiBaseUrl } from '../utils/axiosClient';
import type { ApiResponse } from '../types/api.types';

export interface SendAiMessageCommand {
  conversationId?: string;
  message: string;
}

export interface AiResponseDto {
  conversationId: string;
  response: string;
  actionCards?: string[];
  referencedDocuments?: string[];
}

export const aiService = {
  sendMessage: async (command: SendAiMessageCommand): Promise<AiResponseDto> => {
    // Backend AIController expects { conversationId, message }
    const res = await axiosClient.post<any>('/AI/chat', command);
    const data = res.data?.data || res.data;
    return {
      conversationId: data.conversationId,
      response: data.response || data.message || data.aiMessage || 'AI đã xử lý xong yêu cầu.',
      actionCards: data.actionCards || [],
      referencedDocuments: data.referencedDocuments || [],
    };
  },

  sendMessageStream: async function* (command: SendAiMessageCommand): AsyncGenerator<string | { type: 'conversationId', id: string }, void, unknown> {
    const token = localStorage.getItem('token');
    const API_BASE_URL = resolveApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/AI/chat-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(command)
    });

    if (!response.body) throw new Error('ReadableStream not supported in this browser.');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // SSE lines are separated by \n\n
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; // Keep the incomplete part in the buffer
        
        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const dataStr = part.substring(6); // remove 'data: '
            try {
              const dataObj = JSON.parse(dataStr);
              if (dataObj.content) {
                const chunk = dataObj.content;
                if (chunk.startsWith('[CONVERSATION_ID:') && chunk.endsWith(']\n')) {
                   const id = chunk.replace('[CONVERSATION_ID:', '').replace(']\n', '');
                   yield { type: 'conversationId', id };
                } else {
                   yield chunk;
                }
              }
            } catch (e) {
               // ignore parse errors for partial chunks if any
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  ingestDocument: async (title: string, content: string, category: string): Promise<void> => {
    await axiosClient.post('/AI/ingest', { title, content, sourceType: category, category });
  },

  getConversations: async (): Promise<any[]> => {
    const res = await axiosClient.get<any>('/AI/conversations');
    return res.data?.data || res.data || [];
  },

  getConversationDetail: async (id: string): Promise<any[]> => {
    const res = await axiosClient.get<any>(`/AI/conversations/${id}`);
    return res.data?.data || res.data || [];
  },
};
