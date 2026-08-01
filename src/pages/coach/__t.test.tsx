import { render } from "@testing-library/react";
import { describe, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
vi.mock("@/hooks/useCoachTenant", () => ({
  useCoachContext: () => ({ tenant: { id: "t1", business_name: "X", legal_name: null, tax_id: null, cref: null, phone: null, email: null, logo_url: null, primary_color: "#22A05E", secondary_color: "#0A0A0A", plan: "start", student_limit: 50, active: true }, isOwner: true, member: {}, student: null, loading: false }),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ signOut: async () => {}, user: { id: "u" }, loading: false }) }));
import CoachSettings from "@/pages/coach/CoachSettings";
describe("CoachSettings", () => {
  it("renders", () => {
    const qc = new QueryClient();
    render(<QueryClientProvider client={qc}><MemoryRouter><CoachSettings /></MemoryRouter></QueryClientProvider>);
  });
});
