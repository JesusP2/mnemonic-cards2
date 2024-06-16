import { client } from '@repo/api/client';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    client;
  }, []);
  return <div>hello</div>;
}
