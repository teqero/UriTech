import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export async function ensureWallet(supabase: SupabaseClient, userId: string, initial = 124500) {
  const { data: existing } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase
    .from('wallets')
    .insert({ user_id: userId, balance: initial, currency: 'AOA' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function walletPay(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  description: string,
) {
  const wallet = await ensureWallet(supabase, userId);
  const balance = Number(wallet.balance);
  if (balance < amount) throw new Error('Saldo UriPay insuficiente');
  const next = balance - amount;
  const { error: updErr } = await supabase.from('wallets').update({ balance: next }).eq('user_id', userId);
  if (updErr) throw updErr;
  await supabase.from('wallet_transactions').insert({
    user_id: userId,
    wallet_id: wallet.id,
    type: 'payment',
    amount: -amount,
    balance_after: next,
    description,
  });
  return next;
}

export async function getWalletSummary(supabase: SupabaseClient, userId: string) {
  const wallet = await ensureWallet(supabase, userId);
  const { data: txs } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return {
    balance: Number(wallet.balance),
    currency: wallet.currency,
    mask: `**** ${userId.replace(/-/g, '').slice(-4)}`,
    transactions: (txs ?? []).map((t) => ({
      id: t.id,
      userId: t.user_id,
      type: t.type,
      amount: Number(t.amount),
      balanceAfter: Number(t.balance_after),
      description: t.description,
      createdAt: t.created_at,
    })),
  };
}
