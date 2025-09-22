import React from 'react';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { I18nextProvider } from 'react-i18next';

import ActiveSessionsScreen from '../ActiveSessionsScreen';
import i18n from '../../i18n';
import { api } from '../../services/api/http';

jest.mock('../../services/api/http', () => ({
  api: {
    auth: {
      get: jest.fn<[], Promise<any>>(),
      delete: jest.fn<[], Promise<any>>(),
      post: jest.fn<[], Promise<any>>(),
    },
  },
}));

jest.mock('../../store/auth', () => ({
  useAuth: () => ({
    sessionId: 'session-current',
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const apiMock = api as unknown as {
  auth: {
    get: jest.Mock<Promise<any>, [string]>;
    delete: jest.Mock<Promise<any>, [string]>;
    post: jest.Mock<Promise<any>, [string, any?]>;
  };
};

const Stack = createNativeStackNavigator();

describe('ActiveSessionsScreen', () => {
  beforeEach(() => {
    apiMock.auth.get.mockReset();
  });

  it('renders sessions list', async () => {
    apiMock.auth.get.mockResolvedValue({
      data: {
        autoLockEnabled: true,
        sessions: [
          {
            sessionId: 'session-current',
            userAgent: 'Mozilla/5.0 (Macintosh)',
            ip: '127.0.0.1',
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            isCurrent: true,
          },
        ],
      },
    });

    const { getByText } = render(
      <I18nextProvider i18n={i18n}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </I18nextProvider>,
    );

    await waitFor(() => expect(apiMock.auth.get).toHaveBeenCalledWith('/auth/sessions'));

    expect(getByText('Current device')).toBeTruthy();
  });
});
