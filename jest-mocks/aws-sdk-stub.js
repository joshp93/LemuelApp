const { jest } = require("@jest/globals");

const mockSend = jest.fn();

class CognitoIdentityProviderClient {
  send = mockSend;
}

const CognitoIdentityProvider = CognitoIdentityProviderClient;

module.exports = {
  CognitoIdentityProviderClient,
  CognitoIdentityProvider,
  // Common command types used in tests
  InitiateAuthCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  RespondToAuthChallengeCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  SignUpCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  ConfirmSignUpCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  ForgotPasswordCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  ConfirmForgotPasswordCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  GetUserCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  GlobalSignOutCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  RevokeTokenCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  ChangePasswordCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  DeleteUserCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  UpdateUserAttributesCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  VerifyUserAttributeCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  AssociateSoftwareTokenCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  VerifySoftwareTokenCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  SetUserMFAPreferenceCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
  DescribeUserPoolClientCommand: class {
    constructor(input) {
      this.input = input;
    }
  },
};
