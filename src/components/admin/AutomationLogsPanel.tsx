import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import { format } from "date-fns";

const AutomationLogsPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('automation_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (phoneFilter) {
      query = query.ilike('contact_phone', `%${phoneFilter}%`);
    }
    if (eventTypeFilter !== 'all') {
      query = query.eq('event_type', eventTypeFilter);
    }
    if (severityFilter !== 'all') {
      query = query.eq('severity', severityFilter);
    }

    const { data, count, error } = await query;

    if (!error) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [page, eventTypeFilter, severityFilter]);

  const handleSearch = () => {
    setPage(0);
    fetchLogs();
  };

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Data", "Telefone", "Evento", "Ação", "Gravidade", "Motivo/Hash"];
    const rows = logs.map(log => [
      format(new Date(log.created_at), 'dd/MM/yyyy HH:mm'),
      log.contact_phone,
      log.event_type,
      log.action_taken || '-',
      log.severity || 'info',
      log.reason || log.template_hash || '-'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `automation_logs_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Crítico</Badge>;
      case 'warning':
        return <Badge variant="warning" className="bg-orange-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" /> Aviso</Badge>;
      case 'info':
        return <Badge variant="outline" className="text-blue-500 border-blue-500"><Info className="w-3 h-3 mr-1" /> Info</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Auditoria do Canal Comercial</CardTitle>
          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">Telefone</label>
            <Input 
              placeholder="Ex: 55219..." 
              value={phoneFilter} 
              onChange={(e) => setPhoneFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="w-[180px]">
            <label className="text-sm font-medium mb-1 block">Tipo de Evento</label>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="menu_sent">Menu Enviado</SelectItem>
                <SelectItem value="menu_blocked">Bloqueado (Idempotência)</SelectItem>
                <SelectItem value="menu_fallback">Fallback Acionado</SelectItem>
                <SelectItem value="menu_repeat">Repetição de Menu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[150px]">
            <label className="text-sm font-medium mb-1 block">Gravidade</label>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearch}>
            <Filter className="w-4 h-4 mr-2" /> Filtrar
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Gravidade</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Carregando logs...</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Nenhum log encontrado.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">{log.contact_phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.event_type}</Badge>
                    </TableCell>
                    <TableCell>{log.action_taken || '-'}</TableCell>
                    <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={log.reason || log.template_hash}>
                      {log.reason || (log.template_hash ? `Hash: ${log.template_hash.substring(0, 8)}...` : '-')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {logs.length} resultados
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => p + 1)}
              disabled={logs.length < pageSize}
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationLogsPanel;
