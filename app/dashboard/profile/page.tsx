export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Perfil de Usuario</h1>
      <p className="text-gray-500 mb-6">Gestiona tu información personal y preferencias</p>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
        <p className="text-sm text-gray-500 mb-4">Actualiza tus datos personales</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nombre</label>
            <input className="w-full border rounded-lg px-3 py-2" placeholder="Tu nombre completo" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input className="w-full border rounded-lg px-3 py-2" placeholder="tu@email.com" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Bio</label>
            <input className="w-full border rounded-lg px-3 py-2" placeholder="Cuéntanos sobre ti..." />
          </div>
        </div>

        <button className="mt-6 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
