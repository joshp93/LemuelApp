import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import * as AuthContext from "../../src/auth/auth-context";
import { type WithAuthProps, withAuth } from "../../src/auth/with-auth";

jest.mock("../../src/auth/auth-context", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = AuthContext.useAuth as jest.MockedFunction<
  typeof AuthContext.useAuth
>;

const mockRedirect = jest.fn();
const mockGetState = jest.fn();
let mockPathname = "/some/protected/page";
let mockSearchParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  Redirect: (props: any) => {
    mockRedirect(props);
    return null;
  },
  usePathname: () => mockPathname,
  useLocalSearchParams: () => mockSearchParams,
  useNavigation: () => ({
    getState: () => mockGetState(),
  }),
}));

function TestComponent({ user }: WithAuthProps) {
  return <Text>Hello {user.email}</Text>;
}

const WrappedComponent = withAuth(TestComponent);

describe("withAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/some/protected/page";
    mockSearchParams = {};
    mockGetState.mockReturnValue({ routes: [], index: 0 });
  });

  it("should render null while loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    } as any);

    const { toJSON } = render(<WrappedComponent />);
    expect(toJSON()).toBeNull();
  });

  it("should redirect to /email-entry with redirect param using {{uuid}} placeholder", () => {
    mockPathname = "/notes/users/abc-123/ref-456";
    mockSearchParams = { uuid: "abc-123" };
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as any);

    render(<WrappedComponent />);

    expect(mockRedirect).toHaveBeenCalledWith({
      href: "/email-entry?redirect=%2Fnotes%2Fusers%2F%7B%7Buuid%7D%7D%2Fref-456",
    });
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
