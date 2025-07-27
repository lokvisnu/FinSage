"use client";

import React, { useState, useRef, useEffect } from "react";
import { theme, tw } from "@/styles/theme";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isFailback?: boolean;
};

// Component to render formatted AI responses
const FormattedMessage = ({
  content,
  isUser,
}: {
  content: string;
  isUser: boolean;
}) => {
  if (isUser) {
    return <p className="whitespace-pre-wrap text-white">{content}</p>;
  }

  // Custom components for markdown rendering
  const components = {
    // Headers
    h1: ({ children }: any) => (
      <h1 className="text-xl font-bold text-gray-900 mb-3 mt-4 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-semibold text-gray-800 mb-2 mt-3 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-base font-medium text-gray-800 mb-2 mt-2 first:mt-0">
        {children}
      </h3>
    ),

    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700 ml-2">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-700 ml-2">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="ml-1 leading-relaxed">{children}</li>
    ),

    // Paragraphs
    p: ({ children }: any) => (
      <p className="mb-3 text-gray-800 leading-relaxed last:mb-0">{children}</p>
    ),

    // Strong/Bold - Enhanced for financial terms
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900 bg-yellow-50 px-1 rounded">
        {children}
      </strong>
    ),

    // Emphasis/Italic
    em: ({ children }: any) => (
      <em className="italic text-gray-700">{children}</em>
    ),

    // Code blocks
    code: ({ children, className }: any) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-sm font-mono border">
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-3 border border-gray-200">
          <code className="text-sm font-mono text-gray-800">{children}</code>
        </pre>
      );
    },

    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-3">
        <table className="min-w-full border border-gray-200 rounded-lg bg-white shadow-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-purple-50">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-gray-200">{children}</tbody>
    ),
    tr: ({ children }: any) => <tr className="hover:bg-gray-50">{children}</tr>,
    th: ({ children }: any) => (
      <th className="px-3 py-2 text-left text-xs font-medium text-purple-700 uppercase tracking-wider border border-gray-200">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-3 py-2 text-sm text-gray-800 border border-gray-200">
        {children}
      </td>
    ),

    // Blockquotes - Enhanced for financial advice
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-purple-500 pl-4 py-2 mb-3 bg-purple-50 rounded-r-lg">
        <div className="flex items-start gap-2">
          <span className="text-purple-500 text-lg mt-1">💡</span>
          <div className="italic text-gray-700">{children}</div>
        </div>
      </blockquote>
    ),

    // Links
    a: ({ children, href }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-600 hover:text-purple-800 underline decoration-purple-300 hover:decoration-purple-500 transition-colors"
      >
        {children}
      </a>
    ),

    // Horizontal rule
    hr: () => <hr className="border-gray-300 my-4" />,
  };

  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I'm your AI Financial Advisor. I can help you with budget planning, expense analysis, investment recommendations, debt management strategies, and financial goal planning. What would you like to discuss today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputMessage.trim() }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to continue");
        } else if (response.status === 503) {
          throw new Error("AI service temporarily unavailable");
        } else {
          throw new Error("Failed to get AI response");
        }
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(data.timestamp),
        isFailback: data.isFailback,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError(error.message || "Failed to get AI response. Please try again.");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I apologize, but I'm experiencing technical difficulties: ${error.message}. Please try again in a moment.`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          AI Financial Advisor
        </h1>
        <p className="text-gray-600">
          Get personalized financial advice powered by AI based on your spending
          patterns and goals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <div
            className={`${tw.cardElegant} h-[calc(100vh-200px)] flex flex-col`}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: theme.gradients.elegantDark }}
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    FinanceAI Assistant
                  </h2>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    {isLoading ? "Typing..." : "Online"}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.isUser ? "justify-end" : ""
                    }`}
                  >
                    {!message.isUser && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: theme.gradients.elegantDark }}
                      >
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"
                          />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`max-w-lg p-4 rounded-2xl ${
                        message.isUser
                          ? "bg-gray-900 text-white rounded-br-sm"
                          : "bg-gray-50 text-gray-800 rounded-tl-sm"
                      }`}
                    >
                      <FormattedMessage
                        content={message.text}
                        isUser={message.isUser}
                      />
                      {message.isFailback && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                          Note: AI service temporarily unavailable, showing
                          basic financial summary.
                        </div>
                      )}
                      <div
                        className={`text-xs mt-2 ${
                          message.isUser ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    {message.isUser && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: theme.gradients.elegantDark }}
                    >
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"
                        />
                      </svg>
                    </div>
                    <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-4 max-w-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-gray-200">
              {error && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-600">{error}</div>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about your finances..."
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className={`${tw.button.primary} px-6 py-3 rounded-xl transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar with AI Insights */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className={`${tw.cardElegant} p-6`}>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() =>
                  handleQuickAction(
                    "Analyze my spending patterns and suggest areas for improvement"
                  )
                }
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                📊 Analyze my spending
              </button>
              <button
                onClick={() =>
                  handleQuickAction(
                    "Create a personalized budget plan based on my income and expenses"
                  )
                }
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                💰 Create a budget plan
              </button>
              <button
                onClick={() =>
                  handleQuickAction(
                    "Give me investment recommendations based on my financial situation"
                  )
                }
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                📈 Investment advice
              </button>
              <button
                onClick={() =>
                  handleQuickAction(
                    "Help me set realistic financial goals for the next year"
                  )
                }
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                🎯 Set financial goals
              </button>
              <button
                onClick={() =>
                  handleQuickAction(
                    "Suggest strategies to manage and reduce my debt effectively"
                  )
                }
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                💳 Debt management
              </button>
            </div>
          </div>

          {/* AI Insights */}
          <div className={`${tw.cardElegant} p-6`}>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI Insights
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-sm font-medium text-gray-900">
                  Personalized Analysis
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  Ask me to analyze your data for personalized insights
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-sm font-medium text-gray-900">
                  Smart Recommendations
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  Get AI-powered suggestions based on your financial patterns
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-sm font-medium text-gray-900">
                  Goal Tracking
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  Set and monitor your financial goals with AI guidance
                </div>
              </div>
            </div>
          </div>

          {/* Financial Health Score */}
          <div
            className={`${theme.gradients.dark} rounded-2xl shadow-lg p-6 text-white`}
            style={{}}
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Financial Health
            </h3>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">--</div>
              <div className="text-sm text-white/80">Score out of 100</div>
              <button
                onClick={() =>
                  handleQuickAction(
                    "Calculate my financial health score and explain what it means"
                  )
                }
                className="mt-4 text-xs bg-white/20 hover:bg-white/30 rounded-lg p-3 transition-colors w-full"
              >
                Get Your Health Score
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className={`${tw.cardElegant} p-6`}>
            <h3 className="font-semibold text-gray-900 mb-4">Pro Tips</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-gray-400">💡</span>
                <span>
                  Ask specific questions about your finances for better advice
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400">📊</span>
                <span>
                  The more data you add, the better my recommendations become
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400">🎯</span>
                <span>Set clear financial goals for personalized guidance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
