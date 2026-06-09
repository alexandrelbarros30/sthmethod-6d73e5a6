
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, MessageSquare, ShieldAlert, Zap } from 'lucide-react';

const NutriMetrics = () => {
  const [metrics, setMetrics] = useState({
    activeStudents: 0,
    messagesSent: 0,
    messagesBlocked: 0,
    duplicatesBlocked: 0,
    humanActiveBlocked: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Alunos ativos reconhecidos
        const { count: activeCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .not('phone', 'is', null);

        // Logs de automação
        const { data: logs } = await supabase
          .from('automation_logs')
          .select('event_type, created_at');

        if (logs) {
          const sent = logs.filter(l => l.event_type === 'automation_triggered').length;
          const blockedHuman = logs.filter(l => l.event_type === 'blocked_human_active').length;
          const blockedDup = logs.filter(l => l.event_type === 'blocked_duplicate').length;

          setMetrics({
            activeStudents: activeCount || 0,
            messagesSent: sent,
            messagesBlocked: blockedHuman + blockedDup,
            duplicatesBlocked: blockedDup,
            humanActiveBlocked: blockedHuman,
          });

          setPieData([
            { name: 'Enviadas', value: sent, color: '#10b981' },
            { name: 'Bloqueio Humano', value: blockedHuman, color: '#f59e0b' },
            { name: 'Bloqueio Duplicidade', value: blockedDup, color: '#ef4444' },
          ]);

          // Agrupar por dia (últimos 7 dias)
          const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
          }).reverse();

          const dailyData = last7Days.map(date => ({
            date: date.split('-').slice(1).join('/'),
            sent: logs.filter(l => l.event_type === 'automation_triggered' && l.created_at.startsWith(date)).length,
            blocked: logs.filter(l => l.event_type.startsWith('blocked') && l.created_at.startsWith(date)).length,
          }));

          setChartData(dailyData);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando métricas...</div>;

  const duplicateRate = metrics.messagesSent > 0 
    ? ((metrics.duplicatesBlocked / (metrics.messagesSent + metrics.messagesBlocked)) * 100).toFixed(1)
    : 0;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Painel de Métricas - Fale com o Nutri</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Alunos Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeStudents}</div>
            <p className="text-xs text-slate-400">Reconhecidos por telefone</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Mensagens Enviadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.messagesSent}</div>
            <p className="text-xs text-slate-400">Total de disparos automáticos</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Mensagens Bloqueadas</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.messagesBlocked}</div>
            <p className="text-xs text-slate-400">Humanas ou duplicadas</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Taxa de Duplicidade</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duplicateRate}%</div>
            <p className="text-xs text-slate-400">Bloqueios de mensagens repetidas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Card className="lg:col-span-2 bg-white">
          <CardHeader>
            <CardTitle>Histórico de Mensagens (7 dias)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sent" name="Enviadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="blocked" name="Bloqueadas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Distribuição de Eventos</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 text-slate-600">{item.name}</span>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NutriMetrics;
