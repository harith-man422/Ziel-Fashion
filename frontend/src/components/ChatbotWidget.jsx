import React, { useContext, useState } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';

const ChatbotWidget = () => {
  const { backendUrl } = useContext(ShopContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi! I can help you find clothing products and answer basic shopping questions.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/product/chatbot`, {
        message: trimmed,
      });

      if (response.data.success) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: response.data.answer || 'I can help with that.' },
        ]);
        setRecommendations(response.data.products || []);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: response.data.message || 'Something went wrong.' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'I am currently unavailable. Please try again in a moment.' },
      ]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 w-[340px] max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 bg-black px-4 py-3 text-white">
            <span className="font-medium">Shopping Assistant</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-lg font-semibold"
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          <div className="max-h-[360px] space-y-3 overflow-y-auto bg-gray-50 p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                  message.sender === 'user'
                    ? 'ml-auto bg-black text-white'
                    : 'bg-white text-gray-700 ring-1 ring-gray-200'
                }`}
              >
                {message.text}
              </div>
            ))}

            {recommendations.length > 0 && (
              <div className="space-y-2 rounded-xl bg-white p-2 ring-1 ring-gray-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Recommended products
                </p>
                {recommendations.map((product) => (
                  <Link
                    key={product._id || product.id}
                    to={`/product/${product._id || product.id}`}
                    className="block rounded-lg border border-gray-200 p-2 text-sm text-gray-700 transition hover:border-black"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.category}</div>
                    <div className="mt-1 font-medium text-black">Rs {product.price}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-gray-200 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMessage();
              }}
              placeholder="Ask about products..."
              className="flex-1 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-xl text-white shadow-lg transition hover:scale-105"
        aria-label="Open chatbot"
      >
        💬
      </button>
    </div>
  );
};

export default ChatbotWidget;
