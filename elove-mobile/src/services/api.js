import axios from 'axios';

// Update this to your computer's IP address if testing on a physical device
// For emulator, localhost should work
// To find your IP: Run 'ipconfig' on Windows and look for IPv4 Address
const BASE_URL = 'http://192.168.2.100:5000/api'; // Replace with your actual IP

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User management
  async createUser(userData) {
    try {
      const response = await this.api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUser(userId) {
    try {
      const response = await this.api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAllUsers() {
    try {
      const response = await this.api.get('/users');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUsersToRate(userId) {
    try {
      const response = await this.api.get(`/users/${userId}/discover`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Rating and matching
  async previewRating(ratingData) {
    try {
      const response = await this.api.post('/rate/preview', ratingData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async rateUser(ratingData) {
    try {
      const response = await this.api.post('/rate', ratingData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User analytics
  async getUserStats(userId) {
    try {
      const response = await this.api.get(`/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserMatches(userId) {
    try {
      const response = await this.api.get(`/users/${userId}/matches`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRatingHistory(userId, limit = 50) {
    try {
      const response = await this.api.get(`/users/${userId}/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Leaderboard
  async getLeaderboard() {
    try {
      const response = await this.api.get('/leaderboard');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // App statistics
  async getAppStats() {
    try {
      const response = await this.api.get('/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Photo management
  async uploadPhoto(userId, photoData) {
    try {
      const requestData = {
        user_id: userId,
        photo: photoData.base64 ? `data:image/jpeg;base64,${photoData.base64}` : photoData.uri
      };

      const response = await this.api.post('/photos/upload', requestData, {
        timeout: 30000, // 30 seconds for photo upload
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadMultiplePhotos(userId, photos) {
    try {
      const uploadPromises = photos.map(photo => this.uploadPhoto(userId, photo));
      const results = await Promise.allSettled(uploadPromises);
      
      const successful = [];
      const failed = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push({ photo: photos[index], error: result.reason });
        }
      });
      
      return {
        success: true,
        uploaded: successful,
        failed: failed,
        total: photos.length,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deletePhoto(userId, photoId) {
    try {
      const response = await this.api.delete(`/photos/${photoId}`, {
        data: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async setMainPhoto(userId, photoId) {
    try {
      const response = await this.api.put(`/photos/${photoId}/main`, {
        user_id: userId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserPhotos(userId) {
    try {
      const response = await this.api.get(`/users/${userId}/photos`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data.error || 'Server error',
        status: error.response.status,
      };
    } else if (error.request) {
      // Request was made but no response
      return {
        message: 'Network error - cannot connect to server',
        status: 0,
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'Unknown error',
        status: -1,
      };
    }
  }
}

export default new ApiService();
