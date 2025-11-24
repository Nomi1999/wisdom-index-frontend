'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperuser } from '@/utils/sessionAuth';

interface SettingsOverviewProps {
  onNavigateToSecuritySettings: () => void;
  onNavigateToUserPermissions: () => void;
  onNavigateToAIConfiguration: () => void;
}

export function SettingsOverview({ onNavigateToSecuritySettings, onNavigateToUserPermissions, onNavigateToAIConfiguration }: SettingsOverviewProps) {
  // Check if user is superuser
  if (!isSuperuser()) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            You don't have superuser privileges to access settings. Only superuser administrators can manage system settings and configurations.
          </p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-yellow-800">
                <strong>Contact your superuser administrator</strong> if you need to update system settings or require elevated privileges.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const settingsOptions = [
    {
      id: 'security-settings',
      title: 'Security Settings',
      description: 'Manage admin registration security codes and system security configurations',
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBgColor: 'hover:bg-blue-100',
      features: [
        'Update admin registration security codes',
        'Configure system security parameters'
      ],
      buttonText: 'Manage Security Settings',
      buttonVariant: 'outline' as const,
      onClick: onNavigateToSecuritySettings
    },
    {
      id: 'ai-configuration',
      title: 'AI Configuration',
      description: 'Configure AI service settings for generating financial insights',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverBgColor: 'hover:bg-purple-100',
      features: [
        'Configure AI service base URL',
        'Set AI model for insights generation',
        'Update API key securely',
        'Monitor AI service status'
      ],
      buttonText: 'Configure AI Settings',
      buttonVariant: 'outline' as const,
      onClick: onNavigateToAIConfiguration
    },
    {
      id: 'user-permissions',
      title: 'User Permissions',
      description: 'Manage user roles and monitor administrative activities',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverBgColor: 'hover:bg-green-100',
      features: [
        'Manage admin user roles',
        'Configure permission levels',
        'Monitor user activity logs',
        'View audit trail of security changes'
      ],
      buttonText: 'Manage Permissions',
      buttonVariant: 'outline' as const,
      onClick: onNavigateToUserPermissions
    }
  ];

  return (
    <div className="space-y-4">
      {/* Enhanced Header with gradient background matching admin dashboard */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-lg p-4 text-white shadow-lg"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">Settings</h2>
            <p className="text-blue-100 text-sm">Manage system settings, security configurations, and user permissions</p>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Settings Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {settingsOptions.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3, ease: "easeOut" }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="h-full"
          >
            <Card
              className={`p-4 shadow-lg border-0 bg-gradient-to-br from-white to-${option.bgColor.split('-')[1]}-30/30 overflow-hidden relative group hover:shadow-xl transition-all duration-300 h-full flex flex-col`}
            >
              {/* Background decoration */}
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${option.bgColor.replace('bg-', 'from-').replace('-50', '-400/20')} to-transparent rounded-full blur-2xl`}></div>
              
              <div className="relative z-10 space-y-3 flex flex-col h-full">
                {/* Enhanced Icon */}
                <div className={`w-10 h-10 ${option.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md flex-shrink-0`}>
                  <svg className={`w-5 h-5 ${option.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
                  </svg>
                </div>

                {/* Title and Description */}
                <div className="flex-shrink-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1">{option.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{option.description}</p>
                </div>

                {/* Enhanced Features List */}
                <div className="space-y-2 flex-grow">
                  {option.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2 text-xs text-gray-700">
                      <div className={`w-4 h-4 ${option.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Enhanced Action Button */}
                <div className="flex-shrink-0 mt-auto">
                  <Button
                    variant="outline"
                    className="w-full bg-white/80 hover:bg-white border-gray-300 hover:border-blue-400 hover:text-blue-700 font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm text-sm px-3 py-1.5"
                    onClick={option.onClick}
                  >
                    {option.buttonText}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Help Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Card className="p-4 shadow-lg border-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-gray-900 mb-2">Need Help?</h4>
              <p className="text-sm text-gray-700 leading-relaxed mb-2">
                As a superuser administrator, you have access to manage all system settings and security configurations.
                Each settings area provides specific controls for different aspects of the system.
              </p>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-yellow-200">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-xs">
                    <strong className="text-gray-900">Pro Tip:</strong> Start with Security Settings to manage admin access and system security. This is the most critical area to configure first.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}