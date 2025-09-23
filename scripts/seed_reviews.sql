BEGIN;

-- =========================================
-- 1) Taller MotorSur — Nervión
--    Location ID: cmfmxr34u0012i5i4ad2ac53i
-- =========================================
WITH loc AS (
  SELECT id AS location_id, "companyId" FROM "Location" WHERE id = 'cmfmxr34u0012i5i4ad2ac53i'
)
INSERT INTO "Review" ("id","companyId","locationId","provider","externalId","reviewerName","reviewerAnon","rating","comment","languageCode","createdAtG","updatedAtG","ingestedAt","updatedAt")
SELECT 'seed_rv_taller_01', companyId, location_id,'GOOGLE','seed-g-taller-01','Laura Gómez',false,5,'Me cambiaron las pastillas de freno y la revisión en el mismo día. Trato claro y sin sustos en la factura.', 'es-ES','2025-08-05 10:10+02','2025-08-05 10:10+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr34u0012i5i4ad2ac53i')
INSERT INTO "Review" (...) SELECT 'seed_rv_taller_02', companyId, location_id,'GOOGLE','seed-g-taller-02','Javier Martín',false,4,'Diagnóstico rápido de un ruido raro en la dirección. Me explicaron las opciones y eligieron la económica.', 'es-ES','2025-07-22 09:05+02','2025-07-22 09:05+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr34u0012i5i4ad2ac53i')
INSERT INTO "Review" (...) SELECT 'seed_rv_taller_03', companyId, location_id,'GOOGLE','seed-g-taller-03','Noelia Ruiz',false,2,'Dejé el coche para la ITV y al final tardaron dos días más de lo previsto. Me faltó comunicación.', 'es-ES','2025-06-28 12:40+02','2025-06-28 12:40+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr34u0012i5i4ad2ac53i')
INSERT INTO "Review" (...) SELECT 'seed_rv_taller_04', companyId, location_id,'GOOGLE','seed-g-taller-04','Andrés Pardo',false,5,'Cambio de aceite y filtros perfecto. Te mandan fotos del proceso y el presupuesto se respetó.', 'es-ES','2025-09-02 17:20+02','2025-09-02 17:20+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr34u0012i5i4ad2ac53i')
INSERT INTO "Review" (...) SELECT 'seed_rv_taller_05', companyId, location_id,'GOOGLE','seed-g-taller-05','Marta Salas',false,1,'Dejé el coche por un testigo del motor y me lo devolvieron igual. 0 soluciones y 200€ menos.', 'es-ES','2025-07-03 16:05+02','2025-07-03 16:05+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr34u0012i5i4ad2ac53i')
INSERT INTO "Review" (...) SELECT 'seed_rv_taller_06', companyId, location_id,'GOOGLE','seed-g-taller-06','Santiago Arroyo',false,4,'Me cambiaron el embrague. Precio ajustado y te dan coche de cortesía si lo pides con tiempo.', 'es-ES','2025-08-18 11:35+02','2025-08-18 11:35+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr34u0012i5i4ad2ac53i')
INSERT INTO "Review" (...) SELECT 'seed_rv_taller_07', companyId, location_id,'GOOGLE','seed-g-taller-07','Rocío del Valle',false,5,'Atención de 10. Revisaron gratis una fuga pequeña y me dijeron cómo vigilarla.', 'es-ES','2025-09-10 08:55+02','2025-09-10 08:55+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr34u0012i5i4ad2ac53i')
INSERT INTO "Review" (...) SELECT 'seed_rv_taller_08', companyId, location_id,'GOOGLE','seed-g-taller-08','Cristian López',false,3,'Bien, pero el recambio tardó un día más y me descuadró. Aun así, cumplieron.', 'es-ES','2025-08-01 15:25+02','2025-08-01 15:25+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr34u0012i5i4ad2ac53i')
INSERT INTO "Review" (...) SELECT 'seed_rv_taller_09', companyId, location_id,'GOOGLE','seed-g-taller-09','Elena Prats',false,2,'Presupuesto inicial muy bajo y luego “aparecieron” piezas extra. Me sentí poco informada.', 'es-ES','2025-06-21 10:15+02','2025-06-21 10:15+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr34u0012i5i4ad2ac53i')
INSERT INTO "Review" (...) SELECT 'seed_rv_taller_10', companyId, location_id,'GOOGLE','seed-g-taller-10','Hugo Caballero',false,5,'Honestos y rápidos. Me ahorraron una reparación cambiando solo un sensor.', 'es-ES','2025-08-26 18:30+02','2025-08-26 18:30+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr34u0012i5i4ad2ac53i')
INSERT INTO "Review" (...) SELECT 'seed_rv_taller_11', companyId, location_id,'GOOGLE','seed-g-taller-11','Pablo Ferrer',false,4,'Buena relación calidad-precio. Sala de espera cómoda y wifi.', 'es-ES','2025-07-12 13:00+02','2025-07-12 13:00+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr34u0012i5i4ad2ac53i')
INSERT INTO "Review" (...) SELECT 'seed_rv_taller_12', companyId, location_id,'GOOGLE','seed-g-taller-12','Nuria Cebrián',false,1,'Prometieron coche listo el viernes y hasta el lunes nada. Perdí el fin de semana.', 'es-ES','2025-09-01 09:45+02','2025-09-01 09:45+02', now(), now() FROM loc;

