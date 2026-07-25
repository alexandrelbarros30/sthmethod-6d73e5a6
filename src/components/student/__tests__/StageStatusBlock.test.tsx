import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StageStatusBlock from "../StageStatusBlock";
import { toFriendlyError, withRef } from "@/lib/friendly-errors";

describe("StageStatusBlock", () => {
  it("renders success without STH code", () => {
    render(<StageStatusBlock kind="success" title="Etapa concluída" description="ok" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Etapa concluída")).toBeInTheDocument();
  });

  it("renders loading with spinner role=status", () => {
    render(<StageStatusBlock kind="loading" title="Salvando..." />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders error with STH-XXX code and never leaks technical terms", () => {
    const f = withRef(toFriendlyError(new Error("Supabase postgres RLS violation at edge function")));
    render(<StageStatusBlock kind="error" title={f.title} error={f} />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert.textContent || "").toMatch(/STH-\d{3}/);
    // Nunca deve vazar palavras técnicas na UI
    expect(alert.textContent?.toLowerCase()).not.toContain("supabase");
    expect(alert.textContent?.toLowerCase()).not.toContain("postgres");
    expect(alert.textContent?.toLowerCase()).not.toContain("rls");
  });

  it("applies wrap-friendly classes to avoid mobile overflow", () => {
    render(<StageStatusBlock kind="success" title="Título longo que precisa quebrar em telas estreitas sem estourar o card do aluno" />);
    const status = screen.getByRole("status");
    expect(status.className).toMatch(/overflow-hidden/);
    expect(status.className).toMatch(/min-w-0/);
  });
});