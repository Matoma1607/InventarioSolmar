import React, { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ isOpen, onClose, title, subtitle, children, footer, size = "md" }: ModalProps) {
  const sizeClasses = {
    sm: "max-w-[380px]",
    md: "max-w-[500px]",
    lg: "max-w-[660px]",
    xl: "max-w-[900px]",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full ${sizeClasses[size]} bg-[var(--bg2)] border border-[var(--line2)] rounded-[var(--r3)] shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh] overflow-hidden`}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between sticky top-0 bg-[var(--bg2)] z-10">
              <div>
                <h2 className="text-[15px] font-semibold text-[var(--txt)] tracking-tight">{title}</h2>
                {subtitle && <p className="text-[11px] text-[var(--txt3)] mt-0.5">{subtitle}</p>}
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg3)] rounded-md transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-[var(--line)] flex items-center justify-end gap-3 sticky bottom-0 bg-[var(--bg2)] z-10">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
