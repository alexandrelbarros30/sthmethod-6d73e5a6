import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { mockProtocol } from "@/lib/mock-data";

const StudentProtocol = () => {
  return (
    <DashboardLayout role="student" title="Protocolo" subtitle="Suplementação e protocolos científicos.">
      {/* Legal disclaimer */}
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6 flex items-start gap-3 max-w-3xl">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <p className="text-sm text-foreground font-body">
          <strong>Aviso importante:</strong> As informações aqui não substituem acompanhamento médico.
          Consulte sempre um profissional de saúde antes de iniciar qualquer protocolo.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
        {mockProtocol.map((item, i) => (
          <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-display">{item.name}</CardTitle>
                <Badge variant={item.type === "supplement" ? "secondary" : "destructive"} className="text-xs">
                  {item.type === "supplement" ? "Suplemento" : "Medicamento"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Dosagem</span>
                <span className="font-medium text-foreground">{item.dosage}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Frequência</span>
                <span className="font-medium text-foreground">{item.frequency}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Horário</span>
                <span className="font-medium text-foreground">{item.timing}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentProtocol;
