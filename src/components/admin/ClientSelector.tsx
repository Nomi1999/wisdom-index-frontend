'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowRightLeft, Search, ChevronDown } from 'lucide-react';
import { buildApiUrl } from '@/lib/api';

interface Client {
  client_id: number;
  client_name?: string;
  first_name: string;
  last_name: string;
  email?: string;
  username?: string;
  has_account: boolean;
}

interface ClientSelectorProps {
  authToken: string | null;
  onClientChange: (client: Client | null) => void;
  selectedClient: Client | null;
  onToggleComparison?: () => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  authToken,
  onClientChange,
  selectedClient,
  onToggleComparison
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchClients = async () => {
      if (!authToken) {
        setError('Authentication token required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(buildApiUrl('/api/admin/clients-summary'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.clients && Array.isArray(data.clients)) {
          setClients(data.clients);
        } else {
          setError('Invalid client data format');
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [authToken]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClientSelect = (client: Client) => {
    onClientChange(client);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsDropdownOpen(true);
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.first_name?.toLowerCase().includes(searchLower) ||
      client.last_name?.toLowerCase().includes(searchLower) ||
      `${client.first_name || ''} ${client.last_name || ''}`.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.client_id.toString().includes(searchLower)
    );
  });

  const displayText = selectedClient
    ? `${selectedClient.first_name} ${selectedClient.last_name}`
    : searchTerm || 'Choose a client to view visualizations';

  if (loading) {
    return (
      <Card className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-blue-700/50">
        <CardContent className="p-2">
          <div className="text-xs font-medium flex items-center gap-2 mb-1 text-blue-100">
            <Users className="h-3 w-3" />
            Select Client
          </div>
          <div className="text-sm text-blue-200">Loading clients...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-blue-700/50">
        <CardContent className="p-2">
          <div className="text-xs font-medium flex items-center gap-2 mb-1 text-blue-100">
            <Users className="h-3 w-3" />
            Select Client
          </div>
          <div className="text-sm text-red-300">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-blue-700/50">
        <CardContent className="p-2">
          <div className="text-xs font-medium flex items-center gap-2 mb-1 text-blue-100">
            <Users className="h-3 w-3" />
            Select Client
          </div>
          <div className="text-sm text-blue-200">No clients available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-blue-700/50">
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-medium flex items-center gap-2 text-blue-100">
            <Users className="h-3 w-3" />
            Select Client
          </div>
          {onToggleComparison && (
            <button
              onClick={onToggleComparison}
              className="text-sm text-blue-200 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Compare
            </button>
          )}
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <div
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg shadow-sm cursor-pointer hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-3.5 h-3.5 text-blue-200" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(true);
                }}
                placeholder={displayText}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-blue-200 text-xs"
              />
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-blue-200 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredClients.length === 0 ? (
                <div className="px-2.5 py-3 text-xs text-slate-500 text-center">
                  No clients found matching "{searchTerm}"
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client.client_id}
                    onClick={() => handleClientSelect(client)}
                    className="px-2.5 py-1.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900 text-xs">
                          {client.first_name} {client.last_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID: {client.client_id} • {client.email}
                        </div>
                      </div>
                      <Badge
                        variant={client.has_account ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {client.has_account ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};