import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('locale')?.value ?? 'he';
  const locale = raw === 'en' ? 'en' : 'he';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
