-- Create tables for subdomain generation
CREATE TABLE IF NOT EXISTS subdomain_adjectives (
    word TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS subdomain_nouns (
    word TEXT PRIMARY KEY
);

-- Create the function
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
$function$; 