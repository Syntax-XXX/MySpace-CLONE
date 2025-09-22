-- Create the users
INSERT INTO users (username, email, bio, profile_picture, background_style, created_at) VALUES
('john_doe', 'john@example.com', 'Hello, I am John!', 'https://example.com/profile_pics/john.jpg', '#ffffff', NOW()),
('jane_smith', 'jane@example.com', 'Hi, I am Jane!', 'https://example.com/profile_pics/jane.jpg', '#ffffff', NOW()),
('alice_jones', 'alice@example.com', 'Welcome to my profile!', 'https://example.com/profile_pics/alice.jpg', '#ffffff', NOW());

-- Create friendships
INSERT INTO friends (user_id, friend_id, status) VALUES
(1, 2, 'accepted'),
(1, 3, 'pending'),
(2, 1, 'accepted'),
(2, 3, 'accepted'),
(3, 1, 'pending'),
(3, 2, 'accepted');

-- Create posts
INSERT INTO posts (user_id, content, created_at) VALUES
(1, 'This is my first post!', NOW()),
(2, 'Loving the new MySpace clone!', NOW()),
(3, 'Just hanging out!', NOW());

-- Create comments
INSERT INTO comments (post_id, user_id, content, created_at) VALUES
(1, 2, 'Great post, John!', NOW()),
(1, 3, 'Welcome to MySpace!', NOW()),
(2, 1, 'Thanks for the shoutout!', NOW()),
(3, 1, 'Sounds fun!', NOW());