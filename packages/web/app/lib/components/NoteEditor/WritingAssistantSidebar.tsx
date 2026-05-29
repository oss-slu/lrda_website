import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Send, AlertCircle, Loader } from 'lucide-react';
import { writingAssistantService, type WritingAssistantMessage } from '@/app/lib/services';
import { toast } from 'sonner';

interface WritingAssistantSidebarProps {
  noteTitle: string;
  noteContent: string;
  isOpen: boolean;
}

export function WritingAssistantSidebarPanel({
  noteTitle,
  noteContent,
  isOpen,
}: WritingAssistantSidebarProps) {
  const [messages, setMessages] = useState<WritingAssistantMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: WritingAssistantMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setError(null);
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(-20).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const assistantResponse = await writingAssistantService.getWritingAssistance({
        userQuery: userMessage.content,
        noteContent,
        noteTitle,
        conversationHistory,
      });

      const assistantMessage: WritingAssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get writing assistance';
      setError(errorMessage);
      toast('Error', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div
      className={`shrink-0 overflow-hidden border-l border-gray-200 transition-[width] duration-200 ease-in-out ${
        isOpen ? 'w-[340px]' : 'w-0 border-l-0'
      }`}
    >
      <div className='flex h-full w-[340px] flex-col bg-white'>
        {/* Header */}
        <div className='shrink-0 border-b border-gray-200 px-4 py-3'>
          <h3 className='text-sm font-semibold text-gray-900'>Ethnographer Professor</h3>
          <p className='mt-1 text-xs text-gray-500'>Expert mentorship on your fieldwork</p>
        </div>

        {/* Messages area */}
        <ScrollArea className='flex-1 px-4 py-3'>
          <div className='space-y-4 pr-4'>
            {messages.length === 0 && !error && (
              <div className='text-center'>
                <p className='text-xs text-gray-500'>
                  Ask your ethnographer professor about your fieldwork. Get expert mentorship on
                  methodology, ethics, and ethnographic analysis.
                </p>
                <div className='mt-3 space-y-2 text-xs text-gray-400'>
                  <p className='font-medium'>Try asking:</p>
                  <ul className='space-y-1 text-left'>
                    <li>- Is this observation detailed enough?</li>
                    <li>- What did I miss in this observation?</li>
                    <li>- How can I be more reflexive here?</li>
                    <li>- What themes do you see?</li>
                    <li>- What follow-up questions should I ask?</li>
                  </ul>
                </div>
              </div>
            )}

            {error && (
              <div className='flex items-start gap-2 rounded-md bg-red-50 p-3'>
                <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-red-600' />
                <div>
                  <p className='text-xs font-medium text-red-900'>Error</p>
                  <p className='text-xs text-red-700'>{error}</p>
                </div>
              </div>
            )}

            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user' ?
                      'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className='whitespace-pre-wrap'>{message.content}</p>
                  <span className='text-xs opacity-60'>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className='flex gap-3'>
                <div className='flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2'>
                  <Loader className='h-4 w-4 animate-spin text-gray-600' />
                  <span className='text-sm text-gray-600'>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className='shrink-0 border-t border-gray-200 p-3'>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className='mb-2 w-full text-xs text-gray-500 transition-colors hover:text-gray-700'
            >
              Clear history
            </button>
          )}
          <div className='flex gap-2'>
            <input
              type='text'
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ask a question...'
              disabled={isLoading}
              className='flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500'
            />
            <Button
              size='sm'
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className='shrink-0'
              title='Send message (Enter)'
            >
              <Send className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
