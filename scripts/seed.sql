-- Seed de demostración para ANTENA: tres estaciones con pistas, galerías y fechas.
-- ============ ARTISTAS ============
INSERT INTO artists (slug, name, tagline, genres, city, bio, cover_url, avatar_url, accent, socials, edit_token) VALUES
('neblina-norte',
 'Neblina Norte',
 'Pop sintético para manejar de madrugada',
 ARRAY['Electrónica','Pop','Lo-fi'],
 'Monterrey, MX',
 $$Neblina Norte nació en 2022 en un departamento de la colonia Mitras, entre un sintetizador heredado y una caja de ritmos comprada de segunda mano. Mara (voz y teclas) y León (bajo y programación) grababan de madrugada para no despertar a los vecinos: de esas sesiones a escondidas salió su primer EP, «Vapor».

Sus influencias van del synthpop de los ochenta al dream pop contemporáneo, pasado todo por el filtro del norte industrial: neones de avenida, calor que no se va y la niebla que baja de la sierra. Sus directos son rituales de luces tenues y coros que la gente termina cantando por ella.

Ahora preparan su primer larga duración, «Marea de neón», producido íntegramente en cinta. Esta es su estación: suena todo el tiempo, como la ciudad que no se apaga.$$
,
 '/images/stations/neblina-cover.jpg',
 '',
 '#35D0BA',
 '{"instagram":"@neblinanorte","youtube":"@neblinanorte","email":"booking@neblinanorte.mx"}'::jsonb,
 'neblina-demo-token-0f3a9c'),

('rio-solar',
 'Río Solar',
 'Folk de río, son de puerto y canciones para el calor',
 ARRAY['Folk','Cumbia','Indie'],
 'Veracruz, MX',
 $$Diego Andrade creció entre el malecón y la tienda de discos de su tío, donde aprendió que una canción buena se reconoce en los primeros diez segundos. Bajo el nombre Río Solar escribe folk tropical: guitarra de nylon, percusiones prestadas del son jarocho y letras que huelen a sal y a mango maduro.

«Río abajo», su disco debut, se grabó en una semana con micrófonos prestados y la ventana abierta — se escuchan los pájaros y, si pones atención, un vendedor de nieves. La gira lo llevó por doce ciudades y tres países, casi siempre en autobuses nocturnos.

Hoy compone su segundo disco entre Veracruz y Ciudad de México. Su radio suena a atardecer: déjala puesta mientras trabajas, cocinas algo o extrañas a alguien.$$
,
 '/images/stations/rio-cover.jpg',
 '',
 '#FFB000',
 '{"instagram":"@riosolar.mx","youtube":"@riosolarmusica","tiktok":"@riosolar","email":"hola@riosolar.mx"}'::jsonb,
 'rio-demo-token-7b2e41'),

('las-voltaje',
 'Las Voltaje',
 'Garage punk sin permiso y sin volumen bajo',
 ARRAY['Punk','Rock','Experimental'],
 'Bogotá, CO',
 $$Tres amigas, un garaje prestado en Chapinero y la certeza de que el ruido también es un lenguaje. Las Voltaje — Camila (guitarra y voz), Andrea (bajo) y Sofía (batería) — tocan rápido, corto y fuerte: ninguna canción pasa de tres minutos porque, dicen, «lo bueno no se estira».

Empezaron tocando para diez personas y un perro; hoy sus fechas terminan con el público encima del escenario. Su EP «Cortocircuito» se editó en casete por un sello independiente de Medellín y se agotó en dos semanas.

No tienen manager, no tienen press kit y no piden permiso. Tienen esta estación, que es lo más cercano a un amplificador encendido las 24 horas.$$
,
 '/images/stations/voltaje-cover.jpg',
 '',
 '#FF5C8A',
 '{"instagram":"@lasvoltaje","tiktok":"@lasvoltaje","bandcamp":"lasvoltaje.bandcamp.com","email":"lasvoltaje@gmail.com"}'::jsonb,
 'voltaje-demo-token-c91d57');

