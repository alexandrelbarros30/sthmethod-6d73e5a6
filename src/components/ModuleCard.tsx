import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ModuleCardProps {
  icon: ReactNode;
  title: string;
  items: string[];
  badge?: string;
  index: number;
}

const ModuleCard = ({ icon, title, items, badge, index }: ModuleCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    className="surface rounded-xl p-6 border border-border hover:border-primary/30 transition-all duration-500 relative group"
  >
    {badge && (
      <span className="absolute -top-3 right-4 gradient-bg text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
        {badge}
      </span>
    )}
    <div className="flex items-center gap-3 mb-4">
      <div className="text-primary">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
    </div>
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="text-primary mt-1 text-xs">●</span>
          {item}
        </li>
      ))}
    </ul>
  </motion.div>
);

export default ModuleCard;
