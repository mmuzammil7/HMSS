--
-- PostgreSQL database dump
--


-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: residents; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.residents VALUES (1, 'Faisal', '123', '', 'veg', false, true, '2026-03-28 18:58:06.845223');


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.attendance VALUES (1, 1, '2026-03-29', 'present', '2026-03-28 19:24:46.510059');


--
-- Data for Name: mess_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.mess_settings VALUES (1, 'Hostel Mess', 100, 120, 30, '₹', '2026-03-28 18:44:49.824753', 'resident', '123456');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (1, 'admin', '$2b$10$mqcCvkJpRFYWRIW9cexz6euOAOQ8sG23WV1QMk4z9b9gxJtD53uRW', 'admin', '2026-03-29 14:24:19.135065');


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendance_id_seq', 14, true);


--
-- Name: mess_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mess_settings_id_seq', 1, true);


--
-- Name: residents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.residents_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--


