import React from 'react';

const MusicPlayer: React.FC = () => {
    return (
        <div className="bg-blue-500 p-4 rounded-lg shadow-lg">
            <h2 className="text-white text-lg font-bold">MySpace Music Player</h2>
            <div className="mt-2">
                <audio controls className="w-full">
                    <source src="your-music-file.mp3" type="audio/mpeg" />
                    Your browser does not support the audio element.
                </audio>
            </div>
        </div>
    );
};

export default MusicPlayer;