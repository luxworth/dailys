WITH active_challenge AS (
    SELECT c.id
    FROM challenges c
    WHERE c.status = 'ACTIVE'
    ORDER BY c.released_at DESC
    LIMIT 1
),
finishers AS (
    SELECT
        s.user_id,
        s.submitted_at,
        PERCENT_RANK() OVER (ORDER BY s.submitted_at ASC) AS pct
    FROM submissions s
    JOIN active_challenge ac ON ac.id = s.challenge_id
    WHERE s.status = 'SUCCESS'
)
SELECT ROUND((pct * 100)::numeric, 2)
FROM finishers
WHERE user_id = :user_id
