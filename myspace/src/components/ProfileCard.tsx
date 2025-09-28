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

  function parseInlineStyle(input?: string | null): React.CSSProperties | undefined {
    if (!input) return undefined;
    try {
      const obj: any = {};
      const items = input.split(";").map(s => s.trim()).filter(Boolean);
      for (const item of items) {
        const idx = item.indexOf(":");
        if (idx === -1) continue;
        let key = item.slice(0, idx).trim();
        const value = item.slice(idx + 1).trim();
        if (!key) continue;
        key = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        obj[key] = value;
      }
      return Object.keys(obj).length ? obj : undefined;
    } catch {
      return undefined;
    }
  }

  const inlineStyle = parseInlineStyle(background_style);
  const classExtra = inlineStyle ? "" : (background_style || "");

  return (
    <section className={`card ${classExtra}`.trim()} style={inlineStyle}>
      <div className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile_picture || "/default-avatar.png"}
          onError={(e:any)=>{e.currentTarget.src='/default-avatar.png'}}
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
