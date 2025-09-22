import React from "react";

type Profile = {
  id: string;
  username: string;
  bio?: string | null;
  profile_picture?: string | null;
  background_style?: string | null;
};

interface ProfileCardProps {
  profile: Profile;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const { username, bio, profile_picture, background_style } = profile;

  return (
    <section className={`card ${background_style || ""}`.trim()}>
      <div className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile_picture || "/default-avatar.png"}
          alt={`${username}'s profile`}
          className="w-16 h-16 rounded-full mr-4 object-cover bg-gray-200"
        />
        <h2 className="text-xl font-bold">{username}</h2>
      </div>
      {bio && <p className="mt-2 text-gray-700 text-sm whitespace-pre-line">{bio}</p>}
    </section>
  );
};

export default ProfileCard;
