import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  TrendingUp,
  Shield,
  Bell,
  Settings,
} from "lucide-react";

const metrics = [
  { icon: <Users className="w-5 h-5" />, label: "Alunos Ativos", value: "2.847", change: "+12%" },
  { icon: <TrendingUp className="w-5 h-5" />, label: "Taxa de Retenção", value: "94.2%", change: "+3.1%" },
  { icon: <BarChart3 className="w-5 h-5" />, label: "MRR", value: "R$ 284k", change: "+18%" },
  { icon: <Shield className="w-5 h-5" />, label: "Adimplência", value: "97.8%", change: "+1.2%" },
];

const AdminPreview = () => (
  <section className="py-24 px-6">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Painel <span className="gradient-text">Administrativo</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Visão completa do negócio com métricas de engajamento, retenção e performance financeira em tempo real.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass rounded-2xl p-6 md:p-8"
      >
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div className="w-8 h-8 rounded-full gradient-bg" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="surface rounded-xl p-4 border border-border"
            >
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                {m.icon}
                <span className="text-xs">{m.label}</span>
              </div>
              <div className="text-2xl font-display font-bold text-foreground">{m.value}</div>
              <span className="text-xs text-primary font-medium">{m.change}</span>
            </motion.div>
          ))}
        </div>

        <div className="surface rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="font-display text-sm font-semibold text-foreground">Receita Mensal</span>
            <span className="text-xs text-muted-foreground">Últimos 12 meses</span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {[40, 55, 45, 60, 52, 70, 65, 80, 75, 90, 85, 100].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="flex-1 gradient-bg rounded-t-sm opacity-80"
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default AdminPreview;
