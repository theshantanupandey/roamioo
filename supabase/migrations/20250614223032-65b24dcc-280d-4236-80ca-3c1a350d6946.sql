
-- Insert sample featured destinations data
INSERT INTO places (
  name, 
  description, 
  category, 
  address, 
  city, 
  country, 
  average_rating, 
  total_reviews,
  image_urls,
  latitude,
  longitude,
  is_verified
) VALUES 
(
  'Mountain View Cafe',
  'Cozy cafe with stunning mountain views and artisanal coffee',
  'restaurant',
  '123 Mountain Ridge Road',
  'Aspen',
  'USA',
  4.8,
  145,
  ARRAY['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&h=300&fit=crop'],
  39.1911,
  -106.8175,
  true
),
(
  'Sunrise Hotel & Spa',
  'Luxury beachfront hotel with world-class spa facilities',
  'hotel',
  '456 Ocean Drive',
  'Miami Beach',
  'USA',
  4.5,
  98,
  ARRAY['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500&h=300&fit=crop'],
  25.7617,
  -80.1918,
  true
),
(
  'Seaside Restaurant',
  'Fresh seafood with panoramic ocean views',
  'restaurant',
  '789 Coastal Highway',
  'Monterey',
  'USA',
  4.2,
  75,
  ARRAY['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop'],
  36.6002,
  -121.8947,
  true
),
(
  'Local Boutique Shop',
  'Unique fashion and handcrafted items from local artisans',
  'shopping',
  '321 Main Street',
  'Portland',
  'USA',
  4.3,
  50,
  ARRAY['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=300&fit=crop'],
  45.5152,
  -122.6784,
  true
);
