'use client';

import React, { useState } from 'react';

export const ContactAdvisorPanel: React.FC = () => {
  const [expandedAdvisor, setExpandedAdvisor] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-lg bg-opacity-95">
      <header className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-900 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/20 to-indigo-900/20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Contact Our Advisors</h1>
          </div>
          <p className="text-blue-100 text-base leading-relaxed max-w-2xl font-light">
            Meet the Wisdom Index team and discover personalized financial guidance tailored to your goals.
          </p>
        </div>
      </header>

      <main className="p-10 flex flex-col gap-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {advisorProfiles.map((advisor, index) => (
            <section
              key={advisor.name}
              className={`group relative bg-gradient-to-br from-white to-slate-50 rounded-2xl p-7 border border-gray-200 transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 cursor-pointer ${
                expandedAdvisor === advisor.name ? 'ring-2 ring-blue-600 shadow-lg' : ''
              }`}
              onClick={() => setExpandedAdvisor(expandedAdvisor === advisor.name ? null : advisor.name)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/50 to-slate-200/50 rounded-full -mr-10 -mt-10"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {advisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">{advisor.name}</h2>
                        <p className="text-sm font-semibold text-blue-700">{advisor.role}</p>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className={`w-5 h-5 transition-transform duration-300 ${expandedAdvisor === advisor.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                <div className={`overflow-hidden transition-all duration-300 ${expandedAdvisor === advisor.name ? 'max-h-96' : 'max-h-40'}`}>
                  <p className="text-gray-600 text-sm leading-relaxed">{advisor.bio}</p>
                </div>
                
                {expandedAdvisor !== advisor.name && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent flex items-end justify-center pb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-blue-100">
                      Read full bio
                    </span>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl p-8 border border-blue-100 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-blue-300/20 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center shadow-lg ring-4 ring-blue-50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-blue-900">Contact Information</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <InfoBlock label="Phone" value="972-931-0063" icon="phone" />
                <InfoBlock label="Fax" value="214-853-4224" icon="fax" />
                <InfoBlock label="Toll-Free" value="800-931-5110" icon="toll" />
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl p-8 border border-slate-200 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-200/20 to-slate-300/20 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center shadow-lg ring-4 ring-slate-50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Office Locations</h2>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <LocationBlock
                  title="Prosper Location"
                  address={['102 S. Main Street', 'Prosper, TX 75078']}
                />
                <LocationBlock
                  title="Dallas Location"
                  address={['12900 Preston Road, Suite 780', 'Dallas, TX 75230']}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const advisorProfiles = [
  {
    name: 'Michael J. Davidson MEnVE, CFPAr, AIFAr, CKAAr',
    role: 'Wealth Advisor',
    bio: `Graduating from Texas Tech University with two Engineering degrees, Mike began his career helping businesses, governments and non-profits improve their business processes and financial systems at Arthur Andersen. After leaving Andersen in 2002, Mike founded Wisdom Index Advisors to help clients Walk in WisdomAr with their money. Mike is a Certified Financial Planner (CFP), Accredited Investment Fiduciary (AIF), Certified Kingdom Advisor (CKA) and currently serves on the board of the Dallas Society of Financial Services Professionals (FSP). Mike has been married for 23 years to his wife Renee and they have three great kids, Luke, Taylor and Will.`
  },
  {
    name: 'Chelsi Word',
    role: 'Client Experience Manager',
    bio: `After graduating from Northern Arizona University, Chelsi began her career in financial services over 20 years ago at Vanguard Funds. During her career at Vanguard, Northern Trust and First Horizon, Chelsi specialized in client support and marketing. After taking a few years off to raise her kids, Chelsi is happy to be back in the financial services field providing high level client services. In her free time, Chelsi avidly supports her children's activities from soccer to theater, is an active member of Young Men's Service League and serves on multiple PTA Boards.`
  },
  {
    name: 'Tiffany Diaz',
    role: 'Advisor Assistant',
    bio: `Tiffany graduated from the University of North Texas where she met her husband with whom she's been married for almost 30 years. She worked several years as a teacher in Dallas before staying home to raise their three children of whom the youngest is a senior in high school. Actively serving with her daughter in the Frisco chapter of National Charity League, traveling and spending time with her family is what she enjoys in her free time. Tiffany worked as a substitute teacher and as a recruiter before joining the Wisdom Index team.`
  }
];

const InfoBlock = ({ label, value, icon }: { label: string; value: string; icon: string }) => {
  const getIcon = () => {
    switch (icon) {
      case 'phone':
        return (
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      case 'fax':
        return (
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0l1 16h8l1-16M9 10h6" />
          </svg>
        );
      case 'toll':
        return (
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all duration-300 cursor-pointer">
      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">{label}</p>
        <p className="text-base font-bold text-gray-900 group-hover:text-blue-800 transition-colors">{value}</p>
      </div>
    </div>
  );
};

const LocationBlock = ({ title, address }: { title: string; address: string[] }) => (
  <div className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all duration-300 cursor-pointer">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-slate-200 transition-colors mt-1">
        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">{title}</h3>
        <p className="text-sm font-medium text-gray-600 leading-relaxed">
          {address.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </div>
    </div>
  </div>
);
