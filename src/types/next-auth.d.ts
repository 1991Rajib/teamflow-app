import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    platformRole?: 'USER' | 'PLATFORM_ADMIN';
  }

  interface Session {
    user: {
      id: string;
      platformRole: 'USER' | 'PLATFORM_ADMIN';
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    platformRole?: 'USER' | 'PLATFORM_ADMIN';
  }
}
