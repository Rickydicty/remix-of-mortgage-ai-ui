-- Update the handle_new_user function to check for role in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requested_role text;
  final_role app_role;
BEGIN
  -- Get the requested role from metadata, default to 'client'
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  
  -- Validate the role (only allow 'client' or 'broker' from signup)
  IF requested_role = 'broker' THEN
    final_role := 'broker';
  ELSE
    final_role := 'client';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, final_role);
  RETURN NEW;
END;
$$;