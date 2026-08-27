CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_key ON public.users (lower(email));
CREATE UNIQUE INDEX users_username_lower_key ON public.users (lower(username));

GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: this table is never reachable from the browser.
-- All access goes through server-side code using the service role.

CREATE OR REPLACE FUNCTION public.drizzle_exec(query text, params text[] DEFAULT '{}')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  res jsonb;
  n int := coalesce(array_length(params, 1), 0);
  q text;
BEGIN
  q := format('WITH drizzle_q AS (%s) SELECT coalesce(jsonb_agg(row_to_json(drizzle_q)), ''[]''::jsonb) FROM drizzle_q', query);
  CASE n
    WHEN 0 THEN EXECUTE q INTO res;
    WHEN 1 THEN EXECUTE q INTO res USING params[1];
    WHEN 2 THEN EXECUTE q INTO res USING params[1], params[2];
    WHEN 3 THEN EXECUTE q INTO res USING params[1], params[2], params[3];
    WHEN 4 THEN EXECUTE q INTO res USING params[1], params[2], params[3], params[4];
    WHEN 5 THEN EXECUTE q INTO res USING params[1], params[2], params[3], params[4], params[5];
    WHEN 6 THEN EXECUTE q INTO res USING params[1], params[2], params[3], params[4], params[5], params[6];
    WHEN 7 THEN EXECUTE q INTO res USING params[1], params[2], params[3], params[4], params[5], params[6], params[7];
    WHEN 8 THEN EXECUTE q INTO res USING params[1], params[2], params[3], params[4], params[5], params[6], params[7], params[8];
    ELSE RAISE EXCEPTION 'drizzle_exec: too many parameters (%)', n;
  END CASE;
  RETURN coalesce(res, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.drizzle_exec(text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.drizzle_exec(text, text[]) FROM anon;
REVOKE ALL ON FUNCTION public.drizzle_exec(text, text[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.drizzle_exec(text, text[]) TO service_role;