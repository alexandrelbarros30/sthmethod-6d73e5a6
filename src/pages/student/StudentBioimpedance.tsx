import DashboardLayout from "@/components/DashboardLayout";
import StudentBioimpedancePanel from "@/components/student/StudentBioimpedancePanel";

const StudentBioimpedance = () => {
  return (
    <DashboardLayout role="student" title="Bioimpedância" subtitle="Acompanhe sua composição corporal e evolução.">
      <StudentBioimpedancePanel />
    </DashboardLayout>
  );
};

export default StudentBioimpedance;
