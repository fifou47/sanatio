import React from 'react';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { I18nextProvider } from 'react-i18next';

import ForgotPasswordRequestScreen from '../ForgotPasswordRequestScreen';
import i18n from '../../i18n';
import { api } from '../../services/api/http';

jest.mock('../../services/api/http', () => ({
  api: {
    auth: {
      post: jest.fn(),
    },
  },
}));

const renderScreen = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <NavigationContainer>
        <ForgotPasswordRequestScreen />
      </NavigationContainer>
    </I18nextProvider>,
  );

describe('ForgotPasswordRequestScreen', () => {
  beforeEach(() => {
    (api.auth.post as jest.Mock).mockReset();
  });

  it('disables submit button when input is empty', () => {
    const { getByRole } = renderScreen();
    const submitButton = getByRole('button', { name: i18n.t('auth:forgotRequest.submit') });
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('submits email and shows success surface', async () => {
    (api.auth.post as jest.Mock).mockResolvedValue({});
    const { getByLabelText, getByRole, findByText } = renderScreen();

    fireEvent.changeText(getByLabelText(i18n.t('auth:forgotRequest.identifierAccessibility')), 'john@doe.com');
    fireEvent.press(getByRole('button', { name: i18n.t('auth:forgotRequest.submit') }));

    await waitFor(() => expect(api.auth.post).toHaveBeenCalledWith('/auth/password-reset/request', {
      emailOrPhone: 'john@doe.com',
    }));

    expect(await findByText(i18n.t('auth:forgotRequest.successTitle'))).toBeTruthy();
  });
});
