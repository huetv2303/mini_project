import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import axios from "axios";

// Nếu bạn đã cấu hình axios instance trong api, hãy đổi import này
const apiClient = axios.create({
  baseURL: "http://localhost:8080/api/v1", // Đổi URL backend tùy cấu hình (8080 là port nginx docker)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Thêm interceptor để đính token nếu user đã login
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Giả định bạn lưu token ở localstorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      content:
        "Xin chào! Em là trợ lý ảo của Trendora . Anh/chị cần tư vấn size, phối đồ hay tìm sản phẩm ạ?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const messagesEndRef = useRef(null);

  // Sinh session_id cho guest nếu chưa có
  useEffect(() => {
    let sid = localStorage.getItem("chat_session_id");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("chat_session_id", sid);
    }
    setSessionId(sid);
  }, []);

  // Tự động scroll xuống cuối
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Handle gửi tin nhắn
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setIsLoading(true);

    try {
      const response = await apiClient.post("/chat", {
        message: userText,
        session_id: sessionId,
        current_path: window.location.pathname, // Gửi đường dẫn hiện tại để server nhận diện role
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: response.data.reply,
          suggestions: response.data.suggestions || [],
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content:
            "Xin lỗi, hệ thống đang bận. Anh/chị vui lòng thử lại sau nhé! ",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format link markdown thành link thật
  const formatMessage = (text) => {
    if (!text) return null;

    // Tìm các cụm [Tên sản phẩm](/products/abc)
    const parts = text.split(/(\[.*?\]\(.*?\))/g);

    return parts.map((part, index) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a
            key={index}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 font-semibold hover:underline bg-green-50 px-1 rounded inline-flex items-center gap-1"
          >
            <ShoppingBag size={14} />
            {match[1]}
          </a>
        );
      }

      // Xử lý text in đậm **text**
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((bp, idx) => {
        if (bp.startsWith("**") && bp.endsWith("**")) {
          return <strong key={idx}>{bp.slice(2, -2)}</strong>;
        }
        // Thay \n bằng <br />
        return (
          <span key={idx}>
            {bp.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i !== bp.split("\n").length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      });
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Nút bật/tắt chatbot */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100 hover:scale-110"
        } transition-all duration-300 absolute bottom-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center`}
      >
        <MessageCircle size={28} />
        {/* Nút nhấp nháy thu hút sự chú ý */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
        </span>
      </button>

      {/* Cửa sổ Chatbot */}
      <div
        className={`${
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-10 pointer-events-none"
        } transition-all duration-300 origin-bottom-right absolute bottom-0 right-0 w-[380px] max-w-[calc(100vw-32px)] h-[600px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col border border-gray-100`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4 flex items-center justify-between shadow-md relative overflow-hidden">
          {/* Hiệu ứng tia sáng chéo (Glass/Shine effect) */}
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 skew-x-12 -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite]"></div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-white p-2 rounded-full relative">
              <Bot size={24} className="text-green-600" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-1">
                Trendora AI <Sparkles size={14} className="text-yellow-300" />
              </h3>
              <p className="text-green-100 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                Luôn sẵn sàng hỗ trợ
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-lg transition-colors relative z-10"
          >
            <X size={24} />
          </button>
        </div>

        {/* Nội dung chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`flex items-end gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm
                  ${msg.role === "user" ? "bg-gray-200" : "bg-green-100"}`}
                >
                  {msg.role === "user" ? (
                    <User size={16} className="text-gray-600" />
                  ) : (
                    <Bot size={16} className="text-green-600" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`p-3 rounded-2xl shadow-sm text-[15px] leading-relaxed
                  ${
                    msg.role === "user"
                      ? "bg-green-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  {formatMessage(msg.content)}
                </div>
              </div>

              {/* Product Suggestions (Carousel thu nhỏ) */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-3 ml-10 flex gap-3 overflow-x-auto pb-2 w-full max-w-[280px] snap-x hide-scrollbar">
                  {msg.suggestions.map((prod) => (
                    <a
                      key={prod.id}
                      href={prod.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="snap-start flex-shrink-0 w-[140px] bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="h-[140px] bg-gray-100 overflow-hidden">
                        {prod.feature_image ? (
                          <img
                            src={`http://localhost:8000/storage/${prod.feature_image}`}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-100">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <h4 className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-green-600">
                          {prod.name}
                        </h4>
                        <p className="text-green-600 text-sm font-bold mt-1">
                          {prod.price}đ
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-end gap-2 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Bot size={16} className="text-green-600" />
              </div>
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                <span
                  className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Khung nhập tin nhắn */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-gray-100"
        >
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-green-400 focus-within:ring-1 focus-within:ring-green-400 focus-within:bg-white transition-all">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Hỏi tôi bất cứ điều gì..."
              className="flex-1 bg-transparent px-4 py-2 outline-none text-[15px] placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-green-600 text-white p-2.5 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600 transition-colors flex items-center justify-center shrink-0"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} className="ml-0.5" />
              )}
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-gray-400">
              Trí tuệ nhân tạo có thể nhầm lẫn. Hãy kiểm tra lại nhé!
            </p>
          </div>
        </form>
      </div>

      {/* CSS ẩn thanh cuộn cho phần suggestions */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </div>
  );
}
