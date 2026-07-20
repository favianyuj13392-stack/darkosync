-- Restrict the server credential to the minimum privileges required by
-- POST /rest/v1/leads?on_conflict=request_id. service_role retains BYPASSRLS.
revoke all privileges on table public.leads from service_role;
grant insert on table public.leads to service_role;
grant select (request_id) on table public.leads to service_role;
