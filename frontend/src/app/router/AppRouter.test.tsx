import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppApiError } from "@/lib/apiError";
import { toUserMessage } from "@/lib/apiError";
import { ProtectedRoute, GuestRoute } from "@/components/common/RouteGuards";
import { useAuthStore } from "@/store/authStore";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { authApi } from "@/services/api/auth";
import { NotFoundPage } from "@/pages/NotFoundPage";

vi.mock("@/services/api/auth", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    currentUser: vi.fn(),
    logout: vi.fn(),
    channel: vi.fn(),
    history: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  useAuthStore.setState({ user: null, status: "unauthenticated" });
  vi.clearAllMocks();
});

const userFixture = {
  _id: "u1",
  username: "ada",
  email: "ada@example.com",
  fullname: "Ada Lovelace",
  avatar: "https://example.com/a.png",
};

describe("error normalization", () => {
  it("maps network and auth errors to user-facing copy", () => {
    expect(
      toUserMessage(new AppApiError({ message: "down", status: 0, code: "NETWORK_ERROR" }))
    ).toMatch(/Cannot reach the API/);
    expect(toUserMessage(new AppApiError({ message: "no", status: 401 }))).toMatch(/sign in/i);
    expect(toUserMessage(new AppApiError({ message: "no", status: 403 }))).toMatch(/permission/);
    expect(toUserMessage(new AppApiError({ message: "gone", status: 404 }))).toMatch(/could not find/);
    expect(toUserMessage(new AppApiError({ message: "exists", status: 409 }))).toMatch(/exists/);
    expect(toUserMessage(new AppApiError({ message: "boom", status: 500 }))).toMatch(/server had a problem/);
  });
});

describe("routing guards", () => {
  it("sends guests to login from a protected route", () => {
    useAuthStore.setState({ status: "unauthenticated", user: null });
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<p>Studio</p>} />
          </Route>
          <Route path="/login" element={<p>Login screen</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });

  it("shows protected content when authenticated", () => {
    useAuthStore.setState({ status: "authenticated", user: userFixture });
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<p>Studio</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Studio")).toBeInTheDocument();
  });

  it("keeps authenticated users off guest auth pages", () => {
    useAuthStore.setState({ status: "authenticated", user: userFixture });
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<p>Login screen</p>} />
          </Route>
          <Route path="/" element={<p>Home</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders the 404 page", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });
});

describe("login", () => {
  it("calls the real auth API login helper with email", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: userFixture,
      accessToken: "a",
      refreshToken: "r",
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    await user.type(screen.getByLabelText(/email or username/i), "ada@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(authApi.login).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "password1",
    });
  });

  it("shows a normalized error on invalid credentials", async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new AppApiError({ message: "Invalid credentials", status: 401, code: "UNAUTHORIZED" })
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    await user.type(screen.getByLabelText(/email or username/i), "ada");
    await user.type(screen.getByLabelText(/^password$/i), "password1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/sign in/i);
  });
});

describe("register", () => {
  it("posts multipart fields then logs in", async () => {
    vi.mocked(authApi.register).mockResolvedValue(userFixture);
    vi.mocked(authApi.login).mockResolvedValue({
      user: userFixture,
      accessToken: "a",
      refreshToken: "r",
    });
    const user = userEvent.setup();
    const file = new File(["x"], "avatar.png", { type: "image/png" });
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/^username$/i), "ada");
    await user.type(screen.getByLabelText(/^email$/i), "ada@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password1");
    await user.upload(screen.getByLabelText(/^avatar$/i), file);
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(authApi.register).toHaveBeenCalled();
    const body = vi.mocked(authApi.register).mock.calls[0][0] as FormData;
    expect(body.get("email")).toBe("ada@example.com");
    expect(authApi.login).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "password1",
    });
  });
});

describe("auth store", () => {
  it("loads the current user on bootstrap", async () => {
    vi.mocked(authApi.currentUser).mockResolvedValue(userFixture);
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user?.username).toBe("ada");
  });

  it("marks the session unauthenticated when current-user fails", async () => {
    vi.mocked(authApi.currentUser).mockRejectedValue(
      new AppApiError({ message: "no", status: 401 })
    );
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("clears the session on logout", async () => {
    useAuthStore.setState({ user: userFixture, status: "authenticated" });
    vi.mocked(authApi.logout).mockResolvedValue(undefined as never);
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(authApi.logout).toHaveBeenCalled();
  });
});
