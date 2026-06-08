import { test, expect, beforeAll, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Tendencias from "./Tendencias";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

beforeAll(() => {
  // Polyfill IntersectionObserver for JSDOM
  class IntersectionObserverMock {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords() { return []; }
  }

  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
  
  // Mock window.scrollTo
  window.scrollTo = vi.fn();
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

  // Check if link is present in the mobile menu specifically
  const mobileMenu = screen.getByRole("dialog");
  const mobileLinks = screen.getAllByText("STH News");
  // Find the one that's a child of the mobile menu
  const sthNewsLink = mobileLinks.find(link => mobileMenu.contains(link));
  
  expect(sthNewsLink).toBeInTheDocument();
  
  // Close menu by clicking a link
  await act(async () => {
    if (sthNewsLink) fireEvent.click(sthNewsLink);
  });
  
  // Verify it closes - using waitFor for AnimatePresence to finish
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  }, { timeout: 2000 });
});
