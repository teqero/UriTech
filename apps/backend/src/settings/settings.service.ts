import { Injectable } from '@nestjs/common';
import {
  DEFAULT_WHITE_LABEL,
  DEFAULT_API_INTEGRATIONS,
  type WhiteLabelConfig,
  type ApiIntegration,
  type ApiIntegrationStatus,
} from '@uritech/shared';
import type { CreateIntegrationDto, UpdateBrandDto, UpdateIntegrationDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  private brand: WhiteLabelConfig = { ...DEFAULT_WHITE_LABEL };
  private integrations: ApiIntegration[] = DEFAULT_API_INTEGRATIONS.map((item, index) => ({
    id: String(index + 1),
    name: item.name,
    type: item.type,
    provider: item.provider,
    environment: 'sandbox',
    status: item.type === 'payment' ? 'inactive' : 'inactive',
    enabled: false,
    webhookUrl: item.provider === 'multicaixa' ? '/api/v1/payments/multicaixa/webhook' : undefined,
    updatedAt: new Date().toISOString(),
  }));

  getBrand(): WhiteLabelConfig {
    return this.brand;
  }

  updateBrand(data: UpdateBrandDto): WhiteLabelConfig {
    this.brand = { ...this.brand, ...data };
    return this.brand;
  }

  getIntegrations(type?: string): ApiIntegration[] {
    if (!type) return this.integrations;
    return this.integrations.filter((i) => i.type === type);
  }

  getIntegration(id: string): ApiIntegration | undefined {
    return this.integrations.find((i) => i.id === id);
  }

  createIntegration(data: CreateIntegrationDto): ApiIntegration {
    const integration: ApiIntegration = {
      id: String(this.integrations.length + 1),
      name: data.name,
      type: data.type,
      provider: data.provider,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
      webhookUrl: data.webhookUrl,
      merchantId: data.merchantId,
      environment: data.environment ?? 'sandbox',
      status: data.enabled ? 'active' : 'inactive',
      enabled: data.enabled ?? false,
      config: data.config,
      updatedAt: new Date().toISOString(),
    };
    this.integrations.push(integration);
    return integration;
  }

  updateIntegration(id: string, data: UpdateIntegrationDto): ApiIntegration | null {
    const index = this.integrations.findIndex((i) => i.id === id);
    if (index === -1) return null;
    const current = this.integrations[index];
    const updated: ApiIntegration = {
      ...current,
      ...data,
      status: this.resolveStatus(data.enabled ?? current.enabled, current.status),
      updatedAt: new Date().toISOString(),
    };
    this.integrations[index] = updated;
    return updated;
  }

  toggleIntegration(id: string): ApiIntegration | null {
    const integration = this.integrations.find((i) => i.id === id);
    if (!integration) return null;
    integration.enabled = !integration.enabled;
    integration.status = integration.enabled ? 'active' : 'inactive';
    integration.updatedAt = new Date().toISOString();
    return integration;
  }

  deleteIntegration(id: string): boolean {
    const length = this.integrations.length;
    this.integrations = this.integrations.filter((i) => i.id !== id);
    return this.integrations.length < length;
  }

  testIntegration(id: string): { success: boolean; message: string } {
    const integration = this.getIntegration(id);
    if (!integration) return { success: false, message: 'Integração não encontrada' };
    if (!integration.apiKey && integration.type === 'payment') {
      return { success: false, message: 'API Key em falta. Configure as credenciais.' };
    }
    return {
      success: true,
      message: `Conexão com ${integration.name} validada (${integration.environment})`,
    };
  }

  applyMulticaixaFromEnv(): void {
    const merchantId = process.env.MULTICAIXA_MERCHANT_ID;
    const apiKey = process.env.MULTICAIXA_API_KEY;
    const apiSecret = process.env.MULTICAIXA_API_SECRET ?? process.env.MULTICAIXA_WEBHOOK_SECRET;
    const publicUrl = process.env.PUBLIC_API_URL;

    const multicaixa = this.integrations.find((i) => i.provider === 'multicaixa');
    if (!multicaixa) return;

    if (merchantId) multicaixa.merchantId = merchantId;
    if (apiKey) {
      multicaixa.apiKey = apiKey;
      multicaixa.apiSecret = apiSecret;
      multicaixa.enabled = true;
      multicaixa.status = 'active';
      multicaixa.environment =
        process.env.MULTICAIXA_ENV === 'production' ? 'production' : 'sandbox';
    }
    if (publicUrl) {
      const base = publicUrl.replace(/\/$/, '');
      multicaixa.webhookUrl = `${base}/api/v1/payments/multicaixa/webhook`;
    }
    multicaixa.updatedAt = new Date().toISOString();
  }

  getMulticaixaWebhookSecret(): string | undefined {
    const multicaixa = this.integrations.find((i) => i.provider === 'multicaixa');
    return multicaixa?.apiSecret ?? process.env.MULTICAIXA_WEBHOOK_SECRET;
  }

  applyFirebaseFromEnv(): void {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    const firebase = this.integrations.find((i) => i.provider === 'firebase');
    if (!firebase || !projectId) return;

    firebase.merchantId = projectId;
    firebase.apiKey = clientEmail;
    firebase.apiSecret = privateKey;
    firebase.enabled = Boolean(clientEmail && privateKey);
    firebase.status = firebase.enabled ? 'active' : 'inactive';
    firebase.updatedAt = new Date().toISOString();
  }

  private resolveStatus(enabled: boolean, current: ApiIntegrationStatus): ApiIntegrationStatus {
    if (!enabled) return 'inactive';
    return current === 'unstable' ? 'unstable' : 'active';
  }
}
