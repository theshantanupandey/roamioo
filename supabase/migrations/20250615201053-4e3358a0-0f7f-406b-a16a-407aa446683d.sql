
-- Drop existing foreign key constraints if they exist
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_journal_entry_id_fkey;
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_post_id_fkey;

-- Recreate constraint on posts: when a journal entry is deleted, cascade delete the associated post
ALTER TABLE public.posts
  ADD CONSTRAINT posts_journal_entry_id_fkey
  FOREIGN KEY (journal_entry_id)
  REFERENCES public.journal_entries(id)
  ON DELETE CASCADE;

-- Recreate constraint on journal_entries: when a post is deleted, unlink it from the journal entry
ALTER TABLE public.journal_entries
  ADD CONSTRAINT journal_entries_post_id_fkey
  FOREIGN KEY (post_id)
  REFERENCES public.posts(id)
  ON DELETE SET NULL;
