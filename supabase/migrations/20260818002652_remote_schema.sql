set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, notion_name, user_role, project_name, assessoria)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'notion_name',
    new.raw_user_meta_data ->> 'user_role',
    new.raw_user_meta_data ->> 'project_name',
    new.raw_user_meta_data ->> 'assessoria'
  );
  return new;
end;
$function$
;


