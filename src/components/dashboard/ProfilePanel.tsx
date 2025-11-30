'use client';

import React, { useState } from 'react';
import { buildApiUrl } from '@/lib/api';
import { isAuthenticated, getAuthToken } from '@/utils/sessionAuth';

interface ProfilePanelProps {
  profileData: any;
  profileLoading: boolean;
  profileError: boolean;
  onRetry: () => void;
  onProfileUpdate?: (updatedProfile: any) => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({
  profileData,
  profileLoading,
  profileError,
  onRetry,
  onProfileUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize edit data when entering edit mode
  const handleEditClick = () => {
    // Convert formatted dates back to ISO format for editing
    const editDataWithDates = { ...profileData };
    
    // Split full_name into first_name and last_name
    if (profileData.full_name && profileData.full_name !== 'Not available') {
      const nameParts = profileData.full_name.trim().split(' ');
      editDataWithDates.first_name = nameParts[0] || '';
      editDataWithDates.last_name = nameParts.slice(1).join(' ') || '';
    }
    
    // Split spouse_full_name into spouse_first_name and spouse_last_name
    if (profileData.spouse_full_name && profileData.spouse_full_name !== 'Not available') {
      const spouseNameParts = profileData.spouse_full_name.trim().split(' ');
      editDataWithDates.spouse_first_name = spouseNameParts[0] || '';
      editDataWithDates.spouse_last_name = spouseNameParts.slice(1).join(' ') || '';
    }
    
    // Convert date_of_birth from formatted to ISO format if it exists
    if (profileData.date_of_birth && profileData.date_of_birth !== 'Not available') {
      try {
        // Parse formatted date like "November 15, 1980" and convert to ISO format
        const parsedDate = new Date(profileData.date_of_birth);
        if (!isNaN(parsedDate.getTime())) {
          editDataWithDates.date_of_birth = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      } catch (error) {
        console.error('Error parsing date_of_birth:', error);
        editDataWithDates.date_of_birth = '';
      }
    }
    
    // Convert spouse_date_of_birth from formatted to ISO format if it exists
    if (profileData.spouse_date_of_birth && profileData.spouse_date_of_birth !== 'Not available') {
      try {
        const parsedDate = new Date(profileData.spouse_date_of_birth);
        if (!isNaN(parsedDate.getTime())) {
          editDataWithDates.spouse_date_of_birth = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      } catch (error) {
        console.error('Error parsing spouse_date_of_birth:', error);
        editDataWithDates.spouse_date_of_birth = '';
      }
    }
    
    setEditData(editDataWithDates);
    setIsEditing(true);
    setSaveError(null);
  };

  // Handle input changes in edit mode
  const handleInputChange = (field: string, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Save profile data
  const handleSave = async () => {
    if (!isAuthenticated()) {
      setSaveError('Authentication expired. Please refresh the page and try again.');
      return;
    }

    setSaveLoading(true);
    setSaveError(null);

    // Prepare data for backend - filter out empty date fields
    const dataToSend = { ...editData };
    
    // Remove full_name and spouse_full_name as backend expects separate fields
    delete dataToSend.full_name;
    delete dataToSend.spouse_full_name;
    
    // Remove empty date fields to prevent them from being set to NULL
    if (!dataToSend.date_of_birth || dataToSend.date_of_birth.trim() === '') {
      delete dataToSend.date_of_birth;
    }
    
    if (!dataToSend.spouse_date_of_birth || dataToSend.spouse_date_of_birth.trim() === '') {
      delete dataToSend.spouse_date_of_birth;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(buildApiUrl('/api/profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const data = await response.json();
        setIsEditing(false);
        setEditData(null);
        // Notify parent component of the update
        if (onProfileUpdate) {
          onProfileUpdate(data.profile);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile');
      }
    } catch (error: any) {
      setSaveError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
    setSaveError(null);
  };

  const renderProfileContent = () => {
    if (profileLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-16 text-gray-600">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin animation-delay-150"></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading profile information...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
        </div>
      );
    }

    if (profileError) {
      return (
        <div className="text-center p-16">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-700 font-semibold text-lg mb-2">Unable to load profile information</p>
          <p className="text-gray-600 mb-6">There was an error fetching your profile data. Please try again.</p>
          <button
            onClick={onRetry}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:-translate-y-0.5 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      );
    }

    if (!profileData) {
      return (
        <div className="text-center p-16 text-gray-600">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium text-lg mb-2">No profile data available</p>
          <p className="text-gray-500">No profile details are available yet. Try refreshing the data.</p>
        </div>
      );
    }

    const currentData = isEditing ? editData : profileData;

return (
      <div className="flex flex-col gap-8">

        {/* Error message */}
        {saveError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-700 font-medium">{saveError}</p>
            </div>
          </div>
        )}

        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 m-0">Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isEditing ? (
              <>
                <EditableField
                  label="First Name"
                  value={currentData.first_name || ''}
                  onChange={(value) => handleInputChange('first_name', value)}
                />
                <EditableField
                  label="Last Name"
                  value={currentData.last_name || ''}
                  onChange={(value) => handleInputChange('last_name', value)}
                />
                <EditableField
                  label="Date of Birth"
                  value={currentData.date_of_birth || ''}
                  onChange={(value) => handleInputChange('date_of_birth', value)}
                  type="date"
                />
                <EditableField
                  label="Gender"
                  value={currentData.gender || ''}
                  onChange={(value) => handleInputChange('gender', value)}
                  type="select"
                  options={['Male', 'Female', 'Other']}
                />
                <EditableField
                  label="Marital Status"
                  value={currentData.marital_status || ''}
                  onChange={(value) => handleInputChange('marital_status', value)}
                  type="select"
                  options={['Single', 'Married', 'Divorced', 'Widowed']}
                />
                <EditableField
                  label="Citizenship"
                  value={currentData.citizenship || ''}
                  onChange={(value) => handleInputChange('citizenship', value)}
                />
              </>
            ) : (
              <>
                <DetailBlock label="Full Name" value={currentData.full_name || 'Not available'} />
                <DetailBlock label="Date of Birth" value={currentData.date_of_birth || 'Not available'} />
                <DetailBlock label="Gender" value={currentData.gender || 'Not available'} />
                <DetailBlock label="Marital Status" value={currentData.marital_status || 'Not available'} />
                <DetailBlock label="Citizenship" value={currentData.citizenship || 'Not available'} />
              </>
            )}
          </div>
        </section>

        <Divider />

        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 m-0">Contact Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isEditing ? (
              <>
                <EditableField
                  label="Email Address"
                  value={currentData.email || ''}
                  onChange={(value) => handleInputChange('email', value)}
                  type="email"
                />
                <EditableField
                  label="Cell Phone"
                  value={currentData.cell_phone || ''}
                  onChange={(value) => handleInputChange('cell_phone', value)}
                  type="tel"
                />
                <EditableField
                  label="Home Phone"
                  value={currentData.home_phone || ''}
                  onChange={(value) => handleInputChange('home_phone', value)}
                  type="tel"
                />
                <EditableField
                  label="Business Phone"
                  value={currentData.business_phone || ''}
                  onChange={(value) => handleInputChange('business_phone', value)}
                  type="tel"
                />
                <EditableField
                  label="Address Line 1"
                  value={currentData.address1 || ''}
                  onChange={(value) => handleInputChange('address1', value)}
                  className="md:col-span-2"
                />
                <EditableField
                  label="City"
                  value={currentData.city || ''}
                  onChange={(value) => handleInputChange('city', value)}
                />
                <EditableField
                  label="State"
                  value={currentData.state || ''}
                  onChange={(value) => handleInputChange('state', value)}
                />
                <EditableField
                  label="Postal Code"
                  value={currentData.postal_code || ''}
                  onChange={(value) => handleInputChange('postal_code', value)}
                />
              </>
            ) : (
              <>
                <DetailBlock label="Email Address" value={currentData.email || 'Not available'} />
                <DetailBlock label="Cell Phone" value={currentData.cell_phone || 'Not available'} />
                <DetailBlock label="Home Phone" value={currentData.home_phone || 'Not available'} />
                <DetailBlock label="Business Phone" value={currentData.business_phone || 'Not available'} />
                <div className="flex flex-col md:col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors duration-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Address</p>
                  <p className="text-base font-medium text-gray-900">
                    {[
                      currentData.address1,
                      currentData.city,
                      currentData.state,
                      currentData.postal_code
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Not available'}
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        <Divider />

        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 m-0">Spouse Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isEditing ? (
              <>
                <EditableField
                  label="Spouse First Name"
                  value={currentData.spouse_first_name || ''}
                  onChange={(value) => handleInputChange('spouse_first_name', value)}
                />
                <EditableField
                  label="Spouse Last Name"
                  value={currentData.spouse_last_name || ''}
                  onChange={(value) => handleInputChange('spouse_last_name', value)}
                />
                <EditableField
                  label="Spouse Date of Birth"
                  value={currentData.spouse_date_of_birth || ''}
                  onChange={(value) => handleInputChange('spouse_date_of_birth', value)}
                  type="date"
                />
                <EditableField
                  label="Spouse Cell Phone"
                  value={currentData.spouse_cell_phone || ''}
                  onChange={(value) => handleInputChange('spouse_cell_phone', value)}
                  type="tel"
                />
              </>
            ) : (
              <>
                <DetailBlock
                  label="Spouse's Name"
                  value={
                    currentData.spouse_full_name ||
                    `${currentData.spouse_first_name || ''} ${currentData.spouse_last_name || ''}`.trim() ||
                    'Not available'
                  }
                />
                <DetailBlock
                  label="Spouse's Date of Birth"
                  value={currentData.spouse_date_of_birth || 'Not available'}
                />
                <DetailBlock
                  label="Spouse's Cell Phone"
                  value={currentData.spouse_cell_phone || 'Not available'}
                />
              </>
            )}
          </div>
        </section>

        <Divider />

        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 m-0">Employment Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isEditing ? (
              <>
                <EditableField
                  label="Employer"
                  value={currentData.employer_name || ''}
                  onChange={(value) => handleInputChange('employer_name', value)}
                />
                <EditableField
                  label="Job Title"
                  value={currentData.job_title || ''}
                  onChange={(value) => handleInputChange('job_title', value)}
                />
                <EditableField
                  label="Years Employed"
                  value={currentData.years_employed?.toString() || ''}
                  onChange={(value) => handleInputChange('years_employed', value)}
                  type="number"
                />
              </>
            ) : (
              <>
                <DetailBlock label="Employer" value={currentData.employer_name || 'Not available'} />
                <DetailBlock label="Job Title" value={currentData.job_title || 'Not available'} />
                <DetailBlock
                  label="Years Employed"
                  value={
                    currentData.years_employed ? `${currentData.years_employed} years` : 'Not available'
                  }
                />
              </>
            )}
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile Information</h1>
            <p className="text-gray-600 text-sm mt-0.5">
              {isEditing ? 'Edit your personal information below.' : 'Review the personal information on file.'}
            </p>
          </div>
        </div>
<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {!isEditing ? (
            <>
              <button
                onClick={handleEditClick}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
              <button
                onClick={onRetry}
                className="flex-1 sm:flex-none bg-gray-100 text-gray-700 font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-gray-200 transition-all duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh Data</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={saveLoading}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                {saveLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="p-8">{renderProfileContent()}</div>
    </div>
  );
};

const DetailBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors duration-200">
    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">{label}</p>
    <p className="text-base font-medium text-gray-900">{value}</p>
  </div>
);

const EditableField = ({
  label,
  value,
  onChange,
  type = 'text',
  options = [],
  className = ''
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  options?: string[];
  className?: string;
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">{label}</label>
    {type === 'select' ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors duration-200"
      >
        <option value="">Select...</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors duration-200"
      />
    )}
  </div>
);

const Divider = () => <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2" />;
