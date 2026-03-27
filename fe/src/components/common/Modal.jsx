import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Generic Modal Component
 *
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Function to call when closing
 * @param {string} title - Modal heading
 * @param {React.ReactNode} children - Main content
 * @param {React.ReactNode} footer - Optional footer content (buttons, etc)
 * @param {string} size - size variant: 'sm', 'md', 'lg', 'xl', 'full'
 * @param {boolean} closeOnOutsideClick - close when clicking the backdrop
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnOutsideClick = true,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
    full: "max-w-[95vw] h-[95vh]",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={closeOnOutsideClick ? onClose : undefined}
      />

      {/* Modal Box */}
      <div
        className={`relative bg-white w-full ${
          sizeClasses[size] || sizeClasses.md
        } rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-5 duration-300`}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 leading-none">
              {title}
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>

        {/* Footer Area */}
        {footer && (
          <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
