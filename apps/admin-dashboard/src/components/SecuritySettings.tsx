// THIS FILE IS DEPRECATED AND NO LONGER IN USE.
//
// The functionality for an admin to change their own password has been consolidated
// into the `MyAccountSettings.tsx` component, which uses the correct `useAuth` context
// for the admin dashboard.
//
// This file is retained to prevent breaking potential (but incorrect) import paths
// and should be removed in a future refactor.
// The correct component is located at:
// apps/admin-dashboard/src/components/settings/MyAccountSettings.tsx

import React from 'react';

const DeprecatedSecuritySettings: React.FC = () => {
    return (
        <div className="p-4 border border-dashed border-red-500 rounded-lg bg-red-500/10 text-red-700 dark:text-red-300">
            <h3 className="font-bold">Component Deprecated</h3>
            <p className="text-sm mt-1">
                This component is no longer in use. Please use <strong>MyAccountSettings</strong> for managing your admin account.
            </p>
        </div>
    );
};

export const SecuritySettings = DeprecatedSecuritySettings;
