import Cookies from 'js-cookie';

export async function fetcher(url: string) {
  const token = Cookies.get('token');

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error('Error fetching data');
  }

  return res.json();
}
