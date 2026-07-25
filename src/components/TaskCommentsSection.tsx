'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface TaskCommentsSectionProps {
  taskId: string;
}

export default function TaskCommentsSection({ taskId }: TaskCommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mention Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<TeamMember[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [insertedMentions, setInsertedMentions] = useState<{ id: string; name: string }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fetch comments and team members
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [commentsRes, membersRes] = await Promise.all([
          fetch(`/api/tasks/${taskId}/comments`),
          fetch('/api/team/members'),
        ]);

        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setComments(data.comments || []);
        }
        if (membersRes.ok) {
          const data = await membersRes.json();
          setTeamMembers(data.members || []);
        }
      } catch (err) {
        console.error('Failed to load data', err);
        setError('Failed to load comments/members. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId]);

  // Scroll to bottom when comments are fetched or updated
  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  // Handle textarea change & check for "@" mentions
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const caretPos = e.target.selectionStart;
    const textBeforeCaret = val.slice(0, caretPos);
    const lastAt = textBeforeCaret.lastIndexOf('@');

    if (lastAt !== -1) {
      const charBeforeAt = lastAt === 0 ? '' : textBeforeCaret[lastAt - 1];
      // Must be at start or preceded by space/newline
      if (charBeforeAt === '' || /\s/.test(charBeforeAt)) {
        const query = textBeforeCaret.slice(lastAt + 1);
        // Suggestions are active as long as there is no space in the search query
        if (!/\s/.test(query)) {
          setMentionTriggerIndex(lastAt);
          setMentionSearchQuery(query);

          // Filter members
          const filtered = teamMembers.filter((m) =>
            m.name.toLowerCase().includes(query.toLowerCase())
          );
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
          setActiveSuggestionIndex(0);
          return;
        }
      }
    }

    setShowSuggestions(false);
  };

  // Select a suggestion
  const selectSuggestion = (member: TeamMember) => {
    if (mentionTriggerIndex === -1 || !textareaRef.current) return;

    const val = content;
    const caretPos = textareaRef.current.selectionStart;

    // Replace @query with @name
    const beforeMention = val.slice(0, mentionTriggerIndex);
    const afterMention = val.slice(caretPos);
    const mentionText = `@${member.name} `;
    const newContent = beforeMention + mentionText + afterMention;

    setContent(newContent);
    setInsertedMentions((prev) => [...prev, { id: member.id, name: member.name }]);
    setShowSuggestions(false);

    // Focus back & set selection range after the inserted space
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = mentionTriggerIndex + mentionText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // Handle keyboard navigation inside autocomplete suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectSuggestion(suggestions[activeSuggestionIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    }
  };

  // Submit comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = content.trim();

    if (!trimmed) {
      setError('Comment cannot be empty.');
      return;
    }

    setSubmitLoading(true);
    setError(null);

    // Derive mentionedUserIds by matching occurrences of active mentions in the text
    const mentionedUserIds: string[] = [];
    insertedMentions.forEach((m) => {
      if (content.includes(`@${m.name}`)) {
        mentionedUserIds.push(m.id);
      }
    });
    const uniqueMentionIds = Array.from(new Set(mentionedUserIds));

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          mentionedUserIds: uniqueMentionIds,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit comment');
      }

      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setContent('');
      setInsertedMentions([]);

      // Force page state update
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col shadow-xl overflow-hidden mt-6">
      <div className="flex items-center p-5 border-b border-slate-200 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          Comments & Feedback
        </h2>
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="mx-5 mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Existing Comments List */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 max-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <p className="text-sm">No comments yet. Be the first to start the discussion!</p>
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {c.author.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {dayjs(c.createdAt).format('MM/DD/YYYY h:mm A')}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {c.content}
              </p>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment Composer Footer */}
      <form onSubmit={handleSubmit} className="p-5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50">
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={3}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment… Type @ to mention members."
            disabled={submitLoading}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none transition duration-200 resize-none disabled:opacity-50"
          />

          {/* Suggestions list */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute bottom-full left-0 z-50 mb-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-y-auto max-h-40 divide-y divide-slate-200 dark:divide-slate-800"
            >
              {suggestions.map((m, index) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    selectSuggestion(m);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition ${
                    index === activeSuggestionIndex
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{m.name}</span>
                  <span className={`text-[10px] ${index === activeSuggestionIndex ? 'text-white/80' : 'text-slate-500'}`}>
                    {m.email}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 mt-3">
          <span className="text-[10px] text-slate-600">
            Type <kbd className="text-slate-500 font-mono">@</kbd> to mention workspace members.
          </span>
          <button
            type="submit"
            disabled={submitLoading || !content.trim()}
            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-indigo-600/50 disabled:to-indigo-600/50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition duration-200 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-indigo-500/10 min-w-[80px]"
          >
            {submitLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
