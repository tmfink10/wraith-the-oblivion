import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useSessionStore } from '../../stores/sessionStore';
import { ClientEvents } from '@wraith/shared';
import type { ChatMessageType, ChatMessage } from '@wraith/shared';

interface ChatLogProps {
  sessionId: string;
}

const messageTypeLabels: Record<ChatMessageType, string> = {
  ooc: 'OOC',
  narrative: 'Narrate',
  dice_roll: 'Roll',
  system: 'System',
  shadow_voice: 'Shadow',
};

export function ChatLog({ sessionId }: ChatLogProps) {
  const { emit } = useSocket();
  const { chatMessages, identity } = useSessionStore();
  const [input, setInput] = useState('');
  const [msgType, setMsgType] = useState<ChatMessageType>('ooc');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    emit(ClientEvents.SEND_CHAT, {
      sessionId,
      type: msgType,
      content: text,
    });

    setInput('');
  };

  return (
    <div className="flex flex-col h-full border border-wraith-800 rounded-lg bg-wraith-900/30 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-wraith-800 bg-wraith-900/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-wraith-300">
          Chat
        </h3>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0"
      >
        {chatMessages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} isOwn={msg.senderId === identity.clientId} />
        ))}
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-600 text-sm py-4 italic">
            No messages yet...
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-3 py-2 border-t border-wraith-800 bg-wraith-900/50">
        {/* Type selector */}
        <div className="flex gap-1 mb-2">
          {(['ooc', 'narrative', 'shadow_voice'] as ChatMessageType[]).map(
            (type) => (
              <button
                key={type}
                onClick={() => setMsgType(type)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  msgType === type
                    ? 'bg-wraith-600 text-white'
                    : 'bg-wraith-800 text-gray-500 hover:text-gray-300'
                }`}
              >
                {messageTypeLabels[type]}
              </button>
            ),
          )}
        </div>

        {/* Input + send */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              msgType === 'ooc'
                ? 'Type a message...'
                : msgType === 'narrative'
                  ? 'Describe what happens...'
                  : 'The Shadow whispers...'
            }
            className="flex-1 px-3 py-1.5 text-sm bg-wraith-800 border border-wraith-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-wraith-600"
          />
          <button
            onClick={handleSend}
            className="px-3 py-1.5 text-sm rounded bg-wraith-700 hover:bg-wraith-600 text-gray-300 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────

function ChatBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  const typeStyles: Record<string, string> = {
    ooc: 'text-gray-400',
    narrative: 'text-wraith-300 italic',
    dice_roll: 'text-amber-300',
    system: 'text-gray-500 text-center italic text-xs',
    shadow_voice: 'text-purple-400 italic',
  };

  const style = typeStyles[message.type] ?? 'text-gray-400';

  if (message.type === 'system') {
    return (
      <div className={`py-1 ${style}`}>{message.content}</div>
    );
  }

  return (
    <div className="py-0.5">
      <span
        className={`text-xs font-semibold ${
          isOwn ? 'text-wraith-400' : 'text-gray-500'
        }`}
      >
        {message.senderName}
        {message.type === 'shadow_voice' && (
          <span className="text-purple-500 ml-1">(Shadow)</span>
        )}
      </span>
      <div className={`text-sm break-words ${style}`}>
        {message.content}
      </div>

      {/* Dice roll details */}
      {message.diceRoll && (
        <div className="flex flex-wrap gap-1 mt-1">
          {message.diceRoll.dice.map((die, i) => (
            <span
              key={i}
              className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                die >= message.diceRoll!.difficulty
                  ? 'bg-green-900/50 text-green-300 border border-green-700/50'
                  : die === 1
                    ? 'bg-red-900/50 text-red-300 border border-red-700/50'
                    : 'bg-wraith-800 text-gray-500 border border-wraith-700'
              }`}
            >
              {die}
            </span>
          ))}
          <span className="text-xs text-gray-500 self-center ml-1">
            = {message.diceRoll.successes} success
            {message.diceRoll.successes !== 1 ? 'es' : ''}
            {message.diceRoll.isBotch && (
              <span className="text-red-400 font-bold ml-1">BOTCH!</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
