-- Function to generate random subdomains for applications
CREATE OR REPLACE FUNCTION public.generate_random_subdomain()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    chars text[] := '{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,0,1,2,3,4,5,6,7,8,9}';
    result text := '';
    i integer := 0;
BEGIN
    FOR i IN 1..10 LOOP
        result := result || chars[1+random()*(array_length(chars, 1)-1)];
    END LOOP;
    RETURN result;
END;
$function$; 