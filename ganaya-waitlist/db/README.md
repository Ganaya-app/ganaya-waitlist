# GanáYa — Schema

`schema.sql` define el modelo de datos del MVP. Convive con la tabla `waitlist` ya existente.

## Aplicar

1. Abrir Supabase dashboard del project `tpfubpkfajoyfygdqfpv`.
2. Ir a **SQL Editor** → **New query**.
3. Pegar el contenido de `schema.sql` y ejecutar.
4. Verificar en **Table editor** que aparezcan: `profiles`, `offers`, `offer_completions`, `wallet_transactions`, `redemptions`, `referrals`, `anti_fraud_events`, `device_fingerprints`, `admin_actions`.

## Bootstrap del primer admin

Después de aplicar el schema y de hacer login al menos una vez con tu número (Bloque 2), correr:

```sql
update profiles set role = 'admin' where phone = '+54 9 XX XXXX XXXX';
```

## Notas

- El schema asume que la tabla `waitlist` del landing actual ya existe en el mismo project.
- Migración de waitlist → profiles se construye en Bloque 3.
- RLS está activo en todas las tablas del producto. Cualquier query desde el frontend pasa por las policies definidas.
