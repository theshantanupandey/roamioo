-- Add trending places data to the database (corrected without conflict)
INSERT INTO places (
  name, description, category, address, city, country, 
  latitude, longitude, image_urls, average_rating, total_reviews,
  is_verified
) VALUES 
  ('Eiffel Tower', 'Iconic iron lattice tower and symbol of Paris', 'Landmark', 
   'Champ de Mars, 5 Avenue Anatole France', 'Paris', 'France', 
   48.8584, 2.2945, 
   ARRAY['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800'], 
   4.7, 15420, true),
  
  ('Santorini Views', 'Beautiful Greek island with white buildings and blue domes', 'Island', 
   'Santorini', 'Santorini', 'Greece', 
   36.3932, 25.4615, 
   ARRAY['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800'], 
   4.6, 8930, true),
   
  ('Tokyo Shibuya Crossing', 'World''s busiest pedestrian crossing in Tokyo', 'City', 
   'Shibuya City', 'Tokyo', 'Japan', 
   35.6596, 139.7006, 
   ARRAY['https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800'], 
   4.5, 12350, true),
   
  ('Machu Picchu', 'Ancient Incan city high in the Andes Mountains', 'Historical Site', 
   'Machu Picchu', 'Cusco Region', 'Peru', 
   -13.1631, -72.5450, 
   ARRAY['https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800'], 
   4.8, 9870, true),
   
  ('Bali Rice Terraces', 'Stunning terraced rice fields in Bali', 'Nature', 
   'Jatiluwih', 'Bali', 'Indonesia', 
   -8.3405, 115.1289, 
   ARRAY['https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800'], 
   4.4, 6540, true),
   
  ('Northern Lights Iceland', 'Spectacular aurora borealis viewing location', 'Nature', 
   'Reykjavik', 'Reykjavik', 'Iceland', 
   64.1466, -21.9426, 
   ARRAY['https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800'], 
   4.9, 4320, true),
   
  ('Grand Canyon', 'Massive canyon carved by the Colorado River', 'Nature', 
   'Grand Canyon National Park', 'Arizona', 'United States', 
   36.1069, -112.1129, 
   ARRAY['https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800'], 
   4.7, 18650, true),
   
  ('Dubai Burj Khalifa', 'World''s tallest building with stunning city views', 'Landmark', 
   'Downtown Dubai', 'Dubai', 'United Arab Emirates', 
   25.1972, 55.2744, 
   ARRAY['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'], 
   4.6, 11290, true);

-- Add columns for popularity tracking
ALTER TABLE places ADD COLUMN IF NOT EXISTS popularity_score DECIMAL DEFAULT 0;
ALTER TABLE places ADD COLUMN IF NOT EXISTS trending_rank INTEGER DEFAULT NULL;

-- Update trending ranks for trending places
UPDATE places 
SET popularity_score = (average_rating * total_reviews) + (total_reviews * 0.1),
    trending_rank = ROW_NUMBER() OVER (ORDER BY (average_rating * total_reviews) + (total_reviews * 0.1) DESC)
WHERE is_verified = true;