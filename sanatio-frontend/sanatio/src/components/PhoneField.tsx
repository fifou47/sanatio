import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Button,
  Divider,
  HelperText,
  List,
  Modal,
  Portal,
  Searchbar,
  useTheme,
} from 'react-native-paper';
import InputField from './InputField';
import { COUNTRIES, CountryDialCode, DEFAULT_DIAL_CODE } from '../constants/countries';
import { useTranslation } from 'react-i18next';

type Props = {
  dialCode?: string;
  onDialCodeChange: (code: string) => void;
  dialCodeError?: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  error?: boolean;
  errorText?: string;
};

export default function PhoneField({
  dialCode,
  onDialCodeChange,
  dialCodeError,
  value,
  onChangeText,
  onBlur,
  label,
  error,
  errorText,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const selectedDialCode = dialCode || DEFAULT_DIAL_CODE;
  const resolvedLabel = label ?? t('auth:signup.phoneLabel');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return COUNTRIES;
    return COUNTRIES.filter((country) =>
      country.name.toLowerCase().includes(normalized) ||
      country.dialCode.includes(normalized.replace(/^\+/, '')) ||
      country.iso2.toLowerCase().includes(normalized),
    );
  }, [query]);

  const handleSelect = (country: CountryDialCode) => {
    onDialCodeChange(country.dialCode);
    setVisible(false);
  };

  return (
    <View>
      <View style={styles.row}>
        <Button
          mode="outlined"
          onPress={() => setVisible(true)}
          style={styles.codeButton}
          contentStyle={styles.codeContent}
          labelStyle={styles.codeLabel}
        >
          <TextWithFlag dialCode={selectedDialCode} />
        </Button>
        <View style={styles.inputWrapper}>
          <InputField
            label={resolvedLabel}
            keyboardType="phone-pad"
            value={value}
            onBlur={onBlur}
            onChangeText={onChangeText}
            error={error}
            errorText={errorText}
          />
        </View>
      </View>

      {!!dialCodeError && (
        <HelperText type="error" visible accessibilityLiveRegion="polite">
          {dialCodeError}
        </HelperText>
      )}

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
          <Searchbar
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un pays"
            style={styles.search}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.iso2}
            ItemSeparatorComponent={Divider}
            renderItem={({ item }) => (
              <List.Item
                title={`${item.flag} ${item.name}`}
                description={item.dialCode}
                onPress={() => handleSelect(item)}
                right={() =>
                  item.dialCode === selectedDialCode ? <List.Icon icon="check" /> : null
                }
              />
            )}
            style={styles.list}
          />
        </Modal>
      </Portal>
    </View>
  );
}

function TextWithFlag({ dialCode }: { dialCode: string }) {
  const country = COUNTRIES.find((c) => c.dialCode === dialCode);
  return <>{`${country?.flag ?? '🌍'} ${dialCode}`}</>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  codeButton: {
    minWidth: 96,
    marginTop: 6,
    marginRight: 12,
  },
  codeContent: {
    height: 44,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 16,
  },
  inputWrapper: {
    flex: 1,
  },
  modal: {
    margin: 24,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  search: {
    margin: 16,
    marginBottom: 0,
  },
  list: {
    paddingHorizontal: 8,
  },
});
