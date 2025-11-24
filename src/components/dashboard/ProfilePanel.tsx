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
        <div className="flex flex-col items-center justify-center p-12 text-gray-600">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-base font-medium">Loading profile information...</p>
        </div>
      );
    }

    if (profileError) {
      return (
        <div className="text-center p-10">
          <p className="text-red-600 font-medium mb-4">Unable to load profile information.</p>
          <button
            onClick={onRetry}
            className="bg-blue-900 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-1100 transition-transform duration-150 hover:-translate-y-0.5"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!profileData) {
      return (
        <div className="text-center p-10 text-gray-600">
          <p>No profile details are available yet. Try refreshing the data.</p>
        </div>
      );
    }

    const currentData = isEditing ? editData : profileData;

    return (
      <div className="flex flex-col gap-8">
        {/* Save/Cancel buttons in edit mode */}
        {isEditing && (
          <div className="flex justify-end gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <button
              onClick={handleCancel}
              disabled={saveLoading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveLoading}
              className="px-4 py-2 text-white bg-blue-900 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saveLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {saveLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Error message */}
        {saveError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{saveError}</p>
          </div>
        )}

        <section className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-gray-700 m-0">Personal Information</h2>
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
          <h2 className="text-lg font-semibold text-gray-700 m-0">Contact Information</h2>
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
                <div className="flex flex-col md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Address</p>
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
          <h2 className="text-lg font-semibold text-gray-700 m-0">Spouse Information</h2>
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
          <h2 className="text-lg font-semibold text-gray-700 m-0">Employment Information</h2>
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-white to-blue-50">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Profile Information</h1>
          <p className="text-gray-500 text-sm">
            {isEditing ? 'Edit your personal information below.' : 'Review the personal information on file.'}
          </p>
        </div>
        <div className="flex gap-3">
          {!isEditing && (
            <>
              <button
                onClick={handleEditClick}
                className="self-start sm:self-auto bg-blue-900 text-white font-semibold px-5 py-2 rounded-xl hover:bg-blue-1100 transition-all duration-150 hover:-translate-y-0.5 shadow-sm"
              >
                Edit Profile
              </button>
              <button
                onClick={onRetry}
                className="self-start sm:self-auto bg-gray-100 text-gray-700 font-semibold px-5 py-2 rounded-xl hover:bg-gray-200 transition-all duration-150 hover:-translate-y-0.5 shadow-sm"
              >
                Refresh Data
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
  <div className="flex flex-col">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
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
    <label className="text-sm text-gray-500 mb-1">{label}</label>
    {type === 'select' ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    )}
  </div>
);

const Divider = () => <div className="h-px bg-gray-200" />;
