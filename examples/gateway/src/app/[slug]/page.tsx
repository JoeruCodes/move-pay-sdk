"use client";
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const Page = () => {
  const pathname = usePathname();
  const url = `https://movepay.com${pathname}`;
  const [decryptedUrl, setDecryptedUrl] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
    console.log(JSON.stringify(new URL(url).searchParams.keys()));
      try {
        const response = await fetch('/api/decrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: url }),
        });
        const data = await response.json();
        if (response.ok) {
          setDecryptedUrl(data.decryptedUrl);
        } else {
          console.error('Error fetching decrypted URL:', data.error);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchData();
  }, [url]);

  return (
    <div>
      {url}
      {decryptedUrl && <div>Decrypted URL: {JSON.stringify(decryptedUrl)}</div>}
    </div>
  );
};

export default Page;
