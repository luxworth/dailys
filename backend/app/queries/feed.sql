WITH active_challenge AS (
    SELECT c.id
    FROM challenges c
    WHERE c.status = 'ACTIVE'
    ORDER BY c.released_at DESC
    LIMIT 1
)
SELECT
    s.id,
    s.text_value,
    s.number_value,
    s.image_url,
    s.is_ghost,
    s.submitted_at,
    u.username,
    COUNT(r.*) FILTER (WHERE r.reaction_type = 'MIND_BLOWN') AS mind_blown,
    COUNT(r.*) FILTER (WHERE r.reaction_type = 'LAUGH') AS laugh,
    COUNT(r.*) FILTER (WHERE r.reaction_type = 'RESPECT') AS respect,
    vr.reaction_type AS viewer_reaction
FROM submissions s
JOIN active_challenge ac ON ac.id = s.challenge_id
JOIN users u ON u.id = s.user_id
LEFT JOIN reactions r ON r.submission_id = s.id
LEFT JOIN reactions vr ON vr.submission_id = s.id AND vr.user_id = :user_id
WHERE s.status = 'SUCCESS'
    AND (
        :cursor_submitted_at IS NULL
        OR s.submitted_at < CAST(:cursor_submitted_at AS timestamptz)
    )
GROUP BY s.id, u.username, vr.reaction_type, s.text_value, s.number_value, s.image_url, s.is_ghost, s.submitted_at
ORDER BY s.submitted_at DESC
LIMIT :limit
