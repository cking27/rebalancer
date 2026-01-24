'use client'
import React, { useEffect, useState } from 'react';

interface Account {
  id: number;
  name: string;
}

export default function Page() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    fetch('http://localhost:5001/Account')
      .then(response => response.json())
      .then(data => setAccounts(data));
      console.log(accounts);
  }, []);

  return (
    <div>
      <p>Accounts Page</p>
      <select>
        {accounts.map(account => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </div>
  );
}