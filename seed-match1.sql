-- Inject Match 1 Results (RCB vs SRH)
DELETE FROM public.match_results WHERE match_id = '1';

INSERT INTO public.match_results (match_id, player_id, rank, dream11_points, league_points) VALUES 
('1', '3b83648a-69f8-4036-96ec-c3e03102d9c1', 1, 950.5, 50),
('1', '3b83648a-69f8-4036-96ec-c3e03102d9c2', 2, 898.5, 40),
('1', '3b83648a-69f8-4036-96ec-c3e03102d9c3', 3, 885.0, 30),
('1', '3b83648a-69f8-4036-96ec-c3e03102d9c4', 4, 852.5, 20),
('1', '3b83648a-69f8-4036-96ec-c3e03102d9c5', 5, 768.5, 10),
('1', '3b83648a-69f8-4036-96ec-c3e03102d9c6', 6, 730.5, 5),
('1', '3b83648a-69f8-4036-96ec-c3e03102d9c7', 7, 681.5, 2);