-- =========================================
-- 2) Verdalia Supermercados — Salamanca
--    Location ID: cmfmxr1v0000ri5i4nk3m1b45
-- =========================================
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_01', companyId, location_id,'GOOGLE','seed-g-verda-01','María Santos',false,5,'Fruta muy fresca y pan caliente a cualquier hora. Caja rápida incluso en hora punta.', 'es-ES','2025-08-14 10:00+02','2025-08-14 10:00+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_02', companyId, location_id,'GOOGLE','seed-g-verda-02','Tomás Iglesias',false,4,'Buenos precios en lácteos y una pescadería que sorprende. Aparcamiento justo.', 'es-ES','2025-07-19 12:20+02','2025-07-19 12:20+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_03', companyId, location_id,'GOOGLE','seed-g-verda-03','Claudia Peña',false,2,'Muchas colas en cajas automáticas y solo una persona ayudando. Se hace eterno.', 'es-ES','2025-06-25 19:05+02','2025-06-25 19:05+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_04', companyId, location_id,'GOOGLE','seed-g-verda-04','Irene Navarro',false,5,'Siempre encuentro lo que busco y si no, el personal propone alternativas.', 'es-ES','2025-08-29 09:30+02','2025-08-29 09:30+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_05', companyId, location_id,'GOOGLE','seed-g-verda-05','Germán Núñez',false,1,'Pasillos desordenados y productos caducando en nevera. Falta control.', 'es-ES','2025-07-07 17:50+02','2025-07-07 17:50+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_06', companyId, location_id,'GOOGLE','seed-g-verda-06','Bea Romero',false,4,'La zona eco está muy completa. Los carritos a veces están sucios.', 'es-ES','2025-08-03 11:40+02','2025-08-03 11:40+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_07', companyId, location_id,'GOOGLE','seed-g-verda-07','Diego Quintana',false,5,'Promos claras y se aplican bien en caja. Muy cómodo hacer la compra grande.', 'es-ES','2025-09-05 18:10+02','2025-09-05 18:10+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_08', companyId, location_id,'GOOGLE','seed-g-verda-08','Natalia Viana',false,3,'Correcto, aunque faltaba stock en algunas marcas de limpieza.', 'es-ES','2025-08-22 13:35+02','2025-08-22 13:35+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_09', companyId, location_id,'GOOGLE','seed-g-verda-09','Pilar Lozano',false,2,'Los precios en estantería no coinciden con caja en varias referencias. Ojo.', 'es-ES','2025-06-30 20:05+02','2025-06-30 20:05+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_10', companyId, location_id,'GOOGLE','seed-g-verda-10','Xavier Costa',false,5,'La panadería huele a gloria y el personal es majo. Vuelvo fijo.', 'es-ES','2025-09-09 08:20+02','2025-09-09 08:20+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_11', companyId, location_id,'GOOGLE','seed-g-verda-11','Lola Riera',false,4,'Tienda limpia y bien iluminada. Señalética mejorable.', 'es-ES','2025-07-25 10:15+02','2025-07-25 10:15+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr1v0000ri5i4nk3m1b45')
INSERT INTO "Review" (...) SELECT 'seed_rv_verda_12', companyId, location_id,'GOOGLE','seed-g-verda-12','Ricardo Méndez',false,1,'Caja preferente cerrada y nadie atendiendo. Mal para gente mayor.', 'es-ES','2025-08-11 19:45+02','2025-08-11 19:45+02', now(), now() FROM loc;

