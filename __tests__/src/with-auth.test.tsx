import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import * as AuthContext from "../../src/auth/auth-context";
import { withAuth, type WithAuthProps } from "../../src/auth/with-auth";

jest.mock("../../src/auth/auth-context", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = AuthContext.useAuth as jest.MockedFunction<
  typeof AuthContext.useAuth
>;

const mockRedirect = jest.fn();
jest.mock("expo-router", () => ({
  Redirect: (props: any) => {
    mockRedirect(props);
    return null;
  },
}));

function TestComponent({ user }: WithAuthProps) {
  return <Text>Hello {user.email}</Text>;
}

const WrappedComponent = withAuth(TestComponent);

describe("withAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render null while loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    } as any);

    const { toJSON } = render(<WrappedComponent />);
    expect(toJSON()).toBeNull();
  });

  it("should redirect to /email-entry when no user", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as any);

    render(<WrappedComponent />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/email-entry" });
  });

  it("should render the wrapped component when authenticated", () => {
    const mockUser = {
      userId: "uuid-123",
      username: "test@example.com",
      email: "test@example.com",
      token: "valid-token",
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    } as any);

    const { getByText } = render(<WrappedComponent />);

    expect(getByText("Hello test@example.com")).toBeTruthy();
  });
});
