import { act, render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { getDisplayName } from "../../src/api/account";
import * as auth from "../../src/api/auth";
import { AuthProvider, useAuth } from "../../src/auth/auth-context";

jest.mock("../../src/api/auth", () => ({
  getAuthenticatedUser: jest.fn(),
  getValidIdToken: jest.fn(),
  refreshAccessToken: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("../../src/api/account", () => ({
  getDisplayName: jest.fn(),
}));

const mockGetAuthenticatedUser =
  auth.getAuthenticatedUser as jest.MockedFunction<
    typeof auth.getAuthenticatedUser
  >;
const mockGetValidIdToken = auth.getValidIdToken as jest.MockedFunction<
  typeof auth.getValidIdToken
>;
const mockGetDisplayName = getDisplayName as jest.MockedFunction<
  typeof getDisplayName
>;

const USER = {
  userId: "uuid-123",
  username: "joshua",
  email: "joshua@example.com",
};

/** The context value as last seen by a consumer. */
let captured: ReturnType<typeof useAuth> | null = null;

/** Shows what the context is holding, so the provider can be inspected. */
function Probe() {
  const value = useAuth();
  captured = value;

  if (value.loading) return <Text testID="probe">loading</Text>;
  if (!value.user) return <Text testID="probe">signed out</Text>;
  return (
    <Text testID="probe">{`${value.user.userId}|${value.user.displayName}`}</Text>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    captured = null;
    mockGetAuthenticatedUser.mockResolvedValue(USER);
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockGetDisplayName.mockResolvedValue("Joshua");
  });

  it("holds the display name beside the token", async () => {
    const { getByTestId } = renderProvider();

    await waitFor(() => {
      expect(getByTestId("probe").props.children).toBe("uuid-123|Joshua");
    });
    expect(mockGetDisplayName).toHaveBeenCalledWith("uuid-123");
  });

  it("signs the user out rather than reading a name without a token", async () => {
    mockGetValidIdToken.mockResolvedValue(null);

    const { getByTestId } = renderProvider();

    await waitFor(() => {
      expect(getByTestId("probe").props.children).toBe("signed out");
    });
    expect(mockGetDisplayName).not.toHaveBeenCalled();
  });

  it("picks up a name that has been changed since", async () => {
    const { getByTestId } = renderProvider();
    await waitFor(() => {
      expect(getByTestId("probe").props.children).toBe("uuid-123|Joshua");
    });

    mockGetDisplayName.mockResolvedValue("Joshua Pearson");

    await act(async () => {
      await captured?.refreshUser();
    });

    expect(getByTestId("probe").props.children).toBe("uuid-123|Joshua Pearson");
  });
});
