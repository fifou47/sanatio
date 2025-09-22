import React from 'react';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { I18nextProvider } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ForgotPasswordConfirmScreen from '../ForgotPasswordConfirmScreen';
import i18n from '../../i18n';
import { api } from '../../services/api/http';

jest.mock('../../services/api/http', () => ({
  api: {
    auth: {
      post: jest.fn<[string, unknown?], Promise<any>>(),
    },
  },
}));

const Stack = createNativeStackNavigator();

const apiMock = api as unknown as {
  auth: {
    post: jest.Mock<Promise<any>, [string, unknown?]>;
  };
};

const renderScreen = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="ForgotConfirm"
            component={ForgotPasswordConfirmScreen}
            initialParams={{ emailOrPhone: 'john@doe.com' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </I18nextProvider>,
  );

describe('ForgotPasswordConfirmScreen', () => {
  beforeEach(() => {
    apiMock.auth.post.mockReset();
  });

  it('disables submit until OTP is complete', () => {
    const { getByRole } = renderScreen();
    const submit = getByRole('button', { name: i18n.t('auth:forgotConfirm.submit') });
    expect(submit.props.accessibilityState?.disabled).toBe(true);
  });

  it('submits OTP and new password', async () => {
    apiMock.auth.post.mockResolvedValue({});
    const { getByLabelText, getByRole } = renderScreen();

    const digitLabel = (index: number) => i18n.t('auth:forgotConfirm.otpDigitLabel', { index });
    for (let i = 1; i <= 6; i += 1) {
      fireEvent.changeText(getByLabelText(digitLabel(i)), `${i}`);
    }

    fireEvent.changeText(getByLabelText(i18n.t('auth:forgotConfirm.newPassword')), 'Password1!');
    fireEvent.changeText(getByLabelText(i18n.t('auth:forgotConfirm.confirmPassword')), 'Password1!');

    fireEvent.press(getByRole('button', { name: i18n.t('auth:forgotConfirm.submit') }));

    await waitFor(() => expect(apiMock.auth.post).toHaveBeenCalledWith('/auth/password-reset/confirm', {
      token: '123456',
      newPassword: 'Password1!',
    }));
  });
});