-- =========================================
-- 3) Clínica Luz & Vida — Casco Antiguo
--    Location ID: cmfmxr01c000di5i4kh7tal6o
-- =========================================
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_01', companyId, location_id,'GOOGLE','seed-g-clin-01','Silvia Marín',false,5,'Equipo médico cercano y explican el tratamiento con calma. Recepción eficiente.', 'es-ES','2025-08-06 09:00+02','2025-08-06 09:00+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_02', companyId, location_id,'GOOGLE','seed-g-clin-02','Óscar Benito',false,4,'Instalaciones nuevas y muy limpias. La primera cita tardó un poco en llegar.', 'es-ES','2025-07-10 10:30+02','2025-07-10 10:30+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_03', companyId, location_id,'GOOGLE','seed-g-clin-03','Ana Beltrán',false,2,'Sala de espera saturada y me pasaron 40 minutos tarde. El médico bien.', 'es-ES','2025-06-19 11:45+02','2025-06-19 11:45+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_04', companyId, location_id,'GOOGLE','seed-g-clin-04','Teresa Coll',false,5,'Me hicieron una extracción complicada sin dolor y con seguimiento por WhatsApp.', 'es-ES','2025-08-27 16:20+02','2025-08-27 16:20+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_05', companyId, location_id,'GOOGLE','seed-g-clin-05','Julián Pino',false,1,'Me cambiaron dos veces la hora el mismo día. Falta de respeto al paciente.', 'es-ES','2025-07-30 12:10+02','2025-07-30 12:10+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_06', companyId, location_id,'GOOGLE','seed-g-clin-06','Patricia Lazo',false,4,'Buena coordinación con el seguro. Me dieron informe completo por email.', 'es-ES','2025-09-04 09:25+02','2025-09-04 09:25+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_07', companyId, location_id,'GOOGLE','seed-g-clin-07','Ignacio Vidal',false,3,'Profesionales, pero la recepción va desbordada y se nota en el trato.', 'es-ES','2025-08-01 18:15+02','2025-08-01 18:15+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_08', companyId, location_id,'GOOGLE','seed-g-clin-08','Marta Paredes',false,5,'Gran atención de enfermería y resultados disponibles en 24 h. Volveré.', 'es-ES','2025-09-07 08:50+02','2025-09-07 08:50+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_09', companyId, location_id,'GOOGLE','seed-g-clin-09','Celia Roldán',false,2,'Cobro doble del ticket de parking y nadie sabía cómo devolverlo.', 'es-ES','2025-06-23 15:05+02','2025-06-23 15:05+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_10', companyId, location_id,'GOOGLE','seed-g-clin-10','Raúl Medina',false,4,'Trato humano y diagnóstico acertado. Mejoraría el sistema de citas online.', 'es-ES','2025-08-20 10:05+02','2025-08-20 10:05+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_11', companyId, location_id,'GOOGLE','seed-g-clin-11','Inés Cruz',false,5,'Me acompañaron en todo el proceso. Salí tranquila y bien informada.', 'es-ES','2025-08-31 11:30+02','2025-08-31 11:30+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmxr01c000di5i4kh7tal6o')
INSERT INTO "Review" (...) SELECT 'seed_rv_clin_12', companyId, location_id,'GOOGLE','seed-g-clin-12','Victor Sainz',false,1,'Intenté anular una cita y nadie cogía el teléfono. Perdiendo el tiempo.', 'es-ES','2025-07-04 09:40+02','2025-07-04 09:40+02', now(), now() FROM loc;

