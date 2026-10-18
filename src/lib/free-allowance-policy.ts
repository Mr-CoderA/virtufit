import { positiveSetting, TryOnError } from './try-on-policy';
export type AllowanceState = {
  requests: number; units: number;
  visitors: Record<string, { requests: number; units: number }>;
  networks: Record<string, number>;
  active: Record<string, { visitor: string; until: number }>;
};
export const emptyAllowance = (): AllowanceState => ({ requests: 0, units: 0, visitors: {}, networks: {}, active: {} });
export function allowanceLimits() {
  return {
    requests: positiveSetting(process.env.DECART_DAILY_REQUEST_LIMIT, 50),
    units: positiveSetting(process.env.DECART_DAILY_UNIT_LIMIT, 100),
    visitorRequests: positiveSetting(process.env.DECART_VISITOR_DAILY_REQUEST_LIMIT, 5),
    networkRequests: positiveSetting(process.env.DECART_NETWORK_DAILY_REQUEST_LIMIT, 10),
    concurrent: positiveSetting(process.env.DECART_CONCURRENT_LIMIT, 2),
  };
}
export function applyAllowance(state: AllowanceState, input: { id: string; visitor: string; network: string; units: number; holdSeconds: number; now: number }, limits = allowanceLimits()) {
  const active = Object.fromEntries(Object.entries(state.active).filter(([, hold]) => hold.until > input.now));
  const visitor = state.visitors[input.visitor] ?? { requests: 0, units: 0 };
  if (state.requests >= limits.requests || state.units + input.units > limits.units) throw new TryOnError('Today’s free studio allowance is used up. Please come back tomorrow.', 429);
  if (visitor.requests >= limits.visitorRequests) throw new TryOnError('You’ve used today’s free try-ons. Come back tomorrow for a fresh allowance.', 429);
  if ((state.networks[input.network] ?? 0) >= limits.networkRequests) throw new TryOnError('Today’s free allowance for this network is used up. Please return tomorrow.', 429);
  if (Object.values(active).some(hold => hold.visitor === input.visitor)) throw new TryOnError('Your previous try-on is still running or closing. Give it a moment before trying again.', 429);
  if (Object.keys(active).length >= limits.concurrent) throw new TryOnError('The studio is busy right now. Please try again in a moment.', 429);
  return {
    requests: state.requests + 1, units: state.units + input.units,
    visitors: { ...state.visitors, [input.visitor]: { requests: visitor.requests + 1, units: visitor.units + input.units } },
    networks: { ...state.networks, [input.network]: (state.networks[input.network] ?? 0) + 1 },
    active: { ...active, [input.id]: { visitor: input.visitor, until: input.now + input.holdSeconds * 1000 } },
  } satisfies AllowanceState;
}
