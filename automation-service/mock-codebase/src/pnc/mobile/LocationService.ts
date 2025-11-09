/**
 * PNC Location Service
 * Handles geolocation, permissions, and location-based features
 *
 * Integration: Device GPS, PNC Privacy Framework
 * Compliance: GLBA, SOC 2, State Privacy Laws
 * Security: Location data encrypted at rest and in transit
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface LocationPermission {
  granted: boolean;
  precision: 'precise' | 'approximate';
  canRequestAgain: boolean;
}

export class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationCoordinates | null = null;
  private watchId: number | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permission from user
   * Complies with GLBA privacy requirements
   */
  async requestPermission(): Promise<LocationPermission> {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });

      return {
        granted: result.state === 'granted',
        precision: 'precise', // PNC requires precise location for branch services
        canRequestAgain: result.state === 'prompt'
      };
    } catch (error) {
      console.error('Permission check failed:', error);
      return {
        granted: false,
        precision: 'approximate',
        canRequestAgain: true
      };
    }
  }

  /**
   * Get current device location
   * Uses high accuracy mode for branch finding
   */
  async getCurrentLocation(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          };

          this.currentLocation = coords;
          this.logLocationAccess(coords); // Audit trail for compliance

          resolve(coords);
        },
        (error) => {
          reject(this.handleLocationError(error));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000 // Cache for 30 seconds
        }
      );
    });
  }

  /**
   * Watch location changes for turn-by-turn navigation
   * Used in PNC Branch Navigator feature
   */
  watchLocation(callback: (coords: LocationCoordinates) => void): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: LocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        };

        callback(coords);
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000
      }
    );

    return this.watchId;
  }

  /**
   * Stop watching location to save battery
   */
  clearWatch(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Used for sorting branches by proximity
   */
  calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) *
        Math.cos(this.toRadians(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Log location access for audit trail
   * Required by PNC Privacy Framework
   */
  private logLocationAccess(coords: LocationCoordinates): void {
    // Send to PNC Audit Service
    fetch('/api/audit/location-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'branch_locator',
        timestamp: coords.timestamp,
        accuracy: coords.accuracy,
        purpose: 'find_nearby_branches'
      })
    }).catch(err => console.error('Audit logging failed:', err));
  }

  private handleLocationError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Location permission denied by user');
      case error.POSITION_UNAVAILABLE:
        return new Error('Location information unavailable');
      case error.TIMEOUT:
        return new Error('Location request timed out');
      default:
        return new Error('Unknown location error');
    }
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