-- =========================================
-- 4) La Mia Gelateria
--    Location ID: cmfmr96rr0004i5r8nzri3ck6
-- =========================================
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_01', companyId, location_id,'GOOGLE','seed-g-gela-01','Paula Tena',false,5,'El pistacho es puro vicio. Cono crujiente y raciones generosas.', 'es-ES','2025-08-09 20:10+02','2025-08-09 20:10+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_02', companyId, location_id,'GOOGLE','seed-g-gela-02','Marc Soler',false,4,'Sabores originales (stracciatella de café top). Algo de cola, pero va rápido.', 'es-ES','2025-07-21 22:05+02','2025-07-21 22:05+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_03', companyId, location_id,'GOOGLE','seed-g-gela-03','Aitana R.',false,2,'Los helados se derretían enseguida y nos manchamos enteros. Mesa pegajosa.', 'es-ES','2025-06-24 19:40+02','2025-06-24 19:40+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_04', companyId, location_id,'GOOGLE','seed-g-gela-04','Daniel Ortega',false,5,'Tienen opciones sin lactosa y sorbetes buenísimos. Personal atento.', 'es-ES','2025-08-30 18:15+02','2025-08-30 18:15+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_05', companyId, location_id,'GOOGLE','seed-g-gela-05','Sofía Navas',false,1,'Precio alto para la cantidad. Y el cucurucho llegó blando.', 'es-ES','2025-07-05 17:20+02','2025-07-05 17:20+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_06', companyId, location_id,'GOOGLE','seed-g-gela-06','Íñigo Pérez',false,4,'Terraza agradable y variedad suficiente. Volveremos con los peques.', 'es-ES','2025-09-06 21:10+02','2025-09-06 21:10+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_07', companyId, location_id,'GOOGLE','seed-g-gela-07','Lucía V.',false,5,'Crema de avellana brutal y servicio rápido. Sitio de cabecera.', 'es-ES','2025-08-17 20:20+02','2025-08-17 20:20+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_08', companyId, location_id,'GOOGLE','seed-g-gela-08','Federico Mateos',false,3,'Correcto sin más. Sabores ricos, pero el local estaba muy lleno.', 'es-ES','2025-08-23 19:55+02','2025-08-23 19:55+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_09', companyId, location_id,'GOOGLE','seed-g-gela-09','Nerea Alba',false,2,'Pedí dos bolas y sirvieron media. Tuvimos que reclamar.', 'es-ES','2025-06-29 18:30+02','2025-06-29 18:30+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_10', companyId, location_id,'GOOGLE','seed-g-gela-10','Adrián Castaño',false,5,'Helado de limón espectacular y terraza limpia. Precio acorde.', 'es-ES','2025-08-25 22:00+02','2025-08-25 22:00+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_11', companyId, location_id,'GOOGLE','seed-g-gela-11','Gala Prieto',false,4,'Buenas mesas interiores con aire. Carta corta pero muy bien ejecutada.', 'es-ES','2025-07-27 21:25+02','2025-07-27 21:25+02', now(), now() FROM loc;
WITH loc AS (SELECT id AS location_id, "companyId" FROM "Location" WHERE id='cmfmr96rr0004i5r8nzri3ck6')
INSERT INTO "Review" (...) SELECT 'seed_rv_gela_12', companyId, location_id,'GOOGLE','seed-g-gela-12','Borja Vidal',false,1,'Nos atendieron con prisas y se equivocaron en los sabores. Experiencia floja.', 'es-ES','2025-06-20 20:35+02','2025-06-20 20:35+02', now(), now() FROM loc;

COMMIT;
