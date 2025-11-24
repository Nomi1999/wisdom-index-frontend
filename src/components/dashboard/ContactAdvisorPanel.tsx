'use client';

import React from 'react';

export const ContactAdvisorPanel: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <header className="p-8 border-b border-gray-100 bg-gradient-to-r from-white to-blue-50">
        <h1 className="text-2xl font-semibold text-gray-900">Contact Our Advisors</h1>
        <p className="text-gray-500 text-sm mt-2">
          Meet the Wisdom Index team and find the best way to connect.
        </p>
      </header>

      <main className="p-8 flex flex-col gap-8">
        {advisorProfiles.map((advisor) => (
          <section
            key={advisor.name}
            className="bg-gray-50 rounded-2xl p-6 border border-gray-200 transition-all duration-150 hover:shadow-md hover:border-gray-300"
          >
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-blue-900 mb-2">{advisor.name}</h2>
              <p className="text-sm font-semibold text-gray-700">{advisor.role}</p>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{advisor.bio}</p>
          </section>
        ))}

        <section className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="mb-4 pb-4 border-b border-blue-200">
            <h2 className="text-lg font-bold text-blue-900">Contact Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoBlock label="Phone" value="972-931-0063" />
            <InfoBlock label="Fax" value="214-853-4224" />
            <InfoBlock label="Toll-Free" value="800-931-5110" />
          </div>
        </section>

        <section className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="mb-4 pb-4 border-b border-green-200">
            <h2 className="text-lg font-bold text-green-900">Office Locations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LocationBlock
              title="Prosper Location"
              address={['102 S. Main Street', 'Prosper, TX 75078']}
            />
            <LocationBlock
              title="Dallas Location"
              address={['12900 Preston Road, Suite 780', 'Dallas, TX 75230']}
            />
          </div>
        </section>
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

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <p className="text-sm font-semibold text-blue-900">{label}</p>
    <p className="text-base font-medium text-gray-900">{value}</p>
  </div>
);

const LocationBlock = ({ title, address }: { title: string; address: string[] }) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-base font-semibold text-green-800">{title}</h3>
    <p className="text-sm font-medium text-gray-700 leading-relaxed">
      {address.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </p>
  </div>
);
