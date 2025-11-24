'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Account {
  account_id: string;
  account_name?: string;
  account_type?: string;
  current_value?: number;
  date_range?: {
    start_date: string;
    end_date: string;
  };
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccount: string;
  onAccountChange: (account: string) => void;
  loading: boolean;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  selectedAccount,
  onAccountChange,
  loading
}) => {
  const formatAccountDisplay = (account: Account) => {
    const name = account.account_name || account.account_id;
    const type = account.account_type ? ` (${account.account_type})` : '';
    const value = account.current_value 
      ? ` - $${account.current_value.toLocaleString()}` 
      : '';
    
    return `${name}${type}${value}`;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Select Account
      </label>
      <Select
        value={selectedAccount}
        onValueChange={onAccountChange}
        disabled={loading || accounts.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose an account...">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Loading accounts...</span>
              </div>
            ) : (
              <span>
                {selectedAccount
                  ? formatAccountDisplay(accounts.find(acc => acc.account_id === selectedAccount) || { account_id: '' })
                  : 'Choose an account...'
                }
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.account_id} value={account.account_id}>
              <div className="flex flex-col">
                <span className="font-medium">
                  {account.account_name || account.account_id}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {account.account_type && (
                    <span>{account.account_type}</span>
                  )}
                  {account.current_value && (
                    <span>• ${account.current_value.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};