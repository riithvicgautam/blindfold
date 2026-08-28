CREATE OR REPLACE FUNCTION public.drizzle_exec(query text, params text[] DEFAULT '{}'::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  res jsonb;
  n int := coalesce(array_length(params, 1), 0);
  q text;
BEGIN
  q := format(
    'WITH drizzle_q AS (%s), drizzle_n AS (SELECT row_to_json(d) AS r, row_number() OVER () AS rn FROM drizzle_q d) '
    || 'SELECT coalesce(jsonb_agg(s.arr ORDER BY s.rn), ''[]''::jsonb) FROM ('
    || 'SELECT n.rn, (SELECT jsonb_agg(e.value ORDER BY e.ord) FROM json_each(n.r) WITH ORDINALITY AS e(key, value, ord)) AS arr FROM drizzle_n n) s',
    query);
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
$function$;