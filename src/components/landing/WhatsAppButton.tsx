import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => (
  <motion.a
    href="https://wa.me/5521998496289?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20consultoria%20nutricional."
    target="_blank"
    rel="noopener noreferrer"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: 2, type: "spring" }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg text-sm font-semibold text-white"
    style={{ background: "#25D366" }}
    aria-label="Falar com consultor no WhatsApp"
  >
    <MessageCircle className="w-5 h-5" />
    <span className="hidden sm:inline">Falar com Consultor</span>
  </motion.a>
);

export default WhatsAppButton;
