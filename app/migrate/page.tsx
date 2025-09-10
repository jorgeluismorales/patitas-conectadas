"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [sqlCode] = useState(`-- MIGRACIÓN COMPLETA: Usuarios, Profiles y Administradores
-- Ejecuta este script completo en Supabase SQL Editor

-- 1. CREAR PROFILES PARA USUARIOS EXISTENTES
INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'full_name', 'Usuario'),
  au.email,
  au.created_at,
  now()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2. AGREGAR COLUMNAS DE BANEO SI NO EXISTEN
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_by uuid REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason text;

-- 3. CREAR TABLA ADMIN_USERS SI NO EXISTE
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ENABLE RLS EN ADMIN_USERS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS PARA ADMIN_USERS
DROP POLICY IF EXISTS "admin_users_select_own" ON public.admin_users;
CREATE POLICY "admin_users_select_own"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = id);

-- 6. CREAR USUARIO ADMINISTRADOR ESPECÍFICO
-- ⚠️ CAMBIA 'jorge31703@gmail.com' POR TU EMAIL ⚠️
INSERT INTO public.admin_users (id, role)
SELECT id, 'super_admin'
FROM auth.users 
WHERE email = 'jorge31703@gmail.com'  -- CAMBIA ESTE EMAIL AL TUYO
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- 7. ASEGURAR QUE EL ADMIN TENGA PROFILE
INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'full_name', 'Administrador'),
  au.email,
  au.created_at,
  now()
FROM auth.users au
WHERE au.email = 'jorge31703@gmail.com'  -- CAMBIA ESTE EMAIL AL TUYO
ON CONFLICT (id) DO NOTHING;

-- 8. VERIFICAR RESULTADOS
SELECT 'Total profiles created:' as description, count(*) as count FROM public.profiles
UNION ALL
SELECT 'Total admin users:' as description, count(*) as count FROM public.admin_users
UNION ALL
SELECT 'Banned users:' as description, count(*) as count FROM public.profiles WHERE banned = true;`)

  const supabase = createClient()

  const showMessage = (text: string, isError: boolean = false) => {
    setMessage(text)
    setTimeout(() => setMessage(""), 5000)
  }

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('publications')
        .select('id')
        .limit(1)

      if (error) {
        showMessage(`❌ Error de conexión: ${error.message}`, true)
      } else {
        showMessage("✅ Conexión exitosa a la base de datos")
      }
    } catch (error: any) {
      showMessage(`❌ Error: ${error.message}`, true)
    } finally {
      setIsLoading(false)
    }
  }

  const testProfiles = async () => {
    setIsLoading(true)
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, banned')
        .limit(10)

      if (error) {
        showMessage(`❌ Error accediendo a profiles: ${error.message}`, true)
      } else {
        const bannedCount = profiles.filter(p => p.banned).length
        showMessage(`✅ Profiles encontrados: ${profiles.length} total, ${bannedCount} baneados`)
      }
    } catch (error: any) {
      showMessage(`❌ Error: ${error.message}`, true)
    } finally {
      setIsLoading(false)
    }
  }

  const testAdminAccess = async () => {
    setIsLoading(true)
    try {
      const { data: adminUsers, error } = await supabase
        .from('admin_users')
        .select('id, role')
        .limit(10)

      if (error) {
        showMessage(`❌ Error accediendo a admin_users: ${error.message}`, true)
      } else {
        showMessage(`✅ Admin users encontrados: ${adminUsers.length}`)
      }
    } catch (error: any) {
      showMessage(`❌ Error: ${error.message}`, true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔧 Migración: Crear profiles, admins y sistema de baneos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              <strong>Problema:</strong> Los usuarios no tienen profiles y no hay 
              usuarios administradores configurados. Esto causa errores 404 en el panel de admin.
            </p>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? "Probando..." : "Probar conexión"}
            </Button>
            
            <Button 
              onClick={testProfiles} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? "Verificando..." : "Verificar profiles"}
            </Button>
            
            <Button 
              onClick={testAdminAccess} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? "Verificando..." : "Verificar admins"}
            </Button>
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${message.includes('❌') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {message}
            </div>
          )}
          
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <p className="font-medium mb-2">Instrucciones para arreglar el sistema completo:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Primero verifica que puedas conectarte con "Probar conexión"</li>
              <li>Verifica si existen profiles con "Verificar profiles" (debería ser 0)</li>
              <li>Verifica si existen admins con "Verificar admins" (debería ser 0)</li>
              <li><strong>IMPORTANTE:</strong> Edita el SQL abajo y cambia 'jorge31703@gmail.com' por tu email</li>
              <li>Ve a tu proyecto en Supabase → SQL Editor → pega el código completo</li>
              <li>Ejecuta el SQL y vuelve aquí para verificar todo de nuevo</li>
              <li>Intenta acceder a /admin con tu usuario administrador</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📝 SQL para migrar usuarios y configurar sistema de baneos</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={sqlCode}
            className="min-h-96 font-mono text-sm"
            readOnly
          />
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✅ Esta migración:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-green-700 mt-2 space-y-1">
              <li>Crea profiles para usuarios existentes en auth.users</li>
              <li>Crea la tabla admin_users y políticas de seguridad</li>
              <li>Convierte al usuario especificado en administrador</li>
              <li>Agrega columnas de baneos si no existen</li>
              <li>Permite que el sistema de baneos funcione correctamente</li>
              <li>Soluciona el error 404 en el panel de administración</li>
            </ul>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>🔧 Para aplicar esta migración:</strong>
            </p>
            <ol className="list-decimal list-inside text-sm text-yellow-700 mt-2 space-y-1">
              <li><strong>Edita el SQL:</strong> Cambia 'jorge31703@gmail.com' por tu email de admin</li>
              <li>Ve a tu proyecto en Supabase Dashboard</li>
              <li>Navega a "SQL Editor"</li>
              <li>Copia y pega TODO el código de arriba</li>
              <li>Haz clic en "Run" para ejecutar</li>
              <li>Vuelve aquí y haz clic en "Verificar profiles" y "Verificar admins"</li>
              <li>Intenta acceder a /admin - ya no debería dar 404</li>
              <li>Banea usuarios y prueba que el sistema funcione</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}