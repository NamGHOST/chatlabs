create schema if not exists "api";


create extension if not exists "wrappers" with schema "extensions";


drop trigger if exists "set_updated_at" on "public"."meetings";

drop trigger if exists "update_platform_tools_updated_at" on "public"."platform_tools";

drop policy "Users can delete their own images" on "public"."image_history";

drop policy "Users can insert their own images" on "public"."image_history";

drop policy "Users can view their own images" on "public"."image_history";

drop policy "Allow insert/update access to platform_tools for service role" on "public"."platform_tools";

drop policy "Allow read access to platform_tools for authenticated users" on "public"."platform_tools";

revoke delete on table "public"."meetings" from "anon";

revoke insert on table "public"."meetings" from "anon";

revoke references on table "public"."meetings" from "anon";

revoke select on table "public"."meetings" from "anon";

revoke trigger on table "public"."meetings" from "anon";

revoke truncate on table "public"."meetings" from "anon";

revoke update on table "public"."meetings" from "anon";

revoke delete on table "public"."meetings" from "authenticated";

revoke insert on table "public"."meetings" from "authenticated";

revoke references on table "public"."meetings" from "authenticated";

revoke select on table "public"."meetings" from "authenticated";

revoke trigger on table "public"."meetings" from "authenticated";

revoke truncate on table "public"."meetings" from "authenticated";

revoke update on table "public"."meetings" from "authenticated";

revoke delete on table "public"."meetings" from "service_role";

revoke insert on table "public"."meetings" from "service_role";

revoke references on table "public"."meetings" from "service_role";

revoke select on table "public"."meetings" from "service_role";

revoke trigger on table "public"."meetings" from "service_role";

revoke truncate on table "public"."meetings" from "service_role";

revoke update on table "public"."meetings" from "service_role";

revoke delete on table "public"."platform_tools" from "anon";

revoke insert on table "public"."platform_tools" from "anon";

revoke references on table "public"."platform_tools" from "anon";

revoke select on table "public"."platform_tools" from "anon";

revoke trigger on table "public"."platform_tools" from "anon";

revoke truncate on table "public"."platform_tools" from "anon";

revoke update on table "public"."platform_tools" from "anon";

revoke delete on table "public"."platform_tools" from "authenticated";

revoke insert on table "public"."platform_tools" from "authenticated";

revoke references on table "public"."platform_tools" from "authenticated";

revoke select on table "public"."platform_tools" from "authenticated";

revoke trigger on table "public"."platform_tools" from "authenticated";

revoke truncate on table "public"."platform_tools" from "authenticated";

revoke update on table "public"."platform_tools" from "authenticated";

revoke delete on table "public"."platform_tools" from "service_role";

revoke insert on table "public"."platform_tools" from "service_role";

revoke references on table "public"."platform_tools" from "service_role";

revoke select on table "public"."platform_tools" from "service_role";

revoke trigger on table "public"."platform_tools" from "service_role";

revoke truncate on table "public"."platform_tools" from "service_role";

revoke update on table "public"."platform_tools" from "service_role";

alter table "public"."meetings" drop constraint "meetings_status_check";

alter table "public"."meetings" drop constraint "meetings_user_id_fkey";

drop function if exists "public"."set_updated_at"();

alter table "public"."meetings" drop constraint "meetings_pkey";

alter table "public"."platform_tools" drop constraint "platform_tools_pkey";

drop index if exists "public"."idx_unique_user_image";

drop index if exists "public"."meetings_created_at_idx";

drop index if exists "public"."meetings_pkey";

drop index if exists "public"."meetings_user_id_idx";

drop index if exists "public"."platform_tools_enabled_idx";

drop index if exists "public"."platform_tools_name_idx";

drop index if exists "public"."platform_tools_pkey";

drop index if exists "public"."file_items_cohere_embedding_idx";

drop index if exists "public"."idx_image_history_timestamp";

drop table "public"."meetings";

drop table "public"."platform_tools";

create table "public"."subdomain_adjectives" (
    "word" text not null
);


create table "public"."subdomain_nouns" (
    "word" text not null
);


alter table "public"."applications" add column "subdomain" text default generate_random_subdomain();

alter table "public"."file_items" drop column "cohere_embedding";

alter table "public"."file_items" add column "jina_embedding" vector(384);

alter table "public"."file_items" alter column "local_embedding" set data type vector(768) using "local_embedding"::vector(768);

alter table "public"."image_history" add column "model_tier" text;

alter table "public"."image_history" alter column "created_at" set default now();

alter table "public"."image_history" alter column "created_at" drop not null;

alter table "public"."image_history" disable row level security;

alter table "public"."profiles" add column "jina_api_key" text;

CREATE UNIQUE INDEX subdomain_adjectives_pkey ON public.subdomain_adjectives USING btree (word);

CREATE UNIQUE INDEX subdomain_nouns_pkey ON public.subdomain_nouns USING btree (word);

CREATE UNIQUE INDEX unique_subdomain ON public.applications USING btree (subdomain);

CREATE INDEX file_items_cohere_embedding_idx ON public.file_items USING hnsw (jina_embedding vector_cosine_ops);

