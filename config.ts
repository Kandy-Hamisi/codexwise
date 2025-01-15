const config = {
  env: {
    apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT!,
    imagekit: {
      publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY!,
      urlEndpoint: process.env.NEXT_PUBLIC_URL_ENDPOINT!,
      privateKey: process.env.PRIVATE_KEY!,
    },
    databaseUrl: process.env.DATABASE_URL!,
    authSecret: process.env.AUTH_SECRET!,
  },
};

export default config;
