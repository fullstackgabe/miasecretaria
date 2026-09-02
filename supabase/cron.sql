create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('https://dhzizprkqvzytzrhorce.supabase.co', 'project_url');
select vault.create_secret('<CRON_SECRET>', 'cron_secret');

select cron.unschedule('secretaria-dispatch') where exists (select 1 from cron.job where jobname = 'secretaria-dispatch');

select cron.schedule(
  'secretaria-dispatch',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
