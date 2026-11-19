import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { ensureWallet, getWalletSummary, walletPay } from './wallet.ts';

async function walletCredit(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  type: string,
  description: string,
  counterparty?: string,
) {
  const wallet = await ensureWallet(supabase, userId);
  const balance = Number(wallet.balance);
  const next = balance + amount;
  const { error: updErr } = await supabase.from('wallets').update({ balance: next }).eq('user_id', userId);
  if (updErr) throw updErr;
  await supabase.from('wallet_transactions').insert({
    user_id: userId,
    wallet_id: wallet.id,
    type,
    amount,
    balance_after: next,
    description,
    counterparty_email: counterparty ?? null,
  });
  return next;
}

export async function handleWalletRoutes(
  supabase: SupabaseClient,
  method: string,
  path: string,
  req: Request,
  userId: string,
): Promise<{ status: number; body: unknown } | null> {
  if (path === '/wallet' && method === 'GET') {
    return { status: 200, body: await getWalletSummary(supabase, userId) };
  }

  if (path === '/wallet/transactions' && method === 'GET') {
    const summary = await getWalletSummary(supabase, userId);
    return { status: 200, body: summary.transactions };
  }

  if (path === '/wallet/topup' && method === 'POST') {
    const { amount } = await req.json();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return { status: 400, body: { message: 'Montante inválido' } };
    }
    await walletCredit(supabase, userId, value, 'topup', 'Carregamento UriPay');
    return { status: 200, body: await getWalletSummary(supabase, userId) };
  }

  if (path === '/wallet/transfer' && method === 'POST') {
    const { toEmail, amount } = await req.json();
    const value = Number(amount);
    if (!toEmail || !Number.isFinite(value) || value <= 0) {
      return { status: 400, body: { message: 'Dados de transferência inválidos' } };
    }
    const { data: target } = await supabase.from('users').select('id').eq('email', String(toEmail)).single();
    if (!target) return { status: 404, body: { message: 'Destinatário não encontrado' } };
    await walletPay(supabase, userId, value, `Transferência para ${toEmail}`);
    await walletCredit(supabase, target.id, value, 'transfer_in', `Transferência de utilizador`, String(toEmail));
    return { status: 200, body: await getWalletSummary(supabase, userId) };
  }

  if (path === '/wallet/withdraw' && method === 'POST') {
    const { amount } = await req.json();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return { status: 400, body: { message: 'Montante inválido' } };
    }
    await walletPay(supabase, userId, value, 'Levantamento UriPay');
    return { status: 200, body: await getWalletSummary(supabase, userId) };
  }

  return null;
}

const pendingRefs = new Map<string, { userId: string; amount: number; createdAt: number }>();

export async function handlePaymentRoutes(
  supabase: SupabaseClient,
  method: string,
  path: string,
  req: Request,
  userId: string,
): Promise<{ status: number; body: unknown } | null> {
  if (path === '/payments/multicaixa/initiate' && method === 'POST') {
    const { amount } = await req.json();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return { status: 400, body: { message: 'Montante inválido' } };
    }
    const ref = `MCX-${Date.now().toString(36).toUpperCase()}`;
    pendingRefs.set(ref, { userId, amount: value, createdAt: Date.now() });
    return {
      status: 200,
      body: {
        reference: ref,
        merchantRef: ref,
        amount: value,
        currency: 'AOA',
        provider: 'multicaixa',
        instructions: 'Confirme no Multicaixa Express com a referência indicada (modo demonstração).',
        expiresInMinutes: 30,
      },
    };
  }

  if (path === '/payments/multicaixa/simulate' && method === 'POST') {
    const { reference } = await req.json();
    const pending = pendingRefs.get(String(reference));
    if (!pending || pending.userId !== userId) {
      return { status: 404, body: { message: 'Referência não encontrada ou expirada' } };
    }
    await walletCredit(
      supabase,
      userId,
      pending.amount,
      'topup',
      `Multicaixa ${reference}`,
    );
    pendingRefs.delete(String(reference));
    return { status: 200, body: { ok: true, balance: (await getWalletSummary(supabase, userId)).balance } };
  }

  return null;
}