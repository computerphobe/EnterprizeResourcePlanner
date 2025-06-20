const mongoose = require("mongoose");
const Client = mongoose.model("Client");

/**
 * Utility functions for managing clients in the ERP system
 */

/**
 * Find a client by various identifiers
 * @param {string} identifier - Can be MongoDB ObjectId, userId, email, or name
 * @returns {Object|null} - Client document or null if not found
 */
const findClientByIdentifier = async (identifier) => {
  try {
    // Try different ways to find the client
    const client = await Client.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(identifier) ? identifier : null },
        { userId: identifier },
        { email: identifier },
        { name: { $regex: new RegExp(identifier, 'i') } } // Case insensitive name search
      ],
      removed: false
    });

    return client;
  } catch (error) {
    console.error('Error finding client by identifier:', error);
    return null;
  }
};

/**
 * Create a new client with the given information
 * @param {Object} clientData - Client information
 * @returns {Object|null} - Created client document or null if failed
 */
const createNewClient = async (clientData) => {
  try {
    const newClientData = {
      name: clientData.name || `Client-${clientData.userId || Date.now()}`,
      email: clientData.email || null,
      phone: clientData.phone || null,
      country: clientData.country || null,
      address: clientData.address || null,
      userId: clientData.userId || null,
      enabled: true,
      removed: false,
      created: new Date(),
      updated: new Date(),
      createdBy: clientData.createdBy || null
    };

    const newClient = new Client(newClientData);
    await newClient.save();
    
    console.log(`✅ Created new client: ${newClient.name} (ID: ${newClient._id})`);
    return newClient;
    
  } catch (error) {
    console.error('Error creating new client:', error);
    return null;
  }
};

/**
 * Find or create a client by user ID with additional user information
 * @param {string} userId - User ID to search for
 * @param {Object} userInfo - Additional user information for client creation
 * @returns {Object|null} - Client document or null if failed
 */
const findOrCreateClientByUserId = async (userId, userInfo = {}) => {
  try {
    // First, try to find existing client
    let client = await findClientByIdentifier(userId);

    if (client) {
      console.log(`✅ Found existing client: ${client.name} (ID: ${client._id})`);
      return client;
    }

    // If no client found, create a new one
    console.log(`🔄 No client found for user ID: ${userId}. Creating new client...`);
    
    const clientData = {
      userId: userId,
      name: userInfo.name || `Client-${userId}`,
      email: userInfo.email || null,
      phone: userInfo.phone || null,
      country: userInfo.country || null,
      address: userInfo.address || null,
      createdBy: userInfo.createdBy || null
    };

    return await createNewClient(clientData);
    
  } catch (error) {
    console.error('Error in findOrCreateClientByUserId:', error);
    return null;
  }
};

/**
 * Update client information
 * @param {string} clientId - Client ID to update
 * @param {Object} updateData - Data to update
 * @returns {Object|null} - Updated client document or null if failed
 */
const updateClientInfo = async (clientId, updateData) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      {
        ...updateData,
        updated: new Date()
      },
      { new: true, runValidators: true }
    );

    if (updatedClient) {
      console.log(`✅ Updated client: ${updatedClient.name} (ID: ${updatedClient._id})`);
    }

    return updatedClient;
  } catch (error) {
    console.error('Error updating client:', error);
    return null;
  }
};

/**
 * Get client statistics
 * @returns {Object} - Client statistics
 */
const getClientStats = async () => {
  try {
    const totalClients = await Client.countDocuments({ removed: false });
    const enabledClients = await Client.countDocuments({ removed: false, enabled: true });
    const disabledClients = await Client.countDocuments({ removed: false, enabled: false });
    const recentClients = await Client.countDocuments({
      removed: false,
      created: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    return {
      total: totalClients,
      enabled: enabledClients,
      disabled: disabledClients,
      recentlyCreated: recentClients
    };
  } catch (error) {
    console.error('Error getting client stats:', error);
    return null;
  }
};

module.exports = {
  findClientByIdentifier,
  createNewClient,
  findOrCreateClientByUserId,
  updateClientInfo,
  getClientStats
};