-- ============ PISTAS ============
INSERT INTO tracks (artist_id, platform, kind, external_id, url, title, duration_sec, position) VALUES
(1, 'youtube', 'video', '60ItHLz5WEA', 'https://www.youtube.com/watch?v=60ItHLz5WEA', 'Marea de neón — sesión en vivo', 212, 0),
(1, 'youtube', 'video', 'YQHsXMglC9A', 'https://www.youtube.com/watch?v=YQHsXMglC9A', 'Cuarto frío (demo 2025)', 295, 1),
(1, 'spotify', 'track', '0VjIjW4GlUZAMYd2vXMi3b', 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b', 'Norte magnético — oficial', 200, 2),
(1, 'youtube', 'video', 'CevxZvSJLk8', 'https://www.youtube.com/watch?v=CevxZvSJLk8', 'Vapor — visualizer', 229, 3),
(2, 'youtube', 'video', 'kJQP7kiw5Fk', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', 'Río abajo — video oficial', 288, 0),
(2, 'youtube', 'video', '2Vv-BfVoq4g', 'https://www.youtube.com/watch?v=2Vv-BfVoq4g', 'Sol de octubre (en vivo)', 263, 1),
(2, 'spotify', 'track', '3n3Ppam7vgaVa1iaRUc9Lp', 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp', 'Marea alta', 222, 2),
(2, 'youtube', 'video', 'JGwWNGJdvx8', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 'Verano del 23 — acústico', 233, 3),
(3, 'youtube', 'video', 'hTWKbfoikeg', 'https://www.youtube.com/watch?v=hTWKbfoikeg', 'Cortocircuito — en el garaje', 158, 0),
(3, 'youtube', 'video', 'fJ9rUzIMcZQ', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', 'Alto voltaje (directo)', 354, 1),
(3, 'youtube', 'video', 'OPf0YbXqDm0', 'https://www.youtube.com/watch?v=OPf0YbXqDm0', 'Ruido rosa', 271, 2),
(3, 'spotify', 'track', '3n3Ppam7vgaVa1iaRUc9Lp', 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp', 'Antiestática', 202, 3);

-- ============ IMÁGENES ============
INSERT INTO images (artist_id, url, caption, position) VALUES
(1, '/images/stations/neblina-press.jpg', 'Sintetizadores modulares — el estudio de San Pedro', 0),
(1, 'https://images.pexels.com/photos/15797142/pexels-photo-15797142.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'La pared de vinilos que heredamos del tío de León', 1),
(1, 'https://images.pexels.com/photos/8382082/pexels-photo-8382082.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Grabando «Marea de neón» en cinta, como antes', 2),
(1, 'https://images.pexels.com/photos/30215324/pexels-photo-30215324.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Primera fila en el Foro Subterráneo, Monterrey', 3),
(2, 'https://images.pexels.com/photos/36675302/pexels-photo-36675302.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Atardecer en el Festival Costa, frente al mar', 0),
(2, 'https://images.pexels.com/photos/20532119/pexels-photo-20532119.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Gira «Río abajo» — fecha en CDMX', 1),
(2, 'https://images.pexels.com/photos/8198130/pexels-photo-8198130.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Buscando samples en la tienda de discos del tío', 2),
(3, 'https://images.pexels.com/photos/761543/pexels-photo-761543.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'El pit de Bogotá — nuestra gente', 0),
(3, 'https://images.pexels.com/photos/14870726/pexels-photo-14870726.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Festival Ruido Libre, Medellín', 1),
(3, 'https://images.pexels.com/photos/12265693/pexels-photo-12265693.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Última fecha de la gira garaje', 2);

-- ============ FECHAS ============
INSERT INTO shows (artist_id, show_date, venue, city) VALUES
(1, '2026-09-12 21:00:00+00', 'Foro Subterráneo', 'Monterrey, MX'),
(1, '2026-10-17 20:30:00+00', 'Sala Neón', 'Ciudad de México'),
(2, '2026-11-07 19:00:00+00', 'La Casa del Son', 'Veracruz, MX'),
(2, '2026-09-05 20:00:00+00', 'Foro del Lago', 'Guadalajara, MX'),
(3, '2026-08-15 22:00:00+00', 'El Garaje Original', 'Bogotá, CO'),
(3, '2026-10-03 21:00:00+00', 'Festival Ruido Libre', 'Medellín, CO');

-- ============ VERIFICACIÓN (palomita azul) ============
-- Dos estaciones verificadas y una con la solicitud en curso, para que se vea
-- la palomita azul en la portada, en la ficha del artista y en la tarjeta al compartir.
UPDATE artists SET verification_status = 'approved', verified_at = now()
 WHERE slug IN ('neblina-norte', 'rio-solar');
UPDATE artists SET verification_status = 'requested'
 WHERE slug = 'las-voltaje';

SELECT a.name, a.verification_status, (SELECT count(*) FROM tracks t WHERE t.artist_id = a.id) AS pistas, (SELECT count(*) FROM images i WHERE i.artist_id = a.id) AS fotos FROM artists a;
