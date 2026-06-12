WITH RECURSIVE streak_walk AS (
    SELECT
        c.id,
        c.sequence_number,
        ucw.closes_at,
        EXISTS (
            SELECT 1
            FROM submissions s
            WHERE s.user_id = :user_id
                AND s.challenge_id = c.id
                AND s.status = 'SUCCESS'
                AND s.submitted_at <= ucw.closes_at
        ) AS completed
    FROM challenges c
    JOIN user_challenge_windows ucw
        ON ucw.challenge_id = c.id AND ucw.user_id = :user_id
    WHERE c.sequence_number = (SELECT MAX(sequence_number) FROM challenges)

    UNION ALL

    SELECT
        c.id,
        c.sequence_number,
        ucw.closes_at,
        EXISTS (
            SELECT 1
            FROM submissions s
            WHERE s.user_id = :user_id
                AND s.challenge_id = c.id
                AND s.status = 'SUCCESS'
                AND s.submitted_at <= ucw.closes_at
        ) AS completed
    FROM challenges c
    JOIN user_challenge_windows ucw
        ON ucw.challenge_id = c.id AND ucw.user_id = :user_id
    JOIN streak_walk sw ON c.sequence_number = sw.sequence_number - 1
    WHERE sw.completed
)
SELECT COUNT(*)::int
FROM streak_walk
WHERE completed
