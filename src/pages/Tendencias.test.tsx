import { test, expect, beforeAll } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Tendencias from "./Tendencias";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

beforeAll(() => {
  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords() { return []; }
  } as any;
});

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
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
  window.dispatchEvent(new Event("resize"));

  renderWithProviders(<Tendencias />);

  const menuButton = screen.getByLabelText(/Abrir menu/i);
  expect(menuButton).toBeInTheDocument();

  // Open menu
  await act(async () => {
    fireEvent.click(menuButton);
  });
  
  expect(screen.getByLabelText(/Fechar menu/i)).toBeInTheDocument();
  expect(screen.getByRole("dialog")).toBeInTheDocument();

  // Check if link is present
  const sthNewsLink = screen.getByText("STH News", { selector: "nav a" });
  expect(sthNewsLink).toBeInTheDocument();

  // Close menu by clicking a link
  await act(async () => {
    fireEvent.click(sthNewsLink);
  });
  
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
