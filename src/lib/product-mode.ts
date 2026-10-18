// Server-side switch. An absent value always means the free public launch.
export const paymentsEnabled = () => process.env.PAYMENTS_ENABLED === 'true';
