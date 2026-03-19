-- Allow public (anon and authenticated) to insert new job postings.
-- This is necessary for the public /post-job form.

CREATE POLICY "Allow public insert on job_postings"
  ON job_postings
  FOR INSERT
  TO public
  WITH CHECK (true);
