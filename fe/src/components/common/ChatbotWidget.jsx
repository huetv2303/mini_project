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
  Headphones,
  LogIn,
  Check,
  CheckCheck,
} from "lucide-react";
import apiClient from "../../api/axios";
import echo from "../../services/echo";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function ChatbotWidget() {
  const { isAuthenticated, user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState("ai"); // "ai" or "human"

  // Các state phục vụ di chuyển box chat (Draggable)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    // Chỉ kéo bằng chuột trái
    if (e.button !== 0) return;
    // Bỏ qua nếu nhấn vào nút bấm, link hoặc input để giữ nguyên hành vi click mặc định
    if (
      e.target.closest("button") ||
      e.target.closest("a") ||
      e.target.closest("input")
    )
      return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    if (
      e.target.closest("button") ||
      e.target.closest("a") ||
      e.target.closest("input")
    )
      return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, dragStart]);

  // AI Chat Messages
  const [aiMessages, setAiMessages] = useState([
    {
      role: "model",
      content:
        "Xin chào! Em là trợ lý ảo của Trendora. Anh/chị cần tư vấn size, phối đồ hay tìm sản phẩm ạ?",
    },
  ]);
  const [aiInputValue, setAiInputValue] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  // Human Consultant Messages
  const [humanMessages, setHumanMessages] = useState([]);
  const [humanInputValue, setHumanInputValue] = useState("");
  const [isHumanLoading, setIsHumanLoading] = useState(false);
  const [isSendingHuman, setIsSendingHuman] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);

  // Sinh session_id cho guest chatbot nếu chưa có
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
    if (isOpen) {
      scrollToBottom();
    }
  }, [aiMessages, humanMessages, isOpen, chatMode]);

  // Fetch initial support messages & count unread once authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUnreadCount(0);
      return;
    }

    const fetchInitialUnread = async () => {
      setIsHumanLoading(true);
      try {
        const response = await apiClient.get("/support/messages");
        const history = response.data;
        setHumanMessages(history);

        // Đếm tin nhắn chưa đọc từ phía admin
        const unread = history.filter(
          (m) => !m.is_read && m.sender_id !== user.id,
        ).length;
        setUnreadCount(unread);
      } catch (error) {
        console.warn("Failed to load initial support messages:", error);
      } finally {
        setIsHumanLoading(false);
      }
    };

    fetchInitialUnread();
  }, [isAuthenticated, user]);

  // Đánh dấu đã đọc khi khách hàng mở tab Tư vấn viên
  useEffect(() => {
    if (isOpen && chatMode === "human" && isAuthenticated && user) {
      setUnreadCount(0);
      apiClient
        .post(`/support/conversations/${user.id}/read`)
        .catch(console.error);
    }
  }, [isOpen, chatMode, isAuthenticated, user]);

  // Lắng nghe realtime tin nhắn từ admin trên private channel của user
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channelName = `user.${user.id}`;
    console.log(`Customer subscribing globally to channel: ${channelName}`);

    const channel = echo
      .private(channelName)
      .stopListening(".support.message.sent")
      .listen(".support.message.sent", (data) => {
        const incomingMsg = data.message;
        console.log("Customer received global support message:", incomingMsg);

        // Kiểm tra xem tin nhắn có phải từ admin gửi không
        const isFromAdmin = incomingMsg.sender_id !== user.id;

        // Thêm tin nhắn nếu không bị trùng
        setHumanMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });

        if (isFromAdmin) {
          // Nếu đang mở khu chat và đang xem tab tư vấn viên
          if (isOpen && chatMode === "human") {
            apiClient
              .post(`/support/conversations/${user.id}/read`)
              .catch(console.error);
          } else {
            // Tăng số tin chưa đọc lên 1
            setUnreadCount((prev) => prev + 1);

            // Phát âm thanh chime thông báo
            try {
              const audioCtx = new (
                window.AudioContext || window.webkitAudioContext
              )();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = "sine";
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              gain.gain.setValueAtTime(0, audioCtx.currentTime);
              gain.gain.linearRampToValueAtTime(
                0.15,
                audioCtx.currentTime + 0.05,
              );
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                audioCtx.currentTime + 0.4,
              );
              osc.start(audioCtx.currentTime);
              osc.stop(audioCtx.currentTime + 0.4);

              setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.type = "sine";
                osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
                gain2.gain.setValueAtTime(0, audioCtx.currentTime);
                gain2.gain.linearRampToValueAtTime(
                  0.15,
                  audioCtx.currentTime + 0.05,
                );
                gain2.gain.exponentialRampToValueAtTime(
                  0.001,
                  audioCtx.currentTime + 0.5,
                );
                osc2.start(audioCtx.currentTime);
                osc2.stop(audioCtx.currentTime + 0.5);
              }, 80);
            } catch (e) {}

            // Hiển thị toast thông báo nổi tiếng Việt đẹp mắt
            toast.success(
              <div
                onClick={() => {
                  setIsOpen(true);
                  setChatMode("human");
                }}
                className="cursor-pointer"
              >
                <strong>Tư vấn viên Trendora đã trả lời:</strong>
                <p className="text-xs truncate">{incomingMsg.message}</p>
              </div>,
              {
                duration: 4000,
                icon: "💬",
              },
            );
          }
        }
      });

    return () => {
      console.log(`Customer leaving global channel: ${channelName}`);
      echo.leaveChannel(channelName);
    };
  }, [isAuthenticated, user, isOpen, chatMode]);

  // Handle gửi tin nhắn AI
  const handleSendAiMessage = async (e) => {
    e?.preventDefault();
    if (!aiInputValue.trim() || isAiLoading) return;

    const userText = aiInputValue.trim();
    setAiInputValue("");
    setAiMessages((prev) => [...prev, { role: "user", content: userText }]);
    setIsAiLoading(true);

    try {
      const response = await apiClient.post("/chat", {
        message: userText,
        session_id: sessionId,
        current_path: window.location.pathname,
      });

      setAiMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: response.data.reply,
          suggestions: response.data.suggestions || [],
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setAiMessages((prev) => [
        ...prev,
        {
          role: "model",
          content:
            "Xin lỗi, hệ thống đang bận. Anh/chị vui lòng thử lại sau nhé! 💚",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle gửi tin nhắn Human Consultant
  const handleSendHumanMessage = async (e) => {
    e?.preventDefault();
    if (!humanInputValue.trim() || isSendingHuman || !isAuthenticated) return;

    const userText = humanInputValue.trim();
    setHumanInputValue("");
    setIsSendingHuman(true);

    try {
      const response = await apiClient.post("/support/messages", {
        message: userText,
      });

      const newMsg = response.data;
      setHumanMessages((prev) => [...prev, newMsg]);
    } catch (error) {
      console.error("Support chat error:", error);
    } finally {
      setIsSendingHuman(false);
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
        {/* Nút nhấp nháy hiển thị số tin nhắn chưa đọc động */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 border-2 border-white text-[10px] font-extrabold text-white items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Cửa sổ Chatbot */}
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging
            ? "none"
            : "transform 0.15s ease, scale 0.3s ease, opacity 0.3s ease, translate 0.3s ease",
        }}
        className={`${
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-10 pointer-events-none"
        } origin-bottom-right absolute bottom-0 right-0 w-[380px] max-w-[calc(100vw-32px)] h-[600px] max-h-[calc(100vh-100px)] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col border border-gray-100`}
      >
        {/* Header */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`bg-gradient-to-r from-green-600 to-emerald-500 p-3 shadow-md relative overflow-hidden flex-shrink-0 cursor-grab ${
            isDragging ? "cursor-grabbing select-none" : ""
          }`}
        >
          <div className="flex items-center justify-between relative z-10 mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1.5 rounded-full relative">
                {chatMode === "ai" ? (
                  <Bot size={20} className="text-green-600 animate-pulse" />
                ) : (
                  <Headphones size={20} className="text-emerald-600" />
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-1">
                  Trendora Support{" "}
                  <Sparkles size={12} className="text-yellow-300" />
                </h3>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-black/10 p-0.5 rounded-xl border border-white/5 relative z-10">
            <button
              onClick={() => setChatMode("ai")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chatMode === "ai"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
            >
              <Bot size={14} /> AI Trợ Lý
            </button>
            <button
              onClick={() => setChatMode("human")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chatMode === "human"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
            >
              <Headphones size={14} /> Tư Vấn Viên
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            </button>
          </div>
        </div>

        {/* Nội dung chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth">
          {chatMode === "ai" ? (
            /* AI CHATBOT MODE */
            <>
              {aiMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[85%] ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                        msg.role === "user" ? "bg-gray-200" : "bg-green-100"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User size={16} className="text-gray-600" />
                      ) : (
                        <Bot size={16} className="text-green-600" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`p-3 rounded-xl shadow-sm text-sm leading-relaxed ${
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
                                src={`${import.meta.env.VITE_URL_IMAGE}/${prod.feature_image}`}
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

              {/* AI Typing Indicator */}
              {isAiLoading && (
                <div className="flex items-end gap-2 max-w-[85%] animate-pulse">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Bot size={16} className="text-green-600 animate-spin" />
                  </div>
                  <div className="bg-white border border-gray-100 p-4 rounded-xl rounded-bl-sm shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* REAL-TIME HUMAN SUPPORT MODE */
            <>
              {!isAuthenticated ? (
                /* GUEST LOGIN PROMPT */
                <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center my-auto animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-emerald-50 p-4 rounded-full text-emerald-600 mb-4 shadow-inner">
                    <Headphones size={40} className="animate-bounce" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-base mb-2">
                    Đăng nhập để gặp Tư Vấn Viên
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-6 font-medium">
                    Nhằm nâng cao chất lượng tư vấn và theo dõi đơn hàng dễ
                    dàng, vui lòng đăng nhập tài khoản của bạn.
                  </p>
                  <button
                    onClick={() => {
                      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition duration-200 active:scale-95 shadow-md shadow-green-500/10 flex items-center justify-center gap-2 text-sm"
                  >
                    <LogIn size={16} /> Đăng nhập ngay
                  </button>
                </div>
              ) : (
                /* LIVE MESSAGE STREAM */
                <>
                  {isHumanLoading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 gap-2">
                      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                      <p className="text-xs text-gray-400 font-medium">
                        Đang kết nối...
                      </p>
                    </div>
                  ) : humanMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 my-auto">
                      <Headphones className="w-12 h-12 text-gray-200 mb-2" />
                      <p className="text-xs font-semibold">
                        Chưa có tin nhắn hỗ trợ
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
                        Gửi lời chào đầu tiên để đội ngũ tư vấn hỗ trợ nhé!
                      </p>
                    </div>
                  ) : (
                    humanMessages.map((msg) => {
                      const isMe = msg.sender_id === user.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`flex items-end gap-2 max-w-[85%] ${
                              isMe ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            {/* Avatar */}
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                                isMe
                                  ? "bg-green-600 text-white"
                                  : "bg-emerald-50 text-emerald-600"
                              }`}
                            >
                              {isMe ? (
                                <User size={16} />
                              ) : (
                                <Headphones size={16} />
                              )}
                            </div>

                            {/* Bubble */}
                            <div
                              className={`p-3 rounded-xl shadow-sm text-sm leading-relaxed ${
                                isMe
                                  ? "bg-green-600 text-white rounded-br-sm"
                                  : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                              }`}
                            >
                              <p className="font-semibold">{msg.message}</p>
                            </div>
                          </div>

                          {/* Timestamp and ticks */}
                          <div
                            className={`flex items-center gap-0.5 text-[9px] text-gray-400 font-semibold mt-1 ${isMe ? "mr-1" : "ml-10"}`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                            {isMe &&
                              (msg.is_read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-gray-300" />
                              ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Khung nhập tin nhắn */}
        <form
          onSubmit={
            chatMode === "ai" ? handleSendAiMessage : handleSendHumanMessage
          }
          className="p-3 bg-white border-t border-gray-100 flex-shrink-0"
        >
          {chatMode === "ai" || isAuthenticated ? (
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-green-400 focus-within:ring-1 focus-within:ring-green-400 focus-within:bg-white transition-all">
              <input
                type="text"
                value={chatMode === "ai" ? aiInputValue : humanInputValue}
                onChange={(e) =>
                  chatMode === "ai"
                    ? setAiInputValue(e.target.value)
                    : setHumanInputValue(e.target.value)
                }
                placeholder={
                  chatMode === "ai"
                    ? "Hỏi Trendora AI..."
                    : "Chat với tư vấn viên..."
                }
                className="flex-1 bg-transparent px-4 py-2 outline-none text-[15px] placeholder-gray-400 font-semibold text-slate-800"
                disabled={chatMode === "ai" ? isAiLoading : isSendingHuman}
              />
              <button
                type="submit"
                disabled={
                  chatMode === "ai"
                    ? !aiInputValue.trim() || isAiLoading
                    : !humanInputValue.trim() || isSendingHuman
                }
                className="bg-green-600 text-white p-2.5 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              >
                {chatMode === "ai" && isAiLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : chatMode === "human" && isSendingHuman ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} className="ml-0.5" />
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-gray-400 font-medium">
                Vui lòng đăng nhập để gửi tin nhắn
              </p>
            </div>
          )}

          <div className="text-center mt-2 flex justify-center items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
            <p className="text-[10px] text-gray-400 font-semibold">
              Trendora hỗ trợ tư vấn 24/7 trực tuyến
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
