import React, { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios";
import echo from "../../../services/echo";
import {
  Send,
  Search,
  MessageSquare,
  User,
  Clock,
  Volume2,
  VolumeX,
  Zap,
  Check,
  CheckCheck,
  Loader2,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SupportChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const messagesEndRef = useRef(null);
  const selectedConvoRef = useRef(null);

  // Quick reply templates
  const quickTemplates = [
    "Chào anh/chị, em có thể hỗ trợ gì cho mình ạ?",
    "Dạ, đơn hàng của mình hiện đã được bàn giao cho bên vận chuyển ạ.",
    "Bên em hiện đang có chương trình khuyến mãi giảm 10% cho đơn hàng đầu tiên ạ.",
    "Dạ, sản phẩm này bên em đang tạm hết hàng, anh/chị tham khảo mẫu tương tự nhé ạ.",
    "Dạ vâng, bên em sẽ xử lý hoàn tiền cho anh/chị ngay trong hôm nay ạ.",
  ];

  // Sound notification
  const playNotificationSound = useCallback(() => {
    if (isMuted) return;
    try {
      // Standard gentle notification sound using Web Audio API so we don't depend on external assets
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.4,
      );

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);

      // Play secondary note to make it sound premium (chime)
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain2.gain.setValueAtTime(0, audioCtx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + 0.5,
        );
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.5);
      }, 80);
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  }, [isMuted]);

  // Keep selectedConvo ref updated so WebSocket callbacks can see the latest value
  useEffect(() => {
    selectedConvoRef.current = selectedConvo;
  }, [selectedConvo]);

  // Fetch active conversations
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConvos(true);
    try {
      const response = await api.get("/support/conversations");
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Không thể tải danh sách cuộc trò chuyện!");
    } finally {
      if (!silent) setLoadingConvos(false);
    }
  };

  // Fetch messages for a specific conversation
  const fetchMessages = async (customerId) => {
    setLoadingMessages(true);
    try {
      const response = await api.get(
        `/support/conversations/${customerId}/messages`,
      );
      setMessages(response.data);

      // Update unread count for this customer in conversations list
      setConversations((prev) =>
        prev.map((c) =>
          c.customer.id === customerId ? { ...c, unread_count: 0 } : c,
        ),
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Không thể tải tin nhắn!");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle selected conversation change
  const handleSelectConvo = (convo) => {
    setSelectedConvo(convo);
    fetchMessages(convo.customer.id);
  };

  // Mark selected conversation as read
  const markConvoAsRead = async (customerId) => {
    try {
      await api.post(`/support/conversations/${customerId}/read`);
    } catch (e) {
      console.warn("Failed to mark messages as read:", e);
    }
  };

  // Real-time listener via Echo
  useEffect(() => {
    // Connect to Reverb/Pusher admin channel
    const channelName = "admin";

    console.log(`Subscribing to private channel: ${channelName}`);
    const channel = echo
      .private(channelName)
      .stopListening(".support.message.sent")
      .listen(".support.message.sent", (data) => {
        const incomingMsg = data.message;
        console.log("Received live support message:", incomingMsg);

        // If the message is from a customer
        const isFromCustomer =
          incomingMsg.sender_id === incomingMsg.customer_id;

        // If currently viewing this customer's chat room
        const isCurrentActive =
          selectedConvoRef.current &&
          selectedConvoRef.current.customer.id === incomingMsg.customer_id;

        if (isCurrentActive) {
          // Add message to chat area
          setMessages((prev) => {
            // Avoid duplicate messages
            if (prev.some((m) => m.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
          });

          if (isFromCustomer) {
            // Auto mark as read on the backend
            markConvoAsRead(incomingMsg.customer_id);
            playNotificationSound();
          }
        } else {
          // If not currently viewing, play notification sound for incoming customer messages
          if (isFromCustomer) {
            playNotificationSound();
            toast(`Tin nhắn mới từ ${incomingMsg.sender.name}`, {
              icon: "💬",
              duration: 3000,
            });
          }
        }

        // Silent reload of the conversation list to update snippets and unread badges
        fetchConversations(true);
      });

    return () => {
      console.log(`Leaving channel: ${channelName}`);
      echo.leaveChannel(channelName);
    };
  }, [playNotificationSound]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e, customText = null) => {
    e?.preventDefault();
    const textToSend = customText !== null ? customText : inputValue.trim();
    if (!textToSend || !selectedConvo || sending) return;

    if (customText === null) setInputValue("");
    setSending(true);

    try {
      const customerId = selectedConvo.customer.id;
      const response = await api.post(
        `/support/conversations/${customerId}/messages`,
        {
          message: textToSend,
        },
      );

      const sentMsg = response.data;
      setMessages((prev) => [...prev, sentMsg]);

      // Update last message in the local conversation list
      setConversations((prev) =>
        prev
          .map((c) =>
            c.customer.id === customerId
              ? {
                  ...c,
                  last_message: {
                    message: sentMsg.message,
                    sender_id: sentMsg.sender_id,
                    created_at: sentMsg.created_at,
                  },
                  last_message_at: sentMsg.created_at,
                }
              : c,
          )
          .sort(
            (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at),
          ),
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Gửi tin nhắn thất bại!");
    } finally {
      setSending(false);
    }
  };

  // Format message timestamp
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  // Search filter
  const filteredConvos = conversations.filter(
    (c) =>
      c.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 h-[calc(100vh-140px)] animate-in fade-in duration-500">
        {/* Header bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Tư vấn trực tuyến{" "}
              <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-500 mt-1 italic">
              Chat thời gian thực hỗ trợ và giải đáp thắc mắc của khách hàng.
            </p>
          </div>

          {/* Controls: Mute/Unmute */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-semibold transition-all ${
                isMuted
                  ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span>{isMuted ? "Tắt chuông" : "Bật chuông"}</span>
            </button>
            <button
              onClick={() => fetchConversations()}
              className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
            >
              Tải lại danh sách
            </button>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
          {/* Left panel: Conversations List */}
          <div className="w-[350px] bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-slate-50 relative">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50/80">
              {loadingConvos ? (
                [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                      <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : filteredConvos.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full">
                  <MessageSquare className="w-10 h-10 text-slate-200 mb-2" />
                  <p className="text-xs font-semibold">
                    Chưa có cuộc trò chuyện nào
                  </p>
                </div>
              ) : (
                filteredConvos.map((convo) => {
                  const isSelected =
                    selectedConvo &&
                    selectedConvo.customer.id === convo.customer.id;
                  const hasUnread = convo.unread_count > 0;
                  const isLastMsgAdmin =
                    convo.last_message &&
                    convo.last_message.sender_id !== convo.customer.id;

                  return (
                    <button
                      key={convo.customer.id}
                      onClick={() => handleSelectConvo(convo)}
                      className={`w-full text-left p-4 flex items-start gap-3 transition-all ${
                        isSelected
                          ? "bg-indigo-50/50 border-l-4 border-indigo-500 pl-3"
                          : "hover:bg-slate-50/70 border-l-4 border-transparent"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {convo.customer.avatar ? (
                          <img
                            src={convo.customer.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm uppercase">
                            {convo.customer.name.slice(0, 1)}
                          </div>
                        )}
                        {/* Live status dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4
                            className={`text-sm font-bold truncate ${hasUnread ? "text-slate-900" : "text-slate-700"}`}
                          >
                            {convo.customer.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {formatTime(convo.last_message_at)}
                          </span>
                        </div>
                        <p
                          className={`text-xs truncate ${hasUnread ? "text-indigo-600 font-extrabold" : "text-slate-400"}`}
                        >
                          {isLastMsgAdmin && (
                            <span className="font-semibold text-slate-500 mr-1">
                              Bạn:
                            </span>
                          )}
                          {convo.last_message?.message || "Không có nội dung"}
                        </p>
                      </div>

                      {/* Unread count badge */}
                      {hasUnread && (
                        <div className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shrink-0 animate-bounce">
                          {convo.unread_count}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Active Chat Area */}
          <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            {selectedConvo ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                  <div className="flex items-center gap-3">
                    {selectedConvo.customer.avatar ? (
                      <img
                        src={selectedConvo.customer.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm uppercase">
                        {selectedConvo.customer.name.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {selectedConvo.customer.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold">
                        {selectedConvo.customer.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Đang kết nối
                    </span>
                  </div>
                </div>

                {/* Message stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 scroll-smooth">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      <p className="text-xs text-slate-400 font-medium">
                        Đang tải lịch sử tin nhắn...
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                      <MessageSquare className="w-8 h-8 text-slate-200 mb-2" />
                      <p className="text-xs font-semibold">
                        Hãy gửi lời chào đầu tiên để hỗ trợ khách hàng!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`flex items-end gap-2 max-w-[70%] ${
                              isMe ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            {/* Avatar fallback */}
                            {!isMe && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase border border-indigo-100">
                                {selectedConvo.customer.name.slice(0, 1)}
                              </div>
                            )}

                            {/* Bubble */}
                            <div
                              className={`p-3 rounded-xl shadow-sm text-sm leading-relaxed ${
                                isMe
                                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-sm"
                                  : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                              }`}
                            >
                              <p className="font-semibold">{msg.message}</p>
                            </div>
                          </div>

                          {/* Timestamp and Double Check */}
                          <div
                            className={`flex items-center gap-1 mt-1 text-[9px] text-slate-400 font-medium ${isMe ? "mr-1" : "ml-10"}`}
                          >
                            <span>{formatTime(msg.created_at)}</span>
                            {isMe &&
                              (msg.is_read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-300" />
                              ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick replies toolbar */}
                <div className="px-4 py-2 border-t border-slate-50 bg-slate-50/10 flex items-center gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-indigo-600 shrink-0 text-xs font-extrabold uppercase mr-1">
                    <Zap className="w-3.5 h-3.5 fill-indigo-100" /> Trả lời
                    nhanh:
                  </div>
                  {quickTemplates.map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => handleSendMessage(e, tmpl)}
                      className="bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full transition-all shrink-0 cursor-pointer"
                    >
                      {tmpl.length > 30 ? tmpl.slice(0, 30) + "..." : tmpl}
                    </button>
                  ))}
                </div>

                {/* Input area */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-slate-100 bg-white flex items-center gap-3 flex-shrink-0"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Nhập phản hồi gửi đến ${selectedConvo.customer.name}...`}
                    disabled={sending}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || sending}
                    className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider flex items-center gap-2 hover:from-indigo-700 hover:to-blue-700 transition active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-indigo-500/10"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Gửi
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-center text-slate-400 h-full">
                <div className="bg-slate-50 p-6 rounded-full mb-4">
                  <MessageSquare className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-1">
                  Hộp thư hỗ trợ trực tuyến
                </h3>
                <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mx-auto font-medium">
                  Chọn một khách hàng trong danh sách bên trái để xem tin nhắn
                  và tư vấn thời gian thực.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hide Scrollbar Style */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </AdminLayout>
  );
}
