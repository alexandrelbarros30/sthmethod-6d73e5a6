import { test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Tendencias from "./Tendencias";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{ui}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

test("mobile menu opens and closes", async () => {
  // Set viewport to mobile size
  window.innerWidth = 375;
  window.dispatchEvent(new Event("resize"));

  renderWithProviders(<Tendencias />);

  const menuButton = screen.getByLabelText(/Abrir menu/i);
  expect(menuButton).toBeInTheDocument();

  // Open menu
  fireEvent.click(menuButton);
  expect(screen.getByLabelText(/Fechar menu/i)).toBeInTheDocument();
  expect(screen.getByRole("dialog")).toBeInTheDocument();

  // Check if link is present
  const links = screen.getAllByRole("link");
  const sthNewsLink = links.find(l => l.textContent === "STH News");
  expect(sthNewsLink).toBeInTheDocument();

  // Close menu by clicking a link
  if (sthNewsLink) fireEvent.click(sthNewsLink);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
