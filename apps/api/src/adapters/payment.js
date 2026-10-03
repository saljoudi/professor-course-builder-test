export function getPaymentAdapter() {
  const provider = process.env.PAYMENT_PROVIDER || 'mock';
  if (provider !== 'mock') {
    throw new Error(`PAYMENT_PROVIDER=${provider} is not implemented yet. Add your payment adapter in apps/api/src/adapters/payment.js.`);
  }

  return {
    async assertCanBuild(user) {
      return {
        allowed: true,
        plan: 'professor',
        reason: null,
        userId: user.id,
        mock: true
      };
    }
  };
}
