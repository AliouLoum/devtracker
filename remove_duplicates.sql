WITH RankedProjects AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY github_repo_owner, github_repo_name ORDER BY created_at ASC) as rn
  FROM projects
  WHERE github_repo_owner IS NOT NULL
)
DELETE FROM projects
WHERE id IN (
  SELECT id FROM RankedProjects WHERE rn > 1
);
