import React from "react";

type Friend = {
  id: string;
  username?: string;
  profilePicture?: string;
};

const FriendsGrid: React.FC<{ friends?: Friend[] | null }> = ({ friends }) => {
  const list = Array.isArray(friends) ? friends : [];

  if (list.length === 0) {
    return <div className="p-4 text-sm text-gray-600">No friends to show.</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {list.map((friend) => {
        const avatar = (friend as any).profile_picture || friend.profilePicture || `/api/avatars/${friend.id}`;
        return (
          <div key={friend.id} className="flex flex-col items-center">
            <img
              src={avatar}
              onError={(e:any)=>{e.currentTarget.src='/default-avatar.png'}}
              alt={friend.username || "Friend"}
              className="w-20 h-20 rounded-full object-cover mb-2"
            />
            <div className="text-sm text-center">{friend.username || "Unknown"}</div>
          </div>
        );
      })}
    </div>
  );
};

export default FriendsGrid;