import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@uritech/shared';
import { reportClientError } from '../lib/client-diagnostics';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void reportClientError(error, { componentStack: info.componentStack });
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Ionicons name="warning-outline" size={48} color={colors.primary} />
          <Text style={styles.title}>Algo correu mal</Text>
          <Text style={styles.sub}>
            A equipa UriGo foi notificada. Podes tentar voltar atrás ou reiniciar o ecrã.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={this.reset} accessibilityRole="button">
            <Text style={styles.btnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.gray50,
    gap: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.black },
  sub: { fontSize: 14, color: colors.gray700, textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  btnText: { color: colors.white, fontWeight: '800' },
});