CREATE INDEX idx_image_history_timestamp ON public.image_history USING btree ("timestamp");

alter table "public"."subdomain_adjectives" add constraint "subdomain_adjectives_pkey" PRIMARY KEY using index "subdomain_adjectives_pkey";

alter table "public"."subdomain_nouns" add constraint "subdomain_nouns_pkey" PRIMARY KEY using index "subdomain_nouns_pkey";

alter table "public"."applications" add constraint "unique_subdomain" UNIQUE using index "unique_subdomain";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_message_limit()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$BEGIN
  RETURN (
    (SELECT count(1)
     FROM messages
     WHERE user_id = auth.uid() AND created_at > (now() - '1 day'::interval)) < 30
  );
END;$function$
;

CREATE OR REPLACE FUNCTION public.generate_random_subdomain()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    adj text;
    noun text;
    random_num int;
    generated_subdomain text;
    is_unique boolean := false;
BEGIN
    -- Keep trying until we get a unique subdomain
    WHILE NOT is_unique LOOP
        -- Get random words
        SELECT word INTO adj FROM public.subdomain_adjectives ORDER BY random() LIMIT 1;
        SELECT word INTO noun FROM public.subdomain_nouns ORDER BY random() LIMIT 1;
        
        -- Generate random number between 100 and 999
        SELECT floor(random() * 900 + 100)::int INTO random_num;
        
        -- Combine into subdomain
        generated_subdomain := adj || '-' || noun || '-' || random_num::text;
        
        -- Check if subdomain is unique
        SELECT NOT EXISTS (
            SELECT 1 FROM public.applications WHERE subdomain = generated_subdomain
        ) INTO is_unique;
    END LOOP;
    
    RETURN generated_subdomain;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_file_items_jina(query_embedding vector, match_count integer DEFAULT NULL::integer, file_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS TABLE(id uuid, file_id uuid, content text, tokens integer, similarity double precision)
 LANGUAGE plpgsql
AS $function$
#variable_conflict use_column
begin
  return query
  select
    id,
    file_id,
    content,
    tokens,
    1 - (file_items.jina_embedding <=> query_embedding) as similarity
  from file_items
  where (file_id = ANY(file_ids))
  order by file_items.jina_embedding <=> query_embedding
  limit match_count;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.create_profile_and_workspace()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    random_username TEXT;
BEGIN
    -- Generate a random username
    random_username := 'user' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);

    -- Create a profile for the new user
    INSERT INTO public.profiles(user_id, anthropic_api_key, azure_openai_35_turbo_id, azure_openai_45_turbo_id, azure_openai_45_vision_id, azure_openai_api_key, azure_openai_endpoint, google_gemini_api_key, has_onboarded, image_url, image_path, mistral_api_key, display_name, bio, openai_api_key, openai_organization_id, perplexity_api_key, profile_context, use_azure_openai, username)
    VALUES(
        NEW.id,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        FALSE,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        FALSE,
        random_username
    );

    INSERT INTO public.workspaces(user_id, is_home, name, default_context_length, default_model, default_prompt, default_temperature, description, embeddings_provider, include_profile_context, include_workspace_instructions, instructions)
    VALUES(
        NEW.id,
        TRUE,
        'Home',
        4096,
        'gpt-4o-mini', -- Updated default model
        'You are a friendly, helpful AI assistant.',
        0.5,
        'My home workspace.',
        'openai',
        TRUE,
        TRUE,
        ''
    );

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_message_including_and_after(p_user_id uuid, p_chat_id uuid, p_sequence_number integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM messages 
    WHERE user_id = p_user_id AND chat_id = p_chat_id AND sequence_number >= p_sequence_number;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_old_generated_image()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  status INT;
  content TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT
      INTO status, content
      result.status, result.content
      FROM public.delete_storage_object_from_bucket('generated_images', OLD.image_path) AS result;
    IF status <> 200 THEN
      RAISE WARNING 'Could not delete generated image: % %', status, content;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_storage_object(bucket text, object text, OUT status integer, OUT content text)
 RETURNS record
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  project_url TEXT := 'https://udixafygoiywvupxorvz.supabase.co';
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcmRoaXl3aWdldmxhd2d2bWJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNzI1MjAzMiwiZXhwIjoyMDIyODI4MDMyfQ.rCz1Zqjy0cCZXzW8idiLsjAyz5fZxy7mMQKau02BQ_s'; -- full access needed for http request to storage
  url TEXT := project_url || '/storage/v1/object/' || bucket || '/' || object;
BEGIN
  SELECT
      INTO status, content
           result.status::INT, result.content::TEXT
      FROM extensions.http((
    'DELETE',
    url,
    ARRAY[extensions.http_header('authorization','Bearer ' || service_role_key)],
    NULL,
    NULL)::extensions.http_request) AS result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_assistants_for_user(p_user_id uuid, p_workspace_id uuid)
 RETURNS SETOF assistants
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH user_chats AS (
    SELECT assistant_id, COUNT(*) as chat_count
    FROM chats
    WHERE user_id = p_user_id
    GROUP BY assistant_id
  ),
  workspace_assistants AS (
    SELECT DISTINCT a.id
    FROM assistants a
    JOIN assistant_workspaces aw ON a.id = aw.assistant_id
    WHERE aw.workspace_id = p_workspace_id
  ),
  all_assistants AS (
    SELECT 
      a.*,
      COALESCE(uc.chat_count, 0) as chat_count,
      CASE 
        WHEN uc.assistant_id IS NOT NULL THEN true
        WHEN wa.id IS NOT NULL THEN true
        ELSE false
      END as is_private
    FROM assistants a
    LEFT JOIN user_chats uc ON a.id = uc.assistant_id
    LEFT JOIN workspace_assistants wa ON a.id = wa.id
    WHERE uc.assistant_id IS NOT NULL 
      OR wa.id IS NOT NULL 
      OR a.sharing = 'public'
  )
  SELECT a.*
  FROM all_assistants inner join
    assistants a on a.id = all_assistants.id
  ORDER BY 
    is_private DESC,
    chat_count DESC,
    name ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.non_private_generated_exists(p_name text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM messages
        WHERE (id::text = split_part(p_name, '/', 2)) AND chat_id IN (SELECT id FROM chats WHERE sharing <> 'private')
    );
$function$
;

CREATE OR REPLACE FUNCTION public.search_chats_and_messages(p_workspace_id uuid, p_query text)
 RETURNS SETOF chats
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (c.id) c.*
  FROM chats c
  LEFT JOIN messages m ON c.id = m.chat_id
  WHERE c.workspace_id = p_workspace_id
    AND (
      c.name ILIKE '%' || p_query || '%'
      OR m.content ILIKE '%' || p_query || '%'
    )
  ORDER BY c.id, c.created_at DESC
  LIMIT 100;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now(); 
    RETURN NEW; 
END;
$function$
;

grant delete on table "public"."subdomain_adjectives" to "anon";

grant insert on table "public"."subdomain_adjectives" to "anon";

grant references on table "public"."subdomain_adjectives" to "anon";

grant select on table "public"."subdomain_adjectives" to "anon";

grant trigger on table "public"."subdomain_adjectives" to "anon";

grant truncate on table "public"."subdomain_adjectives" to "anon";

grant update on table "public"."subdomain_adjectives" to "anon";

grant delete on table "public"."subdomain_adjectives" to "authenticated";

grant insert on table "public"."subdomain_adjectives" to "authenticated";

grant references on table "public"."subdomain_adjectives" to "authenticated";

grant select on table "public"."subdomain_adjectives" to "authenticated";

grant trigger on table "public"."subdomain_adjectives" to "authenticated";

grant truncate on table "public"."subdomain_adjectives" to "authenticated";

grant update on table "public"."subdomain_adjectives" to "authenticated";

grant delete on table "public"."subdomain_adjectives" to "service_role";

grant insert on table "public"."subdomain_adjectives" to "service_role";

grant references on table "public"."subdomain_adjectives" to "service_role";

grant select on table "public"."subdomain_adjectives" to "service_role";

grant trigger on table "public"."subdomain_adjectives" to "service_role";

grant truncate on table "public"."subdomain_adjectives" to "service_role";

grant update on table "public"."subdomain_adjectives" to "service_role";

grant delete on table "public"."subdomain_nouns" to "anon";

grant insert on table "public"."subdomain_nouns" to "anon";

grant references on table "public"."subdomain_nouns" to "anon";

grant select on table "public"."subdomain_nouns" to "anon";

grant trigger on table "public"."subdomain_nouns" to "anon";

grant truncate on table "public"."subdomain_nouns" to "anon";

grant update on table "public"."subdomain_nouns" to "anon";

grant delete on table "public"."subdomain_nouns" to "authenticated";

grant insert on table "public"."subdomain_nouns" to "authenticated";

grant references on table "public"."subdomain_nouns" to "authenticated";

grant select on table "public"."subdomain_nouns" to "authenticated";

grant trigger on table "public"."subdomain_nouns" to "authenticated";

grant truncate on table "public"."subdomain_nouns" to "authenticated";

grant update on table "public"."subdomain_nouns" to "authenticated";

grant delete on table "public"."subdomain_nouns" to "service_role";

grant insert on table "public"."subdomain_nouns" to "service_role";

grant references on table "public"."subdomain_nouns" to "service_role";

grant select on table "public"."subdomain_nouns" to "service_role";

grant trigger on table "public"."subdomain_nouns" to "service_role";

grant truncate on table "public"."subdomain_nouns" to "service_role";

grant update on table "public"."subdomain_nouns" to "service_role";

create policy "Allow anonymous read access to public application files"
on "public"."application_files"
as permissive
for select
to public
using ((application_id IN ( SELECT applications.id
   FROM applications
  WHERE (applications.sharing = 'public'::text))));


create policy "Pro subscription required for unlimited messages"
on "public"."messages"
as permissive
for insert
to authenticated
with check ((check_message_limit() OR (user_id IN ( SELECT profiles.user_id
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.plan ~~ 'pro_%'::text))))));



