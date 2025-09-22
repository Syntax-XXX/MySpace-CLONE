import React from 'react';

const Sidebar: React.FC = () => {
    return (
        <div className="bg-blue-500 text-white p-4 w-64">
            <h2 className="text-lg font-bold">Profile</h2>
            <div className="mt-4">
                <h3 className="font-semibold">About Me</h3>
                <p className="text-sm">This is where the user's bio will go.</p>
            </div>
            <div className="mt-4">
                <h3 className="font-semibold">Interests</h3>
                <p className="text-sm">List of interests will be displayed here.</p>
            </div>
            <div className="mt-4">
                <h3 className="font-semibold">Friends</h3>
                <div className="grid grid-cols-3 gap-2">
                    {/* Placeholder for friend profile thumbnails */}
                    <div className="bg-gray-300 h-16 w-16 rounded-full"></div>
                    <div className="bg-gray-300 h-16 w-16 rounded-full"></div>
                    <div className="bg-gray-300 h-16 w-16 rounded-full"></div>
                </div>
            </div>
            <div className="mt-4">
                <h3 className="font-semibold">Comments</h3>
                <div className="text-sm">User comments will be displayed here.</div>
            </div>
        </div>
    );
};

export default Sidebar;