const User = require('../models/User');

class UserProvider {
  // Crear usuario
  async create(data) {
    return await User.create(data);
  }

  // Obtener todos los usuarios
  async getAll() {
    return await User.find().select('-password').sort({ createdAt: -1 });
  }

  // Obtener usuario por ID
  async getById(id) {
    return await User.findById(id).select('-password');
  }

  // Obtener usuario por email
  async getByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  // Obtener usuario por username
  async getByUsername(username) {
    return await User.findOne({ username: username });
  }

  // Actualizar usuario
  async update(id, data) {
    // No permitir actualizar la contraseña directamente
    if (data.password) {
      delete data.password;
    }
    return await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
  }

  // Eliminar usuario (soft delete) con eliminación en cascada
  async delete(id) {
    const session = await User.startSession();
    
    try {
      await session.withTransaction(async () => {
        // 1. Eliminar preferencias del usuario
        const UserPreferences = require('../models/UserPreferences');
        await UserPreferences.deleteMany({ userId: id }).session(session);
        console.log(`🗑️ Eliminadas preferencias del usuario ${id}`);
        
        // 2. Eliminar notificaciones del usuario
        const Notification = require('../models/Notification');
        await Notification.deleteMany({ userId: id }).session(session);
        console.log(`🗑️ Eliminadas notificaciones del usuario ${id}`);
        
        // 3. Eliminar el usuario
        const deletedUser = await User.findByIdAndDelete(id).session(session);
        console.log(`🗑️ Usuario ${id} eliminado exitosamente`);
        
        return deletedUser;
      });
      
      // Retornar el usuario eliminado
      return await User.findById(id);
    } catch (error) {
      console.error('Error eliminando usuario en cascada:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Eliminar usuario permanentemente
  async deletePermanent(id) {
    return await User.findByIdAndDelete(id);
  }

  // Verificar si el email existe
  async emailExists(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  }

  // Verificar si el username existe
  async usernameExists(username) {
    const user = await User.findOne({ username: username });
    return !!user;
  }

  // Buscar usuarios por criterio
  async search(criteria) {
    const query = {
      $or: [
        { username: { $regex: criteria, $options: 'i' } },
        { email: { $regex: criteria, $options: 'i' } }
      ]
    };
    return await User.find(query).select('-password').sort({ createdAt: -1 });
  }
}

module.exports = new UserProvider();
