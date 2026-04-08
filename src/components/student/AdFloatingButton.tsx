import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X } from "lucide-react";

interface Props {
  onOpen: () => void;
}

const AdFloatingButton = ({ onOpen }: Props) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed top-3 right-3 z-40 flex items-center gap-1"
      >
        <button
          onClick={onOpen}
          className="w-8 h-8 rounded-full bg-cyan-500/15 backdrop-blur-sm border border-cyan-500/20 flex items-center justify-center hover:bg-cyan-500/25 transition-colors"
          title="Ver promoções"
        >
          <Megaphone className="w-3.5 h-3.5 text-cyan-400/70" />
        </button>
        <button
          onClick={() => setVisible(false)}
          className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          title="Fechar"
        >
          <X className="w-3 h-3 text-muted-foreground/50" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdFloatingButton;
