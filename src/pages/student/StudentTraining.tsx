import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockTraining } from "@/lib/mock-data";

const StudentTraining = () => {
  return (
    <DashboardLayout role="student" title="Treino Estruturado" subtitle="Seu programa de treinamento semanal.">
      <div className="space-y-6 max-w-4xl">
        {mockTraining.map((day, i) => (
          <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">{day.day}</CardTitle>
                <Badge variant="secondary">{day.focus}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">Exercício</TableHead>
                    <TableHead className="font-body">Séries</TableHead>
                    <TableHead className="font-body">Reps</TableHead>
                    <TableHead className="font-body">Descanso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {day.exercises.map((ex, j) => (
                    <TableRow key={j}>
                      <TableCell className="font-body">
                        {ex.name}
                        {ex.notes && <p className="text-xs text-muted-foreground">{ex.notes}</p>}
                      </TableCell>
                      <TableCell className="font-body">{ex.sets}</TableCell>
                      <TableCell className="font-body">{ex.reps}</TableCell>
                      <TableCell className="font-body">{ex.rest}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentTraining;
