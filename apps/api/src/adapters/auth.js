export function getAuthAdapter() {
  const provider = process.env.AUTH_PROVIDER || 'mock';
  if (provider !== 'mock') {
    throw new Error(`AUTH_PROVIDER=${provider} is not implemented yet. Keep AUTH_PROVIDER=mock until you connect your auth provider.`);
  }

  return {
    async authenticate(req) {
      // MVP mock identity. Replace this adapter with your central authentication provider.
      const requestedUser = req.headers['x-demo-user-id'];
      return {
        id: requestedUser || 'usr_demo_professor',
        email: 'professor@example.edu',
        name: 'Demo Professor'
      };
    }
  };
}
