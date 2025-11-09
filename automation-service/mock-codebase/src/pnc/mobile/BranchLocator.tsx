/**
 * PNC Branch Locator Component
 * Displays nearby PNC branches with real-time availability and services
 *
 * Integration: PNC Core Banking API, Google Maps Platform
 * Compliance: SOC 2 Type II, PCI-DSS Level 1
 * Customer Segment: Retail, Commercial
 */

import React, { useState, useEffect } from 'react';
import { MapView, Marker } from '@pnc/maps-sdk';
import { BranchService } from '../services/BranchService';
import { useLocation } from '@pnc/location-hook';

interface Branch {
  branchId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  services: string[];
  waitTime: number;
  availability: 'open' | 'busy' | 'closed';
  virtualWalletSupport: boolean;
}

export function BranchLocator() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const { latitude, longitude, error: locationError } = useLocation();

  useEffect(() => {
    if (latitude && longitude) {
      loadNearbyBranches(latitude, longitude);
    }
  }, [latitude, longitude]);

  const loadNearbyBranches = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      // Call PNC Branch API with geolocation
      const response = await BranchService.findNearby({
        latitude: lat,
        longitude: lng,
        radius: 10, // miles
        includeServices: true,
        includeWaitTimes: true
      });

      setBranches(response.branches);
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAppointment = async (branchId: string) => {
    // Integration with PNC Appointment Scheduler
    const appointment = await BranchService.scheduleAppointment({
      branchId,
      customerId: 'current-user', // From auth context
      service: 'general_banking',
      preferredTime: new Date()
    });

    console.log('Appointment scheduled:', appointment);
  };

  return (
    <div className="branch-locator">
      <div className="map-container">
        <MapView
          center={{ lat: latitude, lng: longitude }}
          zoom={12}
        >
          {branches.map(branch => (
            <Marker
              key={branch.branchId}
              position={{ lat: branch.latitude, lng: branch.longitude }}
              onClick={() => setSelectedBranch(branch)}
              icon={getBranchIcon(branch.availability)}
            />
          ))}
        </MapView>
      </div>

      <div className="branch-list">
        <h2>Nearby PNC Branches</h2>
        {loading ? (
          <div>Finding branches near you...</div>
        ) : (
          branches.map(branch => (
            <BranchCard
              key={branch.branchId}
              branch={branch}
              onSchedule={() => handleScheduleAppointment(branch.branchId)}
              onSelect={() => setSelectedBranch(branch)}
            />
          ))
        )}
      </div>

      {selectedBranch && (
        <BranchDetailModal
          branch={selectedBranch}
          onClose={() => setSelectedBranch(null)}
        />
      )}
    </div>
  );
}

function getBranchIcon(availability: Branch['availability']): string {
  switch (availability) {
    case 'open': return '/icons/branch-open.svg';
    case 'busy': return '/icons/branch-busy.svg';
    case 'closed': return '/icons/branch-closed.svg';
  }
}

interface BranchCardProps {
  branch: Branch;
  onSchedule: () => void;
  onSelect: () => void;
}

function BranchCard({ branch, onSchedule, onSelect }: BranchCardProps) {
  return (
    <div className="branch-card" onClick={onSelect}>
      <h3>{branch.name}</h3>
      <p className="address">{branch.address}</p>
      <p className="distance">{branch.distance.toFixed(1)} miles away</p>

      <div className="services">
        {branch.virtualWalletSupport && (
          <span className="badge">Virtual Wallet</span>
        )}
        {branch.services.slice(0, 3).map(service => (
          <span key={service} className="badge">{service}</span>
        ))}
      </div>

      <div className="availability">
        <StatusBadge status={branch.availability} />
        {branch.availability === 'open' && (
          <span className="wait-time">~{branch.waitTime} min wait</span>
        )}
      </div>

      <button onClick={(e) => { e.stopPropagation(); onSchedule(); }}>
        Schedule Appointment
      </button>
    </div>
  );
}
