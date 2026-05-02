-- Leaderboard sort by points-per-active-day.
-- We don't modify the user_stats view (its source SQL is managed in the dashboard);
-- instead we expose an RPC that selects from it and adds the computed column.
-- Sorting/filtering happens server-side so pagination still works correctly.

CREATE OR REPLACE FUNCTION get_leaderboard_by_points_per_day(
  p_gender TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  country TEXT,
  gender TEXT,
  total_points NUMERIC,
  active_days INT,
  consistency_pct NUMERIC,
  reading_consistency_pct NUMERIC,
  fasting_consistency_pct NUMERIC,
  qiyam_consistency_pct NUMERIC,
  points_per_day NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id,
    s.username,
    s.country,
    s.gender,
    s.total_points,
    s.active_days,
    s.consistency_pct,
    s.reading_consistency_pct,
    s.fasting_consistency_pct,
    s.qiyam_consistency_pct,
    CASE
      WHEN s.active_days > 0
        THEN ROUND(s.total_points::numeric / s.active_days, 1)
      ELSE 0
    END AS points_per_day
  FROM user_stats s
  WHERE (p_gender  IS NULL OR s.gender  = p_gender)
    AND (p_country IS NULL OR s.country = p_country)
  ORDER BY
    CASE WHEN s.active_days > 0
      THEN s.total_points::numeric / s.active_days
      ELSE 0
    END DESC,
    s.total_points DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard_by_points_per_day(TEXT, TEXT, INT, INT) TO anon, authenticated;
