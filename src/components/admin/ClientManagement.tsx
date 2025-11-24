'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ClientDetailView } from './ClientDetailView';
import { ArrowLeft, Users } from 'lucide-react';
import { buildApiUrl } from '@/lib/api';
import { getAuthToken } from '@/utils/sessionAuth';

interface Client {
  client_id: number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  has_account: boolean;
  last_login?: string;
  metrics?: {
    net_worth: number;
    portfolio_value: number;
    total_income: number;
    total_expenses: number;
    margin: number;
  };
}

// Animation variants for client cards - matching AdminAnalytics style
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    console.log('[ClientManagement] Component mounting...');
    loadClients();
  }, []);

  const loadClients = async () => {
    console.log('[ClientManagement] Loading clients...');
    try {
      const token = getAuthToken();
      console.log('[ClientManagement] Token exists:', !!token);
      
      if (!token) {
        console.error('[ClientManagement] No auth token found');
        setIsLoading(false);
        return;
      }
      
      const apiUrl = buildApiUrl('/api/admin/clients-summary');
      console.log('[ClientManagement] Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[ClientManagement] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[ClientManagement] Clients data:', data);
        setClients(data.clients || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ClientManagement] API Error:', response.status, errorData);
      }
    } catch (error) {
      console.error('[ClientManagement] Error loading clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'with_account' && client.has_account) ||
      (filterStatus === 'without_account' && !client.has_account);
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (selectedClient) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => setSelectedClient(null)}
          variant="ghost"
          className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back to Client List
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </Button>
        
        <ClientDetailView client={selectedClient} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-lg p-4 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Client Management</h2>
            <p className="text-blue-100 text-sm">Manage and view all client accounts and financial data</p>
          </div>
          <div className="flex gap-4">
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 md:w-64 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 focus:border-white/30"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 md:w-48 bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="with_account">With Account</SelectItem>
                <SelectItem value="without_account">Without Account</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading clients...</p>
        </div>
      ) : (
        <>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No clients available'}
              </p>
            </div>
          ) : (
            <motion.div
              key={`clients-${searchTerm}-${filterStatus}`}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredClients.map((client) => (
                <motion.div
                  key={client.client_id}
                  variants={cardVariants}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.3 }}
                >
              <Card className="p-4 cursor-pointer flex flex-col h-full bg-white border border-gray-200 hover:border-blue-600 hover:shadow-lg transition-all duration-300">
              <div onClick={() => setSelectedClient(client)} className="flex-grow">
                <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-0.5 tracking-tight">
                      {client.first_name} {client.last_name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">ID {client.client_id}</p>
                  </div>
                  <Badge
                    variant={client.has_account ? "default" : "secondary"}
                    className={client.has_account ? "bg-blue-600 text-white text-xs px-2 py-0.5" : "bg-gray-200 text-gray-700 text-xs px-2 py-0.5"}
                  >
                    {client.has_account ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {client.metrics ? (
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between items-baseline py-1">
                      <span className="text-xs tracking-wide text-gray-600 uppercase">Net Worth</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(client.metrics.net_worth)}</span>
                    </div>
                    <div className="flex justify-between items-baseline py-1 border-t border-gray-100">
                      <span className="text-xs tracking-wide text-gray-600 uppercase">Portfolio</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(client.metrics.portfolio_value)}</span>
                    </div>
                    <div className="flex justify-between items-baseline py-1 border-t border-gray-100">
                      <span className="text-xs tracking-wide text-gray-600 uppercase">Income</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(client.metrics.total_income)}</span>
                    </div>
                    <div className="flex justify-between items-baseline py-1 border-t border-gray-100">
                      <span className="text-xs tracking-wide text-gray-600 uppercase">Expenses</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(client.metrics.total_expenses)}</span>
                    </div>
                    <div className="flex justify-between items-baseline py-1 border-t border-gray-100">
                      <span className="text-xs tracking-wide text-gray-600 uppercase">Margin</span>
                      <span className={`text-sm font-medium ${client.metrics.margin >= 0 ? 'text-gray-900' : 'text-gray-900'}`}>
                        {formatCurrency(client.metrics.margin)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between items-baseline py-1">
                      <span className="text-xs tracking-wide text-gray-600 uppercase">Net Worth</span>
                      <span className="text-sm font-medium text-gray-400">—</span>
                    </div>
                    <div className="flex justify-between items-baseline py-1 border-t border-gray-100">
                      <span className="text-xs tracking-wide text-gray-600 uppercase">Portfolio</span>
                      <span className="text-sm font-medium text-gray-400">—</span>
                    </div>
                    <div className="flex justify-between items-baseline py-1 border-t border-gray-100">
                      <span className="text-xs tracking-wide text-gray-600 uppercase">Income</span>
                      <span className="text-sm font-medium text-gray-400">—</span>
                    </div>
                    <div className="flex justify-between items-baseline py-1 border-t border-gray-100">
                      <span className="text-xs tracking-wide text-gray-600 uppercase">Expenses</span>
                      <span className="text-sm font-medium text-gray-400">—</span>
                    </div>
                    <div className="flex justify-between items-baseline py-1 border-t border-gray-100">
                      <span className="text-xs tracking-wide text-gray-600 uppercase">Margin</span>
                      <span className="text-sm font-medium text-gray-400">—</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100">
                  {client.username ? (
                    <div className="space-y-0.5">
                      <p className="text-xs text-gray-500">
                        <span className="text-gray-900 font-medium">{client.username}</span>
                      </p>
                      {client.last_login && (
                        <p className="text-xs text-gray-500">
                          Last: {new Date(client.last_login).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No account</p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClient(client);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors duration-150 tracking-wide uppercase"
                >
                  View Details
                </Button>
              </div>
              </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
