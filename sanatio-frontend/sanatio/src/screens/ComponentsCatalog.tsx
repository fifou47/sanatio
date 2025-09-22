import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider as PaperProvider, Text, Switch, useTheme } from 'react-native-paper';
import Screen from '../components/Screen';
import HeaderBar from '../components/HeaderBar';
import PrimaryButton from '../components/PrimaryButton';
import InputField from '../components/InputField';
import Avatar from '../components/Avatar';
import Tag from '../components/Tag';
import Card from '../components/Card';
import PillTab from '../components/PillTab';
import { createAppTheme } from '../theme/theme';
import i18n from '../i18n';
import { useLocale } from '../hooks/useLocale';

export default function ComponentsCatalog() {
  const [dark, setDark] = useState(false);
  const theme = createAppTheme(dark);
  const { lang, change } = useLocale();
  const [tab, setTab] = useState('one');

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={{ flex: 1 }}>
        <HeaderBar title="Sanatio UI Kit" />
        <Screen>
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <Text variant="titleMedium">Theme</Text>
            <Switch value={dark} onValueChange={setDark} style={{ marginTop: 8 }} />
          </Card>

          <Card style={{ padding: 16, marginBottom: 12 }}>
            <Text variant="titleMedium">Language</Text>
            <Text>Current: {lang}</Text>
            <PillTab
              items={[{ key: 'en', label: 'English' }, { key: 'fr', label: 'Français' }]}
              value={lang}
              onChange={change}
            />
          </Card>

          <Card style={{ padding: 16, marginBottom: 12, gap: 12 }}>
            <Text variant="titleMedium">Buttons</Text>
            <PrimaryButton onPress={() => {}}>{i18n.t('common:ok')}</PrimaryButton>
            <PrimaryButton mode="outlined" onPress={() => {}}>
              {i18n.t('common:cancel')}
            </PrimaryButton>
          </Card>

          <Card style={{ padding: 16, marginBottom: 12, gap: 12 }}>
            <Text variant="titleMedium">Inputs</Text>
            <InputField label="Email" keyboardType="email-address" />
            <InputField label="Password" secureTextEntry error errorText="Required" />
          </Card>

          <Card style={{ padding: 16, marginBottom: 12, gap: 12 }}>
            <Text variant="titleMedium">Avatars & Tags</Text>
            <Avatar name="Alice" />
            <Tag label="Info" />
            <Tag label="Succès" color="success" />
            <Tag label="Warning" color="warning" />
            <Tag label="Error" color="error" />
          </Card>

          <Card style={{ padding: 16, marginBottom: 12, gap: 12 }}>
            <Text variant="titleMedium">Pill Tabs</Text>
            <PillTab
              items={[{ key: 'one', label: 'One' }, { key: 'two', label: 'Two' }, { key: 'three', label: 'Three' }]}
              value={tab}
              onChange={setTab}
            />
          </Card>
        </Screen>
      </SafeAreaView>
    </PaperProvider>
  );
}

