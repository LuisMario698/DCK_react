-- ============================================================================
-- Demo · Cuentas
-- ----------------------------------------------------------------------------
-- Córrelo DESPUÉS de crear las dos cuentas en Authentication → Users (ver
-- README). Les pone su rol: el puerto como administrador del recinto y la
-- empresa como "Recicladora Mar Bermejo". Se puede correr las veces que sea.
--
-- Si usaste otros correos:
--     select public.demo_configurar_cuentas('otro-puerto@correo.com', 'otra-empresa@correo.com');
-- ============================================================================

select public.demo_configurar_cuentas();
